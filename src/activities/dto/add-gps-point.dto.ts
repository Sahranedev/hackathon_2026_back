import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class AddGpsPointDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
