import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/security/decorators/public.decorator';
import { DemoAlertsService } from './demo-alerts.service';

type StartSlowLeakBody = {
  totalDelaySeconds?: number;
};

@Public()
@ApiTags('Demo')
@Controller('api/demo/alerts')
export class DemoAlertsController {
  constructor(private readonly demoAlertsService: DemoAlertsService) {}

  @Get('slow-leak/status')
  @ApiOperation({
    summary: 'Consulter l etat du scenario demo crevaison lente.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        enabled: true,
        running: false,
        completedRuns: 0,
        maxActivityTriggers: 1,
        stepIndex: 0,
        expectedAlertAt: null,
        deviceId: 'demo-rear-001',
      },
    },
  })
  getSlowLeakStatus() {
    return this.demoAlertsService.getStatus();
  }

  @Post('slow-leak/start')
  @ApiOperation({
    summary: 'Demarrer le scenario demo de crevaison lente.',
  })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        totalDelaySeconds: {
          type: 'number',
          example: 60,
          description:
            'Duree totale entre le declenchement et la creation de l alerte.',
        },
      },
    },
  })
  startSlowLeakScenario(@Body() body: StartSlowLeakBody = {}) {
    return this.demoAlertsService.startSlowLeakScenario(body);
  }

  @Post('slow-leak/reset')
  @ApiOperation({
    summary: 'Reinitialiser les donnees du scenario demo crevaison lente.',
  })
  resetSlowLeakScenario() {
    return this.demoAlertsService.resetSlowLeakScenario();
  }
}
