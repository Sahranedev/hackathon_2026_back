import { Controller, Get, Req } from '@nestjs/common';
import { InfluencerOnly } from '../security/decorators/influencer-only.decorator';
import { InfluencerService } from './influencer.service';

@InfluencerOnly()
@Controller('api/influencer')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @Get('dashboard')
  getDashboard(@Req() req: { user: { id: number } }) {
    return this.influencerService.getDashboard(req.user.id);
  }
}
