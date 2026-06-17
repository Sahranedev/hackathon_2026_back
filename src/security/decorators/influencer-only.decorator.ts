import { applyDecorators, UseGuards } from '@nestjs/common';
import { InfluencerGuard } from '../guards/influencer.guard';

/**
 * Restreint l'accès d'une route ou d'un contrôleur aux comptes INFLUENCER.
 */
export const InfluencerOnly = () => applyDecorators(UseGuards(InfluencerGuard));
