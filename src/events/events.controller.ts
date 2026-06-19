import { Controller, Get, Param, Post } from '@nestjs/common';
import { EventsService } from './events.service';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';

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
  findMyRegistrations(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.eventsService.findMyRegistrations(authenticatedUser);
  }
}