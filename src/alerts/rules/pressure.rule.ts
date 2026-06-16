import { Injectable } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';
import { TireRule } from '../interface/tire-rule.interface';
import { AlertPersistenceService } from '../alert-persistence.service';

@Injectable()
export class PressureLowRule implements TireRule {
  constructor(private readonly alertPersistence: AlertPersistenceService) {}
  code = 'PRESSURE';

  async evaluate(ctx: RuleContext, tire: TireData): Promise<Alert | null> {
    if (tire?.maxPressure && 5 > tire?.maxPressure) {
      const alert = await this.alertPersistence.createAlert(
        ctx.tire.id,
        this.code,
        'Pressure supérieure au maximum recommandé',
      );
      if (alert) {
        return alert;
      }
    } else if (tire?.minPressure && 5 < tire?.minPressure) {
      const alert = await this.alertPersistence.createAlert(
        ctx.tire.id,
        this.code,
        'Pressure inférieure au minimum recommandé',
      );
      if (alert) {
        return alert;
      }
    }

    return null;
  }
}
