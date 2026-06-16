import { Injectable } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';
import { TireRule } from '../interface/tire-rule.interface';

@Injectable()
export class PressureKilometersRule implements TireRule {
  code = 'PRESSURE_KILOMETERS';

  evaluate(ctx: RuleContext, tire: TireData): Alert | null {
    if (ctx.tire.kilometers && ctx.tire.kilometers > tire.maxKilometers) {
      return {
        code: this.code,
        severity: 'high',
        message: 'Pression inférieure au minimum recommandé',
      };
    }

    return null;
  }
}
