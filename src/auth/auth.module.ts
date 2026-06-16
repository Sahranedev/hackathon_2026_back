import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SignOptions } from 'jsonwebtoken';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../security/guards/jwt-auth.guard';
import { JwtStrategy } from '../security/strategies/jwt.strategy';
import { StravaModule } from 'src/strava/strava.module';
import { ActivitiesModule } from 'src/activities/activities.module';

const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ??
  '1d') as SignOptions['expiresIn'];

@Module({
  imports: [
    UsersModule,
    PassportModule,
    StravaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev_jwt_secret_change_me',
      signOptions: {
        expiresIn: jwtExpiresIn,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
