import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const fallbackDatabaseUrl =
  'postgresql://hackasaumon:hackasaumon@localhost:5433/hackasaumon?schema=public';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg(process.env.DATABASE_URL ?? fallbackDatabaseUrl),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
