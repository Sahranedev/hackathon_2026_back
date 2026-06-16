import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TerrainType } from '../../generated/prisma/client';

export class StartActivityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TerrainType)
  terrainType?: TerrainType;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}
