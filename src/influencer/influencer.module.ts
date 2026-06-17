import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InfluencerController } from './influencer.controller';
import { InfluencerService } from './influencer.service';

@Module({
  imports: [PrismaModule],
  controllers: [InfluencerController],
  providers: [InfluencerService],
})
export class InfluencerModule {}
