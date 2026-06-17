import { Injectable, NotFoundException } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TireTerrainType } from 'src/types/tires.type';

@Injectable()
export class TiresService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tireId: number): Promise<TireData | null> {
    return this.prisma.tireData.findUnique({
      where: {
        id: tireId,
      },
    });
  }

  async getTiresTerrainTypes(tireId: number): Promise<TireTerrainType> {
    const tire = await this.prisma.tireData.findUnique({
      where: {
        id: tireId,
      },
      select: {
        terrainTypes: true,
      },
    });

    if (!tire) {
      throw new NotFoundException('Tire not found');
    }

    return {
      types: tire.terrainTypes,
    };
  }
}
