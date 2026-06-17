import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertPersistenceService } from 'src/alerts/alert-persistence.service';
import { TireData, TireSensorReading } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTireSensorReadingDto } from 'src/tire-sensor/dto/create-tire-sensor-reading.dto';
import { TiresService } from 'src/tires/tires.service';
import {
  UserTiresService,
  UserTireWithProduct,
} from 'src/tires/user-tires.service';
import { TireHealthAnalysisResult } from './types/tire-health-analysis-result';

@Injectable()
export class TireHealthService {
  constructor(
    private readonly userTiresService: UserTiresService,
    private readonly tiresService: TiresService,
    private readonly alertPersistenceService: AlertPersistenceService,
    private readonly prisma: PrismaService,
  ) {}

  async analyzeSensorReading(reading: CreateTireSensorReadingDto) {
    const userTire = await this.userTiresService.findByDeviceId(
      reading.deviceId,
    );

    if (!userTire) {
      throw new NotFoundException('No user tire found for this sensor device');
    }

    const tireProduct = await this.getTireProduct(userTire);
    const measuredAt = reading.measuredAt
      ? new Date(reading.measuredAt)
      : new Date();
    const previousReadings = await this.findPreviousReadings(
      reading.deviceId,
      measuredAt,
    );
    const analysis = this.computeAnalysis(
      reading,
      tireProduct,
      previousReadings,
    );
    let alertCreated = false;

    if (analysis.shouldCreateAlert && analysis.alertType) {
      alertCreated = await this.createAlertFromAnalysis(userTire.id, analysis);
    }

    await this.saveReading(userTire.id, reading, measuredAt);

    return {
      deviceId: reading.deviceId,
      userTireId: userTire.id,
      tireProductName: tireProduct.model,
      pressureBar: reading.pressureBar,
      temperatureC: reading.temperatureC,
      measuredAt: measuredAt.toISOString(),
      status: analysis.status,
      alertType: analysis.alertType,
      severity: analysis.severity,
      message: analysis.message,
      recommendedAction: analysis.recommendedAction,
      alertCreated,
    };
  }

  private async getTireProduct(userTire: UserTireWithProduct) {
    if (userTire.tire) {
      return userTire.tire;
    }

    if (!userTire.tireId) {
      throw new NotFoundException(
        'No Michelin tire product linked to user tire',
      );
    }

    const tireProduct = await this.tiresService.findById(userTire.tireId);

    if (!tireProduct) {
      throw new NotFoundException('No Michelin tire product found');
    }

    return tireProduct;
  }

  private computeAnalysis(
    reading: CreateTireSensorReadingDto,
    tireProduct: TireData,
    previousReadings: TireSensorReading[],
  ): TireHealthAnalysisResult {
    const pressure = reading.pressureBar;

    if (previousReadings.length > 0) {
      const slowLeakAnalysis = this.computeSlowLeakAnalysis(
        reading,
        previousReadings,
      );

      if (slowLeakAnalysis) {
        return slowLeakAnalysis;
      }

      const abnormalDropAnalysis = this.computeAbnormalPressureDropAnalysis(
        reading,
        previousReadings[0],
      );

      if (abnormalDropAnalysis) {
        return abnormalDropAnalysis;
      }
    }

    if (pressure < tireProduct.minPressure) {
      return {
        status: 'warning',
        shouldCreateAlert: true,
        alertType: 'PRESSURE_TOO_LOW',
        severity: 'warning',
        message:
          'La pression du pneu est inférieure à la recommandation Michelin.',
        recommendedAction: 'Regonfler le pneu',
      };
    }

    if (pressure > tireProduct.maxPressure) {
      return {
        status: 'warning',
        shouldCreateAlert: true,
        alertType: 'PRESSURE_TOO_HIGH',
        severity: 'warning',
        message:
          'La pression du pneu est supérieure à la recommandation Michelin.',
        recommendedAction: 'Adapter la pression selon votre pratique.',
      };
    }

    return {
      status: 'good',
      shouldCreateAlert: false,
      alertType: null,
      severity: null,
      message: 'Pression conforme aux recommandations Michelin.',
      recommendedAction: 'Continuer le suivi.',
    };
  }

