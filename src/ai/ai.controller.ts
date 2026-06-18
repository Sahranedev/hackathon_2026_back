import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecommendTiresDto } from './dto/recommend-tires.dto';
import { TireRecommendationAiService } from './tire-recommendation-ai.service';
import {
  AiTireRecommendationResponseDto,
  ErrorResponseDto,
} from '../docs/api-response.dto';
import { ApiJwtAuth, ApiValidationError } from '../docs/swagger.decorators';

@ApiTags('AI')
@ApiJwtAuth()
@Controller('api/ai')
export class AiController {
  constructor(
    private readonly tireRecommendationAi: TireRecommendationAiService,
  ) {}

  @Post('tires/recommend')
  @ApiOperation({
    summary: 'Obtenir des recommandations de pneus via IA a partir d un prompt.',
  })
  @ApiCreatedResponse({ type: AiTireRecommendationResponseDto })
  @ApiValidationError('Prompt requis ou catalogue vide.')
  @ApiResponse({
    status: 500,
    description: 'La reponse IA ne contient pas de recommandations valides.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service IA temporairement indisponible.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 504,
    description: 'Timeout pendant l analyse IA.',
    type: ErrorResponseDto,
  })
  recommendTires(@Body() dto: RecommendTiresDto) {
    return this.tireRecommendationAi.recommendFromPrompt(dto.prompt);
  }
}
