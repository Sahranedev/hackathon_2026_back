import { Injectable, NotFoundException } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  TireWearEvaluationResult,
  TireWearService,
} from 'src/tire-wear/tire-wear.service';
import { TireDetailDto } from 'src/types/tire-detail.type';
import { TireTerrainType } from 'src/types/tires.type';
import { UserTireSummaryDto } from 'src/types/user-tire.type';

@Injectable()
export class TiresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tireWearService: TireWearService,
  ) {}

  async findById(tireId: number): Promise<TireData | null> {
    return this.prisma.tireData.findUnique({
      where: {
        id: tireId,
      },
    });
  }

  async getUserTires(userId: number): Promise<UserTireSummaryDto[]> {
    const userTires = await this.prisma.userTire.findMany({
      where: { userId },
      include: { tire: true },
      orderBy: { id: 'asc' },
    });

    return Promise.all(
      userTires.map(async (userTire) => {
        const wear = await this.getWearSnapshot(userTire);

        return {
          id: userTire.id,
          position: userTire.position,
          kilometers: userTire.kilometers,
          smartTire: userTire.smartTire,
          isActive: userTire.isActive,
          model: userTire.tire?.model ?? 'Pneu inconnu',
          health: wear.healthScore,
          healthScore: wear.healthScore,
          healthStatus: wear.healthStatus,
          healthDetails: wear.healthDetails,
          healthAlertType: wear.alertType,
        };
      }),
    );
  }

  private async getWearSnapshot(userTire: {
    id: number;
    kilometers: number | null;
    tire: TireData | null;
  }): Promise<TireWearEvaluationResult> {
    try {
      return await this.tireWearService.getUserTireWearSnapshot(userTire.id);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      return {
        userTireId: userTire.id,
        tireProductName: userTire.tire?.model ?? 'Pneu inconnu',
        healthScore: 100,
        healthStatus: 'good',
        healthDetails: {
          mileageKm: userTire.kilometers ?? 0,
          mileagePenalty: 0,
          underInflatedCount: 0,
          underInflationPenalty: 0,
          usagePenalty: 0,
        },
        alertType: null,
        alertCreated: false,
        alertCleared: false,
      };
    }
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
