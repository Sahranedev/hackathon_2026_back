import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { AlertResponseDto } from '../docs/api-response.dto';
import { ApiJwtAuth, ApiResourceNotFound } from '../docs/swagger.decorators';

@UseGuards(JwtAuthGuard)
@ApiTags('Alerts')
@ApiJwtAuth()
@Controller('/api/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les alertes actives de l utilisateur courant.' })
  @ApiOkResponse({ type: [AlertResponseDto] })
  async getUserAlerts(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.alertsService.getUserAlerts(authenticatedUser.id);
  }

  @Get('tire/:id')
  @ApiOperation({ summary: 'Lister les alertes actives d un pneu utilisateur.' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ type: [AlertResponseDto] })
  async getTireAlerts(@Param('id') tireId: string) {
    return this.alertsService.getTireAlerts(Number(tireId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Marquer une alerte comme traitee.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: AlertResponseDto })
  @ApiResourceNotFound('Alerte introuvable pour l utilisateur courant.')
  async checkAlert(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id') alertId: string,
  ) {
    return this.alertsService.checkAlert(authenticatedUser.id, Number(alertId));
  }
}
