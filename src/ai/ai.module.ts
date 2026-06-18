import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MistralProvider } from './providers/mistral.provider';
import { TireRecommendationAiService } from './tire-recommendation-ai.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiController],
  providers: [AiService, MistralProvider, TireRecommendationAiService],
  exports: [AiService],
})
export class AiModule {}
