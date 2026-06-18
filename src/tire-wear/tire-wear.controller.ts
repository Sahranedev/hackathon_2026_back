import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { TireWearService } from './tire-wear.service';
import { TireWearEvaluationResponseDto } from '../docs/api-response.dto';
import { ApiJwtAuth, ApiResourceNotFound } from '../docs/swagger.decorators';

@UseGuards(JwtAuthGuard)
@ApiTags('Tire Wear')
@ApiJwtAuth()
@Controller('api/tire-wear')
export class TireWearController {
  constructor(private readonly tireWearService: TireWearService) {}

  @Post(':userTireId/evaluate')
  @ApiOperation({
    summary: 'Evaluer et synchroniser l etat d usure d un pneu utilisateur.',
  })
  @ApiParam({ name: 'userTireId', type: Number, example: 12 })
  @ApiCreatedResponse({ type: TireWearEvaluationResponseDto })
  @ApiResourceNotFound('Pneu utilisateur introuvable ou sans modele Michelin lie.')
  evaluateUserTireWear(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('userTireId', ParseIntPipe) userTireId: number,
  ) {
    return this.tireWearService.evaluateUserTireWearForUser(
      authenticatedUser.id,
      userTireId,
    );
  }
}
