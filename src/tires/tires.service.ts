import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RetailsService } from 'src/retails/retails.service';
import {
  TireWearEvaluationResult,
  TireWearService,
} from 'src/tire-wear/tire-wear.service';
import { TireCatalogItemDto } from 'src/types/tire-catalog.type';
import { TireDealerDto } from 'src/types/tire-dealer.type';
import { TireDetailDto } from 'src/types/tire-detail.type';
import { TireTerrainType } from 'src/types/tires.type';
import {
  UserTireActiveDto,
  UserTireInfoDto,
  UserTireSummaryDto,
  UserTireWearDto,
} from 'src/types/user-tire.type';

const MAX_ACTIVE_USER_TIRES = 2;

@Injectable()
export class TiresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tireWearService: TireWearService,
    private readonly retailsService: RetailsService,
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

  async getUserTireInfo(
    userId: number,
    userTireId: number,
  ): Promise<UserTireInfoDto> {
    const userTire = await this.prisma.userTire.findFirst({
      where: {
        id: userTireId,
        userId,
      },
      select: {
        id: true,
        kilometers: true,
        smartTire: true,
        sensorReadings: {
          orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            pressureBar: true,
          },
        },
      },
    });

    if (!userTire) {
      throw new NotFoundException('User tire not found');
    }

    return {
      id: userTire.id,
      kilometers: userTire.kilometers,
      lastPressureBar: userTire.sensorReadings[0]?.pressureBar ?? null,
      smartTire: userTire.smartTire,
    };
  }

  async getUserTireWear(
    userId: number,
    userTireId: number,
  ): Promise<UserTireWearDto> {
    const userTire = await this.prisma.userTire.findFirst({
      where: {
        id: userTireId,
        userId,
      },
      include: {
        tire: true,
      },
    });

    if (!userTire) {
      throw new NotFoundException('User tire not found');
    }

    const wear = await this.getWearSnapshot(userTire);

    return {
      id: userTire.id,
      model: userTire.tire?.model ?? 'Pneu inconnu',
      position: userTire.position,
      healthScore: wear.healthScore,
      healthStatus: wear.healthStatus,
    };
  }

  async updateUserTireActive(
    userId: number,
    userTireId: number,
    isActive: boolean,
  ): Promise<UserTireActiveDto> {
    const userTire = await this.prisma.userTire.findFirst({
      where: {
        id: userTireId,
        userId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!userTire) {
      throw new NotFoundException('User tire not found');
    }

    if (isActive && !userTire.isActive) {
      await this.assertCanActivateUserTire(userId, userTire.id);
    }

    const updatedUserTire = await this.prisma.userTire.update({
      where: {
        id: userTire.id,
      },
      data: {
        isActive,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return {
      id: updatedUserTire.id,
      isActive: updatedUserTire.isActive ?? false,
    };
  }

  private async assertCanActivateUserTire(
    userId: number,
    excludedUserTireId?: number,
  ) {
    const activeTiresCount = await this.prisma.userTire.count({
      where: {
        userId,
        isActive: true,
        ...(excludedUserTireId
          ? {
              id: {
                not: excludedUserTireId,
              },
            }
          : {}),
      },
    });

    if (activeTiresCount >= MAX_ACTIVE_USER_TIRES) {
      throw new ConflictException(
        'Un utilisateur ne peut avoir que jusqu\'à 2 pneus actifs.',
      );
    }
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

  async addUserTire(
    userId: number,
    tireId: number,
  ): Promise<UserTireSummaryDto> {
    const tire = await this.prisma.tireData.findUnique({
      where: { id: tireId },
    });

    if (!tire) {
      throw new NotFoundException('Tire not found');
    }

    await this.assertCanActivateUserTire(userId);

    const userTire = await this.prisma.userTire.create({
      data: {
        userId,
        tireId,
        kilometers: 0,
        smartTire: false,
        isActive: true,
      },
      include: { tire: true },
    });

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
  }

  async searchTireCatalog(query: string): Promise<TireCatalogItemDto[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const tires = await this.prisma.tireData.findMany({
      where: {
        model: {
          contains: normalizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        model: true,
      },
      orderBy: {
        model: 'asc',
      },
      take: 20,
    });

    return tires.map((tire) => ({
      id: tire.id,
      name: tire.model,
    }));
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

  async getTireDealers(tireId: number): Promise<TireDealerDto[]> {
    const tire = await this.prisma.tireData.findUnique({
      where: { id: tireId },
      select: { id: true },
    });

    if (!tire) {
      throw new NotFoundException('Tire not found');
    }

    const retails = await this.retailsService.findAll();

    return retails
      .filter(
        (retail) =>
          retail.latitude != null &&
          retail.longitude != null &&
          retail.phoneNumber != null,
      )
      .map((retail) => ({
        id: String(retail.id),
        name: retail.name,
        address: retail.address,
        phone: retail.phoneNumber!,
        latitude: retail.latitude!,
        longitude: retail.longitude!,
      }));
  }

  async deleteUserTire(userId: number, userTireId: number) {
    const userTire = await this.prisma.userTire.findFirst({
      where: {
        id: userTireId,
        userId,
      },
    });

    if (!userTire) {
      throw new NotFoundException('Tire not found');
    }

    await this.prisma.$transaction([
      this.prisma.activityTire.deleteMany({
        where: {
          tireId: userTireId,
        },
      }),
      this.prisma.alert.deleteMany({
        where: {
          userTireId,
        },
      }),
      this.prisma.userTire.delete({
        where: {
          id: userTireId,
        },
      }),
    ]);

    return {
      deleted: true,
    };
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
