import { User } from '../../generated/prisma/client';

export type SafeUser = Omit<User, 'password'>;

export type CurrentUserProfile = SafeUser & {
  stravaLinked: boolean;
};
