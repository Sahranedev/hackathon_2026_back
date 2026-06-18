import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class AddGpsPointDto {
  @ApiProperty({ example: 48.8566 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 2.3522 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsNumber()
  altitude?: number;

  @ApiPropertyOptional({ example: 7.8 })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-06-18T08:42:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
