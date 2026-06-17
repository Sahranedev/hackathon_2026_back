import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AlertPersistenceService } from './alert-persistence.service';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsCron } from './cron/alterts.cron';
import { TireRule, TIRE_RULES } from './interface/tire-rule.interface';
import { PressureKilometersRule } from './rules/kilometers.rule';
import { PressureLowRule } from './rules/pressure.rule';
import { TerrainRule } from './rules/terrain.rule';

const ruleProviders = [PressureLowRule, TerrainRule, PressureKilometersRule];

@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [
    AlertPersistenceService,
    AlertsService,
    AlertsCron,
    ...ruleProviders,
    {
      provide: TIRE_RULES,
      useFactory: (...rules: TireRule[]) => rules,
      inject: ruleProviders,
    },
  ],
  exports: [AlertPersistenceService, AlertsService],
})
export class AlertsModule {}
