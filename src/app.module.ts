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
import { TireSensorModule } from './tire-sensor/tire-sensor.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { RewardsModule } from './rewards/rewards.module';
import { ReferralsModule } from './referrals/referrals.module';
import { InfluencerModule } from './influencer/influencer.module';
import { TireWearModule } from './tire-wear/tire-wear.module';
import { AiModule } from './ai/ai.module';
import { EventsModule } from './events/events.module';
import { DemoAlertsModule } from './demo/demo-alerts.module';

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
    TireSensorModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    LoyaltyModule,
    RewardsModule,
    ReferralsModule,
    InfluencerModule,
    TireWearModule,
    AiModule,
    EventsModule,
    DemoAlertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
