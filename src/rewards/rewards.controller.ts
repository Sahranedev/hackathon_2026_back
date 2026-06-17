import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';

@Controller('api/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me')
  findMine(@Req() req: { user: { id: number } }) {
    return this.rewardsService.findForUser(req.user.id);
  }

  @Patch(':id/use')
  use(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.rewardsService.useReward(req.user.id, id);
  }
}
