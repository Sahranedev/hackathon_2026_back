import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TireDetailDto } from 'src/types/tire-detail.type';
import { TireTerrainType } from 'src/types/tires.type';
import { UserTireSummaryDto } from 'src/types/user-tire.type';

@Injectable()
export class TiresService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserTires(userId: number): Promise<UserTireSummaryDto[]> {
    const userTires = await this.prisma.userTire.findMany({
      where: { userId },
      include: { tire: true },
      orderBy: { id: 'asc' },
    });

    return userTires.map((userTire) => ({
      id: userTire.id,
      position: userTire.position,
      kilometers: userTire.kilometers,
      smartTire: userTire.smartTire,
      isActive: userTire.isActive,
      model: userTire.tire?.model ?? 'Pneu inconnu',
      health: this.computeHealth(
        userTire.kilometers,
        userTire.tire?.maxKilometers,
      ),
    }));
  }

  private computeHealth(
    kilometers: number | null,
    maxKilometers: number | undefined,
  ): number {
    if (!maxKilometers || maxKilometers <= 0) {
      return 100;
    }

    const km = kilometers ?? 0;
    return Math.max(
      0,
      Math.min(100, Math.round(100 * (1 - km / maxKilometers))),
    );
  }

  async getTireModelDetail(id: number): Promise<TireDetailDto> {
    const tire = await this.prisma.tireData.findUnique({
      where: { id },
    });

    if (!tire) {
      throw new NotFoundException('Tire not found');
    }

    const { recommendationWeight: _, ...detail } = tire;
    return detail;
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
