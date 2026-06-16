import { Controller, Get, Req } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('/api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id;

    return this.activitiesService.findAll(userId);
  }
}
