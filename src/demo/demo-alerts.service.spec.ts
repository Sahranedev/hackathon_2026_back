import { DemoAlertsService } from './demo-alerts.service';

describe('DemoAlertsService', () => {
  const baseTime = new Date('2026-06-18T10:00:00.000Z');
  const tire = {
    id: 10,
    userId: 7,
    deviceId: 'demo-rear-001',
    tire: {
      id: 1,
      model: 'Michelin Test',
      terrainTypes: [],
      minPressure: 3,
      maxPressure: 5,
      maxKilometers: 3000,
    },
  };

  function createTestContext() {
    const prisma = {
      userTire: {
        findUnique: jest.fn(({ where }) =>
          Promise.resolve(where.deviceId === tire.deviceId ? tire : null),
        ),
      },
      alert: {
        deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
      },
      tireSensorReading: {
        deleteMany: jest.fn(() => Promise.resolve({ count: 2 })),
      },
    };
    const tireSensorService = {
      handleReading: jest.fn((reading) =>
        Promise.resolve({
          ...reading,
          alertType: reading.pressureBar === 3.3 ? 'SLOW_LEAK_SUSPECTED' : null,
        }),
      ),
    };
    const service = new DemoAlertsService(
      prisma as any,
      tireSensorService as any,
    );

    return {
      prisma,
      service,
      tireSensorService,
    };
  }

  beforeEach(() => {
    process.env.DEMO_ALERTS_ENABLED = 'true';
    process.env.DEMO_ALERTS_ACTIVITY_DELAY_SECONDS = '60';
    process.env.DEMO_ALERTS_RUNS = '1';
    process.env.DEMO_ALERTS_DEVICE_ID = 'demo-rear-001';
    jest.useFakeTimers();
    jest.setSystemTime(baseTime);
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.DEMO_ALERTS_ENABLED;
    delete process.env.DEMO_ALERTS_ACTIVITY_DELAY_SECONDS;
    delete process.env.DEMO_ALERTS_RUNS;
    delete process.env.DEMO_ALERTS_DEVICE_ID;
  });

  it('sends the alert-triggering reading at the end of the activity delay', async () => {
    const { service, tireSensorService } = createTestContext();

    service.handleActivityStarted({
      userId: 7,
      activityId: 44,
    });

    await service.handleScenarioTick();
    expect(tireSensorService.handleReading).toHaveBeenCalledTimes(1);
    expect(tireSensorService.handleReading).toHaveBeenLastCalledWith(
      expect.objectContaining({
        deviceId: 'demo-rear-001',
        pressureBar: 4.2,
      }),
    );

    jest.setSystemTime(new Date(baseTime.getTime() + 30_000));
    await service.handleScenarioTick();
    expect(tireSensorService.handleReading).toHaveBeenCalledTimes(2);
    expect(tireSensorService.handleReading).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pressureBar: 3.8,
      }),
    );

    jest.setSystemTime(new Date(baseTime.getTime() + 60_000));
    await service.handleScenarioTick();
    expect(tireSensorService.handleReading).toHaveBeenCalledTimes(3);
    expect(tireSensorService.handleReading).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pressureBar: 3.3,
      }),
    );
    expect(service.getStatus()).toMatchObject({
      running: false,
      completedRuns: 1,
    });
  });
});
