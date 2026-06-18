import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'Camille' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Martin' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'camille@example.com' })
  @IsEmail()
  mail: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'RIDE-A1B2C3' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}
