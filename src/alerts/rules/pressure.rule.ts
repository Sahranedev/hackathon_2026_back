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
    const currentPressure = 5;

    if (tire?.maxPressure && currentPressure > tire.maxPressure) {
      const message = `Pression actuelle de ${currentPressure} bar, supérieure à la limite maximale recommandée de ${tire.maxPressure} bar`;
      const alert = await this.alertPersistence.createAlert(
        ctx.tire.id,
        this.code,
        message,
      );
      if (alert) {
        return alert;
      }
    } else if (tire?.minPressure && currentPressure < tire.minPressure) {
      const message = `Pression actuelle de ${currentPressure} bar, inférieure à la limite minimale recommandée de ${tire.minPressure} bar`;
      const alert = await this.alertPersistence.createAlert(
        ctx.tire.id,
        this.code,
        message,
      );
      if (alert) {
        return alert;
      }
    }

    return null;
  }
}
