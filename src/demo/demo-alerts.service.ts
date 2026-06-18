import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { ACTIVITY_STARTED } from 'src/common/events/app-events';
import type { ActivityStartedEvent } from 'src/common/events/app-events';
import { TireData } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TireSensorService } from 'src/tire-sensor/tire-sensor.service';

const SLOW_LEAK_ALERT_TYPE = 'SLOW_LEAK_SUSPECTED';
const DEFAULT_DEMO_DEVICE_ID = 'demo-rear-001';
const SLOW_LEAK_PRESSURE_DROP = 0.9;

type DemoUserTire = {
  id: number;
  userId: number | null;
  deviceId: string | null;
  tire: TireData | null;
};

type StartSlowLeakOptions = {
  totalDelaySeconds?: number;
  userId?: number;
  activityId?: number;
};

@Injectable()
export class DemoAlertsService {
  private readonly logger = new Logger(DemoAlertsService.name);
  private readonly enabled = process.env.DEMO_ALERTS_ENABLED === 'true';
  private readonly activityDelayMs = this.readSeconds(
    'DEMO_ALERTS_ACTIVITY_DELAY_SECONDS',
    60,
  );
  private readonly maxActivityTriggers = this.readPositiveInt(
    'DEMO_ALERTS_RUNS',
    1,
  );
  private readonly configuredDeviceId =
    process.env.DEMO_ALERTS_DEVICE_ID?.trim() || DEFAULT_DEMO_DEVICE_ID;

