import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { AddGpsPointDto } from './dto/add-gps-point.dto';
import { FinishActivityDto } from './dto/finish-activity.dto';
import { StartActivityDto } from './dto/start-activity.dto';

@Controller('/api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id;

    return this.activitiesService.findAll(userId);
  }

  @Get('terrain-types')
  getTerrainTypes() {
    return this.activitiesService.getTerrainTypes();
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;

    return this.activitiesService.findOne(userId, id);
  }

  @Post('start')
  async start(@Req() req: any, @Body() startActivityDto: StartActivityDto) {
    const userId = req.user.id;

    return this.activitiesService.startActivity(userId, startActivityDto);
  }

  @Post(':id/points')
  async addGpsPoint(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() addGpsPointDto: AddGpsPointDto,
  ) {
    const userId = req.user.id;

    return this.activitiesService.addGpsPoint(userId, id, addGpsPointDto);
  }

  @Post(':id/finish')
  async finish(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() finishActivityDto: FinishActivityDto,
  ) {
    const userId = req.user.id;

    return this.activitiesService.finishActivity(userId, id, finishActivityDto);
  }

  @Post(':id/cancel')
  async cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.id;

    return this.activitiesService.cancelActivity(userId, id);
  }
}
