import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ACTIVITY_COMPLETED,
  REFERRAL_COMPLETED,
} from '../common/events/app-events';
import type {
  ActivityCompletedEvent,
  ReferralCompletedEvent,
} from '../common/events/app-events';
import { POINTS_RULES, PointsRule } from './interfaces/points-rule.interface';

/**
 * Aiguille les événements applicatifs vers les règles d'attribution de points.
 *
 * Les règles sont injectées sous forme de collection (même pattern que le
 * moteur d'alertes), ce qui permet d'en ajouter sans modifier ce dispatcher.
 */
@Injectable()
export class PointsRulesRunner {
  private readonly logger = new Logger(PointsRulesRunner.name);

  constructor(@Inject(POINTS_RULES) private readonly rules: PointsRule[]) {}

  @OnEvent(ACTIVITY_COMPLETED)
  async onActivityCompleted(payload: ActivityCompletedEvent): Promise<void> {
    await this.dispatch(ACTIVITY_COMPLETED, payload);
  }

  @OnEvent(REFERRAL_COMPLETED)
  async onReferralCompleted(payload: ReferralCompletedEvent): Promise<void> {
    await this.dispatch(REFERRAL_COMPLETED, payload);
  }

  private async dispatch(event: string, payload: unknown): Promise<void> {
    const matching = this.rules.filter((rule) => rule.event === event);

    await Promise.all(
      matching.map(async (rule) => {
        try {
          await rule.handle(payload);
        } catch (error) {
          this.logger.error(
            `Échec de la règle "${rule.code}" sur l'événement "${event}"`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }),
    );
  }
}
