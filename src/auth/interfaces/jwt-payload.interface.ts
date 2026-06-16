import { Role } from '../../users/enums/role.enum';

export interface JwtPayload {
  sub: number;
  mail?: string | null;
  roles: Role[];
}
