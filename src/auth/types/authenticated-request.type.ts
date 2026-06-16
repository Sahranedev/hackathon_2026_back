import { JwtPayload } from '../interfaces/jwt-payload.interface';

export interface AuthenticatedUser {
  user?: JwtPayload;
}
