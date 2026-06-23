import { Injectable } from '@nestjs/common';

import { UserRegisteredEvent } from '@/modules/identity-access/domain/events/user-registered.event';
import { DomainEventPublisherPort } from '@/shared/application/ports/domain-event-publisher.port';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

@Injectable()
export class IdentityAccessDomainEventPublisherAdapter extends DomainEventPublisherPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async publish(event: object): Promise<void> {
    if (event instanceof UserRegisteredEvent) {
      await this.prisma.outboxEvent.create({
        data: {
          aggregate_type: 'User',
          aggregate_id: event.userId,
          event_type: 'UserRegisteredEvent',
          payload: {
            userId: event.userId,
            email: event.email,
            name: event.name,
          },
          status: 'PENDING',
        },
      });
    }
  }
}

// Domain event publisher adapter
