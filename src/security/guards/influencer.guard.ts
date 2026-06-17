import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AccountType } from '../../generated/prisma/client';

/**
 * Autorise uniquement les comptes de type INFLUENCER.
 *
 * Le type de compte relève du programme commercial, distinct des `Roles`
 * (autorisation). L'utilisateur résolu par la stratégie JWT (SafeUser) porte
 * son `accountType`, lu ici depuis la requête.
 */
@Injectable()
export class InfluencerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { accountType?: AccountType } }>();

    if (request.user?.accountType !== AccountType.INFLUENCER) {
      throw new ForbiddenException('Accès réservé aux influenceurs.');
    }

    return true;
  }
}
