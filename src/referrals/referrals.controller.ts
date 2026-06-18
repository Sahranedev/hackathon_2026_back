import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../security/decorators/public.decorator';
import { ReferralsService } from './referrals.service';
import {
  ReferralOverviewResponseDto,
  ReferralValidationResponseDto,
} from '../docs/api-response.dto';
import { ApiJwtAuth } from '../docs/swagger.decorators';

@ApiTags('Referrals')
@Controller('api/referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Recuperer l apercu de parrainage du compte courant.' })
  @ApiOkResponse({ type: ReferralOverviewResponseDto })
  getMine(@Req() req: { user: { id: number } }) {
    return this.referralsService.getOverview(req.user.id);
  }

  @Public()
  @Get('validate/:code')
  @ApiOperation({ summary: 'Verifier si un code de parrainage existe.' })
  @ApiParam({ name: 'code', type: String, example: 'RIDE-A1B2C3' })
  @ApiOkResponse({ type: ReferralValidationResponseDto })
  validate(@Param('code') code: string) {
    return this.referralsService.validateCode(code);
  }
}
