import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { AddGpsPointDto } from './dto/add-gps-point.dto';
import { FinishActivityDto } from './dto/finish-activity.dto';
import { StartActivityDto } from './dto/start-activity.dto';

@Controller('/api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async findAll(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.activitiesService.findAll(authenticatedUser.id);
  }

  @Post('start')
  async start(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() startActivityDto: StartActivityDto,
  ) {
    return this.activitiesService.startActivity(
      authenticatedUser.id,
      startActivityDto,
    );
  }

  @Get('terrain-types')
  getTerrainTypes() {
    return this.activitiesService.getTerrainTypes();
  }

  @Get(':id')
  async findOne(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.activitiesService.findOne(authenticatedUser.id, id);
  }

  @Post(':id/points')
  async addGpsPoint(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() addGpsPointDto: AddGpsPointDto,
  ) {
    return this.activitiesService.addGpsPoint(
      authenticatedUser.id,
      id,
      addGpsPointDto,
    );
  }

  @Post(':id/finish')
  async finish(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() finishActivityDto: FinishActivityDto,
  ) {
    return this.activitiesService.finishActivity(
      authenticatedUser.id,
      id,
      finishActivityDto,
    );
  }

  @Delete(':id')
  async delete(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.activitiesService.deleteActivity(authenticatedUser.id, id);
  }
}
