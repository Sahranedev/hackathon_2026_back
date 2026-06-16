import { Injectable } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';
import { TireRule } from '../interface/tire-rule.interface';

@Injectable()
export class PressureLowRule implements TireRule {
  code = 'PRESSURE';

  evaluate(ctx: RuleContext, tire: TireData): Alert | null {
    if (tire?.maxPressure && 5 > tire?.maxPressure) {
      return {
        code: this.code,
        severity: 'high',
        message: 'Pression supérieure au maximum recommandé',
      };
    } else if (tire?.minPressure && 5 < tire?.minPressure) {
      return {
        code: this.code,
        severity: 'high',
        message: 'Pression inférieure au minimum recommandé',
      };
    }

    return null;
  }
}
