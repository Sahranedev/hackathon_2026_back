import { Controller, Get, Req } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { InfluencerOnly } from '../security/decorators/influencer-only.decorator';
import { InfluencerService } from './influencer.service';
import {
  ErrorResponseDto,
  InfluencerDashboardResponseDto,
} from '../docs/api-response.dto';
import { ApiJwtAuth } from '../docs/swagger.decorators';

@InfluencerOnly()
@ApiTags('Influencer')
@ApiJwtAuth()
@Controller('api/influencer')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Recuperer le dashboard commercial du compte influenceur.',
  })
  @ApiOkResponse({ type: InfluencerDashboardResponseDto })
  @ApiForbiddenResponse({
    description: 'Acces reserve aux comptes de type INFLUENCER.',
    type: ErrorResponseDto,
  })
  getDashboard(@Req() req: { user: { id: number } }) {
    return this.influencerService.getDashboard(req.user.id);
  }
}
