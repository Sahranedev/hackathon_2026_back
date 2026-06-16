import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from '../alerts.service';

@Injectable()
export class AlertsCron {
  constructor(private readonly alertsService: AlertsService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    await this.alertsService.generateAllAlerts();
  }
}
