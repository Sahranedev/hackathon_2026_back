import { Injectable } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';
import { TireRule } from '../interface/tire-rule.interface';
import { AlertPersistenceService } from '../alert-persistence.service';

@Injectable()
export class PressureKilometersRule implements TireRule {
  constructor(private readonly alertPersistence: AlertPersistenceService) {}
  code = 'PRESSURE_KILOMETERS';

  async evaluate(ctx: RuleContext, tire: TireData): Promise<Alert | null> {
    console.log((ctx.tire.kilometers, tire.maxKilometers));
    if (ctx.tire.kilometers && ctx.tire.kilometers > tire.maxKilometers) {
      console.log(
        `Kilometers ${ctx.tire.kilometers} supérieure au maximum recommandé`,
      );
      const alert = await this.alertPersistence.createAlert(
        ctx.tire.id,
        this.code,
        'Kilometers inférieure au maximum recommandé',
      );

      if (alert) {
        return alert;
      }
    }

    return null;
  }
}
