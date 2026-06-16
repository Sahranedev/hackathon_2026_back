import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TireTerrainType } from 'src/types/tires.type';

@Injectable()
export class TiresService {
  constructor(private readonly prisma: PrismaService) {}

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
