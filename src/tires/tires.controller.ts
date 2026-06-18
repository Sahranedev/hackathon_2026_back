import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { TiresService } from './tires.service';

@UseGuards(JwtAuthGuard)
@Controller('api/tires')
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Get('mine')
  getUserTires(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.tiresService.getUserTires(authenticatedUser.id);
  }

  @Get('mine/:id/info')
  getUserTireInfo(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tiresService.getUserTireInfo(authenticatedUser.id, id);
  }

  @Get('/model/:id')
  getTireModelDetail(@Param('id', ParseIntPipe) id: number) {
    return this.tiresService.getTireModelDetail(id);
  }
}
