import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsEmail()
  mail: string;

  @IsString()
  password?: string;

  @IsString()
  stravaId?: string;
}
