import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Alert, AlertMetadata } from 'src/types/alerts.type';

@Injectable()
export class AlertPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async createAlert(
    userTireId: number,
    code: string,
    message: string,
    metadata?: AlertMetadata,
  ): Promise<Alert> {
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

  private toAlert(alert: {
    id: number;
    code: string;
    message: string;
    isChecked: boolean;
    metadata: Prisma.JsonValue | null;
  }): Alert {
    return {
      id: alert.id,
      code: alert.code,
      message: alert.message,
      isChecked: alert.isChecked,
      metadata: (alert.metadata as AlertMetadata | null) ?? null,
    };
  }
}
