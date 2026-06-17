import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTireSensorReadingDto {
  @IsString()
  deviceId: string;

  @IsNumber()
  @Min(0)
  pressureBar: number;

  @IsNumber()
  temperatureC: number;

  @IsOptional()
  @IsDateString()
  measuredAt?: string;
}
