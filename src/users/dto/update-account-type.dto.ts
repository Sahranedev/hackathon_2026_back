import { IsEnum } from 'class-validator';
import { AccountType } from '../../generated/prisma/client';

export class UpdateAccountTypeDto {
  @IsEnum(AccountType)
  accountType: AccountType;
}
