import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/security/guards/jwt-auth.guard';
import { CreateUserTireDto } from './dto/create-user-tire.dto';
import { UpdateUserTireActiveDto } from './dto/update-user-tire-active.dto';
import { TiresService } from './tires.service';

@UseGuards(JwtAuthGuard)
@Controller('api/tires')
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Get('mine')
  getUserTires(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.tiresService.getUserTires(authenticatedUser.id);
  }

  @Post('mine')
  addUserTire(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() createUserTireDto: CreateUserTireDto,
  ) {
    return this.tiresService.addUserTire(
      authenticatedUser.id,
      createUserTireDto.tireId,
    );
  }

  @Get('mine/:id/info')
  getUserTireInfo(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tiresService.getUserTireInfo(authenticatedUser.id, id);
  }

  @Get('mine/:id/wear')
  getUserTireWear(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tiresService.getUserTireWear(authenticatedUser.id, id);
  }

  @Patch('mine/:id/active')
  updateUserTireActive(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserTireActiveDto: UpdateUserTireActiveDto,
  ) {
    return this.tiresService.updateUserTireActive(
      authenticatedUser.id,
      id,
      updateUserTireActiveDto.isActive,
    );
  }

  @Delete('mine/:id')
  deleteUserTire(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tiresService.deleteUserTire(authenticatedUser.id, id);
  }

  @Get('catalog/search')
  searchTireCatalog(@Query('q') query = '') {
    return this.tiresService.searchTireCatalog(query);
  }

  @Get('/model/:id')
  getTireModelDetail(@Param('id', ParseIntPipe) id: number) {
    return this.tiresService.getTireModelDetail(id);
  }

  @Get('model/:id/dealers')
  getTireDealers(@Param('id', ParseIntPipe) id: number) {
    return this.tiresService.getTireDealers(id);
  }
}
