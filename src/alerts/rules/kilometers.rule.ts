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
    if (
      ctx.tire.kilometers != null &&
      ctx.tire.kilometers > tire.maxKilometers
    ) {
      const exceeded = ctx.tire.kilometers - tire.maxKilometers;
      const message = `Vous avez parcouru ${ctx.tire.kilometers} km, soit ${exceeded} km au-delà de la limite recommandée de ${tire.maxKilometers} km`;
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