  private running = false;
  private ticking = false;
  private completedRuns = 0;
  private stepIndex = 0;
  private scenarioStartedAt: number | null = null;
  private scenarioDelayMs = this.activityDelayMs;
  private deviceId: string | null = this.configuredDeviceId;
  private targetUserId: number | null = null;
  private targetActivityId: number | null = null;
  private lastResult: unknown = null;
  private lastError: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tireSensorService: TireSensorService,
  ) {}

  getStatus() {
    return {
      enabled: this.enabled,
      running: this.running,
      completedRuns: this.completedRuns,
      maxActivityTriggers: this.maxActivityTriggers,
      stepIndex: this.stepIndex,
      startedAt: this.scenarioStartedAt
        ? new Date(this.scenarioStartedAt).toISOString()
        : null,
      expectedAlertAt: this.scenarioStartedAt
        ? new Date(this.scenarioStartedAt + this.scenarioDelayMs).toISOString()
        : null,
      activityDelaySeconds: this.scenarioDelayMs / 1000,
      deviceId: this.deviceId,
      targetUserId: this.targetUserId,
      targetActivityId: this.targetActivityId,
      lastResult: this.lastResult,
      lastError: this.lastError,
    };
  }

  startSlowLeakScenario(options: StartSlowLeakOptions = {}) {
    this.assertEnabled();

    this.running = true;
    this.stepIndex = 0;
    this.scenarioStartedAt = Date.now();
    this.scenarioDelayMs =
      this.normalizeDelaySeconds(options.totalDelaySeconds) * 1000;
    this.targetUserId = options.userId ?? null;
    this.targetActivityId = options.activityId ?? null;
    this.lastResult = null;
    this.lastError = null;

    return this.getStatus();
  }

  async resetSlowLeakScenario() {
    this.assertEnabled();

    const demoTire = await this.resolveDemoTire(this.targetUserId);
    await this.clearDemoState(demoTire);

    this.running = false;
    this.completedRuns = 0;
    this.stepIndex = 0;
    this.scenarioStartedAt = null;
    this.scenarioDelayMs = this.activityDelayMs;
    this.targetUserId = null;
    this.targetActivityId = null;
    this.lastResult = null;
    this.lastError = null;

    return this.getStatus();
  }

  @OnEvent(ACTIVITY_STARTED)
  handleActivityStarted(event: ActivityStartedEvent) {
    if (!this.enabled) {
      return;
    }

    if (this.running || this.completedRuns >= this.maxActivityTriggers) {
      return;
    }

    this.startSlowLeakScenario({
      userId: event.userId,
      activityId: event.activityId,
      totalDelaySeconds: this.activityDelayMs / 1000,
    });
  }

  @Interval(1000)
  async handleScenarioTick() {
    if (!this.enabled || !this.running || this.ticking) {
      return;
    }

    if (!this.isCurrentStepDue()) {
      return;
    }

    this.ticking = true;

    try {
      const demoTire = await this.resolveDemoTire(this.targetUserId);

      if (this.stepIndex === 0) {
        await this.clearDemoState(demoTire);
      }

      const result = await this.emitSlowLeakReading(demoTire, this.stepIndex);
      this.lastResult = result;
      this.stepIndex += 1;

      if (this.stepIndex >= 3) {
        this.completedRuns += 1;
        this.running = false;
        this.scenarioStartedAt = null;
      }
    } catch (error) {
      this.running = false;
      this.scenarioStartedAt = null;
      this.lastError =
        error instanceof Error ? error.message : 'Unknown demo scenario error';
      this.logger.error(this.lastError);
    } finally {
      this.ticking = false;
    }
  }

  private isCurrentStepDue() {
    if (this.scenarioStartedAt === null) {
      return false;
    }

    return Date.now() >= this.scenarioStartedAt + this.getStepOffsetMs();
  }

  private getStepOffsetMs() {
    if (this.stepIndex <= 0) {
      return 0;
    }

    if (this.stepIndex === 1) {
      return this.scenarioDelayMs / 2;
    }

    return this.scenarioDelayMs;
  }

  private async emitSlowLeakReading(demoTire: DemoUserTire, stepIndex: number) {
    const deviceId = this.requireDeviceId(demoTire);
    const pressures = this.buildSlowLeakPressures(demoTire.tire);
    const temperatures = [22, 23, 22];

    return this.tireSensorService.handleReading({
      deviceId,
      pressureBar: pressures[stepIndex],
      temperatureC: temperatures[stepIndex],
      measuredAt: new Date().toISOString(),
    });
  }

  private async resolveDemoTire(userId: number | null): Promise<DemoUserTire> {
    if (this.configuredDeviceId) {
      const configuredTire = await this.prisma.userTire.findUnique({
        where: { deviceId: this.configuredDeviceId },
        include: { tire: true },
      });

      if (
        configuredTire?.tire &&
        (!userId || configuredTire.userId === userId)
      ) {
        this.deviceId = configuredTire.deviceId;
        return configuredTire;
      }
    }

    const userFilter = userId ? { userId } : {};
    const rearCandidate = await this.prisma.userTire.findFirst({
      where: {
        ...userFilter,
        isActive: true,
        tireId: { not: null },
        position: 'REAR',
      },
      include: { tire: true },
      orderBy: { id: 'asc' },
    });

    const candidate =
      rearCandidate ??
      (await this.prisma.userTire.findFirst({
        where: {
          ...userFilter,
          isActive: true,
          tireId: { not: null },
        },
        include: { tire: true },
        orderBy: { id: 'asc' },
      }));

    if (!candidate?.tire) {
      throw new NotFoundException(
        'No active user tire with a Michelin tire product found for demo mode.',
      );
    }

    const deviceId = await this.resolveAssignableDeviceId(candidate.id);
    const demoTire = await this.prisma.userTire.update({
      where: { id: candidate.id },
      data: {
        deviceId,
        smartTire: true,
        isActive: true,
      },
      include: { tire: true },
    });

    this.deviceId = demoTire.deviceId;
    return demoTire;
  }

  private async resolveAssignableDeviceId(userTireId: number) {
    const owner = await this.prisma.userTire.findUnique({
      where: { deviceId: this.configuredDeviceId },
      select: { id: true },
    });

    if (!owner || owner.id === userTireId) {
      return this.configuredDeviceId;
    }

    return `${DEFAULT_DEMO_DEVICE_ID}-${userTireId}`;
  }

  private async clearDemoState(demoTire: DemoUserTire) {
    const deviceId = this.requireDeviceId(demoTire);

    await this.prisma.alert.deleteMany({
      where: {
        userTireId: demoTire.id,
        code: SLOW_LEAK_ALERT_TYPE,
      },
    });

    await this.prisma.tireSensorReading.deleteMany({
      where: {
        deviceId,
      },
    });
  }

  private buildSlowLeakPressures(tire: TireData | null) {
    if (!tire) {
      return [4.5, 4.1, 3.6];
    }

    const startPressure = Math.max(
      tire.minPressure + SLOW_LEAK_PRESSURE_DROP,
      Math.min(tire.minPressure + 1.2, tire.maxPressure - 0.1),
    );

    return [
      this.roundPressure(startPressure),
      this.roundPressure(startPressure - 0.4),
      this.roundPressure(startPressure - SLOW_LEAK_PRESSURE_DROP),
    ];
  }

  private requireDeviceId(demoTire: DemoUserTire) {
    if (!demoTire.deviceId) {
      throw new NotFoundException('Demo tire has no deviceId.');
    }

    return demoTire.deviceId;
  }

  private assertEnabled() {
    if (!this.enabled) {
      throw new ForbiddenException(
        'Demo alerts are disabled. Set DEMO_ALERTS_ENABLED=true to use this scenario.',
      );
    }
  }

  private normalizeDelaySeconds(delaySeconds?: number) {
    if (typeof delaySeconds !== 'number' || Number.isNaN(delaySeconds)) {
      return this.activityDelayMs / 1000;
    }

    return Math.max(1, delaySeconds);
  }

  private readSeconds(name: string, fallbackSeconds: number) {
    const rawValue = Number(process.env[name]);

    if (Number.isNaN(rawValue) || rawValue < 0) {
      return fallbackSeconds * 1000;
    }

    return rawValue * 1000;
  }

  private readPositiveInt(name: string, fallback: number) {
    const rawValue = Number(process.env[name]);

    if (Number.isNaN(rawValue) || rawValue < 1) {
      return fallback;
    }

    return Math.floor(rawValue);
  }

  private roundPressure(pressureBar: number) {
    return Math.round(pressureBar * 10) / 10;
  }
}
