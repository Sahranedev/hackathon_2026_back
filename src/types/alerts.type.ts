import { UserTire } from 'src/generated/prisma/client';

export type Alert = {
  id: number;
  code: string;
  message: string;
  isChecked: boolean;
};

export type RuleContext = {
  tire: UserTire;
};
