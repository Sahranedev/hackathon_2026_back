import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { TireWearService } from './tire-wear.service';

@UseGuards(JwtAuthGuard)
@Controller('api/tire-wear')
export class TireWearController {
  constructor(private readonly tireWearService: TireWearService) {}

  @Post(':userTireId/evaluate')
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
