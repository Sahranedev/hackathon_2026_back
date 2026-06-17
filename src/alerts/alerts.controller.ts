import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('/api/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getUserAlerts(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.alertsService.getUserAlerts(authenticatedUser.id);
  }

  @Get('tire/:id')
  async getTireAlerts(@Param('id') tireId: string) {
    return this.alertsService.getTireAlerts(Number(tireId));
  }

  @Patch(':id')
  async checkAlert(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id') alertId: string,
  ) {
    return this.alertsService.checkAlert(authenticatedUser.id, Number(alertId));
  }
}
