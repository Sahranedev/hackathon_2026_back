import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaService } from './strava.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [HttpModule],
  providers: [StravaService, PrismaService],
  exports: [StravaService],
})
export class StravaModule {}