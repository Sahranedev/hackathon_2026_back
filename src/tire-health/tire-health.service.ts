import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertPersistenceService } from 'src/alerts/alert-persistence.service';
import { TireData } from 'src/generated/prisma/client';
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
  ) {}

  async analyzeSensorReading(reading: CreateTireSensorReadingDto) {
    const userTire = await this.userTiresService.findByDeviceId(
      reading.deviceId,
    );

    if (!userTire) {
      throw new NotFoundException('No user tire found for this sensor device');
    }

    const tireProduct = await this.getTireProduct(userTire);
    const analysis = this.computeAnalysis(reading, tireProduct);
    let alertCreated = false;

    if (analysis.shouldCreateAlert && analysis.alertType) {
      alertCreated = await this.createAlertFromAnalysis(userTire.id, analysis);
    }

    return {
      deviceId: reading.deviceId,
      userTireId: userTire.id,
      tireProductName: tireProduct.model,
      pressureBar: reading.pressureBar,
      temperatureC: reading.temperatureC,
      measuredAt: reading.measuredAt ?? null,
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
  ): TireHealthAnalysisResult {
    const pressure = reading.pressureBar;
    const temperature = reading.temperatureC;

    if (pressure < tireProduct.minPressure) {
      const gap = tireProduct.minPressure - pressure;
      const severity = gap >= 0.5 ? 'critical' : 'warning';

      return {
        status: severity,
        shouldCreateAlert: true,
        alertType: 'PRESSURE_TOO_LOW',
        severity,
        message:
          'La pression du pneu est inférieure à la recommandation Michelin.',
        recommendedAction: 'Regonfler le pneu avant la prochaine sortie.',
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

    if (temperature > 40) {
      return {
        status: 'warning',
        shouldCreateAlert: true,
        alertType: 'TEMPERATURE_HIGH',
        severity: 'warning',
        message: 'Température élevée détectée au niveau du pneu.',
        recommendedAction: "Surveiller l'évolution du pneu après la sortie.",
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
      case 'TEMPERATURE_HIGH':
        return 'Température élevée';
      default:
        return 'Alerte pneu';
    }
  }
}
