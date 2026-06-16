import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TerrainType } from '../../generated/prisma/client';

export class FinishActivityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TerrainType)
  terrainType?: TerrainType;

  @IsOptional()
  @IsDateString()
  endedAt?: string;
}
