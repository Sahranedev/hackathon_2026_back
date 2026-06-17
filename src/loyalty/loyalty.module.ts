import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoyaltyService } from './loyalty.service';
import { PointsService } from './points.service';
import { PointsRulesRunner } from './points-rules.runner';
import { POINTS_RULES, PointsRule } from './interfaces/points-rule.interface';
import { KilometersPointsRule } from './rules/kilometers-points.rule';
import { ReferralPointsRule } from './rules/referral-points.rule';

const ruleProviders = [KilometersPointsRule, ReferralPointsRule];

@Module({
  imports: [PrismaModule],
  providers: [
    PointsService,
    LoyaltyService,
    PointsRulesRunner,
    ...ruleProviders,
    {
      provide: POINTS_RULES,
      useFactory: (...rules: PointsRule[]) => rules,
      inject: ruleProviders,
    },
  ],
  exports: [PointsService, LoyaltyService],
})
export class LoyaltyModule {}
