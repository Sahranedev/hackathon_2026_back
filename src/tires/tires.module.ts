import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TireRecommendationService } from './tire-recommendation.service';
import { TiresController } from './tires.controller';
import { TiresService } from './tires.service';
import { UserTiresService } from './user-tires.service';

@Module({
  imports: [PrismaModule],
  controllers: [TiresController],
  providers: [TiresService, UserTiresService, TireRecommendationService],
  exports: [TiresService, UserTiresService, TireRecommendationService],
})
export class TiresModule {}
