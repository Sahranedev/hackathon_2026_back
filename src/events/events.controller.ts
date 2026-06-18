import { Controller, Get, Param, Post } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Post(':eventId/register')
  register(@Param('eventId') eventId: string) {
    return this.eventsService.register(eventId);
  }

  @Get('me/registrations')
  findMyRegistrations() {
    return this.eventsService.findMyRegistrations();
  }
}