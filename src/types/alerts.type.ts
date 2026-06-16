import { UserTire } from 'src/generated/prisma/client';

export type Alert = {
  code: string;
  severity: string;
  message: string;
};

export type RuleContext = {
  tire: UserTire;
};