  private computeSlowLeakAnalysis(
    reading: CreateTireSensorReadingDto,
    previousReadings: TireSensorReading[],
  ): TireHealthAnalysisResult | null {
    if (previousReadings.length < 2) {
      return null;
    }

    const lastThreeReadings = [
      previousReadings[1],
      previousReadings[0],
      {
        pressureBar: reading.pressureBar,
        temperatureC: reading.temperatureC,
      },
    ];
    const [oldestReading, middleReading, currentReading] = lastThreeReadings;
    const pressureIsDecreasing =
      oldestReading.pressureBar > middleReading.pressureBar &&
      middleReading.pressureBar > currentReading.pressureBar;
    const totalPressureDrop =
      oldestReading.pressureBar - currentReading.pressureBar;
    const temperatures = lastThreeReadings.map(
      (sensorReading) => sensorReading.temperatureC,
    );
    const temperatureVariation =
      Math.max(...temperatures) - Math.min(...temperatures);

    if (
      pressureIsDecreasing &&
      totalPressureDrop >= 0.8 &&
      temperatureVariation <= 5
    ) {
      return {
        status: 'critical',
        shouldCreateAlert: true,
        alertType: 'SLOW_LEAK_SUSPECTED',
        severity: 'critical',
        message: 'Suspicion de crevaison lente détectée sur plusieurs mesures.',
        recommendedAction:
          'Contrôler le pneu et rechercher une fuite avant de rouler.',
      };
    }

    return null;
  }

  private computeAbnormalPressureDropAnalysis(
    reading: CreateTireSensorReadingDto,
    previousReading: TireSensorReading,
  ): TireHealthAnalysisResult | null {
    const pressureDrop = previousReading.pressureBar - reading.pressureBar;
    const temperatureVariation = Math.abs(
      previousReading.temperatureC - reading.temperatureC,
    );

    if (pressureDrop >= 0.5 && temperatureVariation <= 5) {
      return {
        status: 'warning',
        shouldCreateAlert: true,
        alertType: 'ABNORMAL_PRESSURE_DROP',
        severity: 'warning',
        message: 'Baisse de pression anormale détectée entre deux mesures.',
        recommendedAction:
          "Contrôler la pression et vérifier l'évolution à la prochaine mesure.",
      };
    }

    return null;
  }

  private findPreviousReadings(deviceId: string, measuredAt: Date) {
    return this.prisma.tireSensorReading.findMany({
      where: {
        deviceId,
        measuredAt: {
          lt: measuredAt,
        },
      },
      orderBy: {
        measuredAt: 'desc',
      },
      take: 2,
    });
  }

  private saveReading(
    userTireId: number,
    reading: CreateTireSensorReadingDto,
    measuredAt: Date,
  ) {
    return this.prisma.tireSensorReading.create({
      data: {
        deviceId: reading.deviceId,
        userTireId,
        pressureBar: reading.pressureBar,
        temperatureC: reading.temperatureC,
        measuredAt,
      },
    });
  }

  private async createAlertFromAnalysis(
    userTireId: number,
    analysis: TireHealthAnalysisResult,
  ): Promise<boolean> {
    if (!analysis.alertType) {
      return false;
    }

    const existingAlert = await this.alertPersistenceService.findActiveAlert(
      userTireId,
      analysis.alertType,
    );

    if (existingAlert) {
      return false;
    }

    await this.alertPersistenceService.createAlert(
      userTireId,
      analysis.alertType,
      `${this.getAlertTitle(analysis.alertType)} - ${analysis.message} ${analysis.recommendedAction}`,
    );

    return true;
  }

  private getAlertTitle(alertType: string) {
    switch (alertType) {
      case 'PRESSURE_TOO_LOW':
        return 'Pression trop basse';
      case 'PRESSURE_TOO_HIGH':
        return 'Pression trop élevée';
      case 'ABNORMAL_PRESSURE_DROP':
        return 'Baisse de pression anormale';
      case 'SLOW_LEAK_SUSPECTED':
        return 'Suspicion de crevaison lente';
      default:
        return 'Alerte pneu';
    }
  }
}
