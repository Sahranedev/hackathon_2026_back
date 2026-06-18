import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateRetailDto {
  @ApiPropertyOptional({ example: 'Michelin Store Paris' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '10 rue de Rivoli, 75004 Paris' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 2.3522 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 48.8566 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: '+33123456789' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;
}
