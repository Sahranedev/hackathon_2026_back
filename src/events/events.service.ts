import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from 'src/security/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/types/authenticated-request.type';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.event.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async register(eventId: string) {
    const user = await this.prisma.user.findFirst({
      where: { mail: 'demo@email.test' },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur demo introuvable');
    }

    try {
      return await this.prisma.eventRegistration.create({
        data: {
          userId: user.id,
          eventId,
        },
        include: {
          event: true,
        },
      });
    } catch {
      throw new ConflictException('Déjà inscrit à cet événement');
    }
  }

  async findMyRegistrations(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    const user = await this.prisma.user.findFirst({
      where: { id: authenticatedUser.id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur demo introuvable');
    }

    return this.prisma.eventRegistration.findMany({
      where: { userId: user.id },
      include: { event: true },
      orderBy: {
        event: {
          date: 'asc',
        },
      },
    });
  }
}