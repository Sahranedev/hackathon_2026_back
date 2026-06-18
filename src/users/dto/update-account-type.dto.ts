import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AccountType } from '../../generated/prisma/client';

export class UpdateAccountTypeDto {
  @ApiProperty({ enum: AccountType, example: AccountType.INFLUENCER })
  @IsEnum(AccountType)
  accountType: AccountType;
}
