import { TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';

export const TIRE_RULES = Symbol('TIRE_RULES');

export interface TireRule {
  code: string;
  evaluate(
    context: RuleContext,
    tire: TireData,
  ): Alert | null | Promise<Alert | null>;
}
