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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
