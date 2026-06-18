import { Body, Controller, Post } from '@nestjs/common';
import { RecommendTiresDto } from './dto/recommend-tires.dto';
import { TireRecommendationAiService } from './tire-recommendation-ai.service';

@Controller('api/ai')
export class AiController {
  constructor(
    private readonly tireRecommendationAi: TireRecommendationAiService,
  ) {}

  @Post('tires/recommend')
  recommendTires(@Body() dto: RecommendTiresDto) {
    return this.tireRecommendationAi.recommendFromPrompt(dto.prompt);
  }
}
