import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTireSensorReadingDto {
  @ApiProperty({ example: 'sensor-front-001' })
  @IsString()
  deviceId: string;

  @ApiProperty({ example: 2.4, minimum: 0 })
  @IsNumber()
  @Min(0)
  pressureBar: number;

  @ApiProperty({ example: 21.5 })
  @IsNumber()
  temperatureC: number;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-06-18T08:42:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  measuredAt?: string;
}
