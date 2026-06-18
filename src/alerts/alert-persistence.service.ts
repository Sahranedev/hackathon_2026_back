import { Injectable } from '@nestjs/common';
import { ActivityStatus, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Alert, AlertMetadata } from 'src/types/alerts.type';

@Injectable()
export class AlertPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveAlert(
    userTireId: number,
    code: string,
  ): Promise<Alert | null> {
    const alert = await this.prisma.alert.findFirst({
      where: { userTireId, code, isChecked: false },
    });

    return alert ? this.toAlert(alert) : null;
  }

  async createAlert(
    userTireId: number,
    code: string,
    message: string,
    metadata?: AlertMetadata,
  ): Promise<Alert | null> {
    const metadataJson = metadata as Prisma.InputJsonValue | undefined;

    const existingAlert = await this.prisma.alert.findFirst({
      where: { userTireId, code, isChecked: false },
    });

    if (existingAlert) {
      if (
        existingAlert.message === message &&
        JSON.stringify(existingAlert.metadata) ===
          JSON.stringify(metadata ?? null)
      ) {
        return this.toAlert(existingAlert);
      }

      const updated = await this.prisma.alert.update({
        where: { id: existingAlert.id },
        data: { message, metadata: metadataJson ?? Prisma.JsonNull },
      });
      return this.toAlert(updated);
    }

    const checkedAlert = await this.prisma.alert.findFirst({
      where: { userTireId, code, isChecked: true },
      orderBy: [
        { checkedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });

    if (checkedAlert) {
      const checkedAt = checkedAlert.checkedAt ?? checkedAlert.createdAt;
      const hasNewActivity = await this.hasInProgressActivityAfter(
        userTireId,
        checkedAt,
      );

      if (!hasNewActivity) {
        return null;
      }
    }

    const created = await this.prisma.alert.create({
      data: {
        userTireId,
        code,
        message,
        metadata: metadataJson,
      },
    });
    return this.toAlert(created);
  }

  async updateAlertMetadata(
    alertId: number,
    metadata: AlertMetadata,
  ): Promise<Alert> {
    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: { metadata: metadata as Prisma.InputJsonValue },
    });

    return this.toAlert(updated);
  }

  async deleteActiveAlert(userTireId: number, code: string): Promise<boolean> {
    const result = await this.prisma.alert.deleteMany({
      where: { userTireId, code, isChecked: false },
    });

    return result.count > 0;
  }

  private async hasInProgressActivityAfter(
    userTireId: number,
    checkedAt: Date,
  ): Promise<boolean> {
    const activity = await this.prisma.activity.findFirst({
      where: {
        status: ActivityStatus.IN_PROGRESS,
        tires: {
          some: {
            tireId: userTireId,
          },
        },
        OR: [
          {
            createdAt: {
              gt: checkedAt,
            },
          },
          {
            startedAt: {
              gt: checkedAt,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    return activity !== null;
  }

  private toAlert(alert: {
    id: number;
    userTireId: number;
    code: string;
    message: string;
    isChecked: boolean;
    metadata: Prisma.JsonValue | null;
  }): Alert {
    return {
      id: alert.id,
      userTireId: alert.userTireId,
      code: alert.code,
      message: alert.message,
      isChecked: alert.isChecked,
      metadata: (alert.metadata as AlertMetadata | null) ?? null,
    };
  }
}
