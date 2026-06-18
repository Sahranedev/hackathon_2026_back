import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TerrainType } from '../../generated/prisma/client';

export class FinishActivityDto {
  @ApiPropertyOptional({ example: 'Sortie gravel du matin' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: TerrainType, example: TerrainType.GRAVEL })
  @IsOptional()
  @IsEnum(TerrainType)
  terrainType?: TerrainType;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-06-18T10:05:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endedAt?: string;
}
