import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { RewardResponseDto } from '../docs/api-response.dto';
import {
  ApiJwtAuth,
  ApiResourceNotFound,
  ApiValidationError,
} from '../docs/swagger.decorators';

@ApiTags('Rewards')
@ApiJwtAuth()
@Controller('api/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lister les recompenses du compte courant.' })
  @ApiOkResponse({ type: [RewardResponseDto] })
  findMine(@Req() req: { user: { id: number } }) {
    return this.rewardsService.findForUser(req.user.id);
  }

  @Patch(':id/use')
  @ApiOperation({ summary: 'Marquer un bon de reduction comme utilise.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ type: RewardResponseDto })
  @ApiValidationError('Recompense non utilisable, deja utilisee ou expiree.')
  @ApiResourceNotFound('Recompense introuvable.')
  use(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.rewardsService.useReward(req.user.id, id);
  }
}
