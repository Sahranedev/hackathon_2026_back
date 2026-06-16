import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StravaModule } from '../strava/strava.module';

@Module({
  imports: [PrismaModule, StravaModule],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
