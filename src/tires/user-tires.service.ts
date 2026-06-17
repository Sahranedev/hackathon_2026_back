import { Injectable } from '@nestjs/common';
import { TireData, UserTire } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type UserTireWithProduct = UserTire & {
  tire: TireData | null;
};

@Injectable()
export class UserTiresService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDeviceId(deviceId: string): Promise<UserTireWithProduct | null> {
    return this.prisma.userTire.findUnique({
      where: {
        deviceId,
      },
      include: {
        tire: true,
      },
    });
  }
}
