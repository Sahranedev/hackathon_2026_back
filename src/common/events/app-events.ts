/**
 * Catalogue des événements applicatifs et de leurs charges utiles.
 *
 * Les producteurs (Activities, Referrals, Loyalty) émettent ces événements sans
 * connaître leurs consommateurs, ce qui découple les modules conformément aux
 * principes de Clean Architecture.
 */

import type { TierVoucher } from '../../loyalty/loyalty.config';

export const ACTIVITY_COMPLETED = 'activity.completed';
export const ACTIVITY_STARTED = 'activity.started';
export const REFERRAL_COMPLETED = 'referral.completed';
export const TIER_REACHED = 'tier.reached';

export interface ActivityCompletedEvent {
  userId: number;
  activityId: number;
  kilometers: number;
}

export interface ActivityStartedEvent {
  userId: number;
  activityId: number;
}

export interface ReferralCompletedEvent {
  referralId: number;
  referrerId: number;
  referredId: number;
}

export interface TierReachedEvent {
  userId: number;
  tierName: string;
  voucher: TierVoucher;
}
