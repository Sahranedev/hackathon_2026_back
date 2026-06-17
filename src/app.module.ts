import 'dotenv/config';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RetailsModule } from './retails/retails.module';
import { UsersModule } from './users/users.module';
import { StravaModule } from './strava/strava.module';
import { ActivitiesModule } from './activities/activities.module';
import { TiresModule } from './tires/tires.module';
import { AlertsModule } from './alerts/alerts.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { RewardsModule } from './rewards/rewards.module';
import { ReferralsModule } from './referrals/referrals.module';
import { InfluencerModule } from './influencer/influencer.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    RetailsModule,
    StravaModule,
    ActivitiesModule,
    TiresModule,
    AlertsModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    LoyaltyModule,
    RewardsModule,
    ReferralsModule,
    InfluencerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
