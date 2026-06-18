import { Module } from '@nestjs/common';
import { AlertPersistenceService } from 'src/alerts/alert-persistence.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TireWearController } from './tire-wear.controller';
import { TireWearService } from './tire-wear.service';

@Module({
  imports: [PrismaModule],
  controllers: [TireWearController],
  providers: [AlertPersistenceService, TireWearService],
  exports: [TireWearService],
})
export class TireWearModule {}
