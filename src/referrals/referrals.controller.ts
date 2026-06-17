import { Controller, Get, Param, Req } from '@nestjs/common';
import { Public } from '../security/decorators/public.decorator';
import { ReferralsService } from './referrals.service';

@Controller('api/referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  getMine(@Req() req: { user: { id: number } }) {
    return this.referralsService.getOverview(req.user.id);
  }

  @Public()
  @Get('validate/:code')
  validate(@Param('code') code: string) {
    return this.referralsService.validateCode(code);
  }
}
