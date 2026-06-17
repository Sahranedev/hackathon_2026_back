import { SafeUser } from '../../users/types/safe-user.type';

export type AuthenticatedUser = SafeUser;

export interface AuthenticatedRequest {
  user: SafeUser;
}
