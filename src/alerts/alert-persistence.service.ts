import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Alert } from 'src/types/alerts.type';

@Injectable()
export class AlertPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveAlert(
    userTireId: number,
    code: string,
  ): Promise<Alert | null> {
    return this.prisma.alert.findFirst({
      where: { userTireId, code, isChecked: false },
    });
  }

  async createAlert(
    userTireId: number,
    code: string,
    message: string,
  ): Promise<Alert> {
    const existingAlert = await this.findActiveAlert(userTireId, code);

    if (existingAlert) {
      return existingAlert;
    }

    return this.prisma.alert.create({
      data: { userTireId, code, message },
    });
  }
}
