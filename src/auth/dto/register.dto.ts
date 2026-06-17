import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsEmail()
  mail: string;

  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
