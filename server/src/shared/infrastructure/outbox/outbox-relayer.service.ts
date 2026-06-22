import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/shared/infrastructure/redis/redis.module';

@Injectable()
export class OutboxRelayerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => this.processOutbox(), 1000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: { status: 'PENDING' },
        take: 50,
        orderBy: { created_at: 'asc' },
      });

      for (const event of pendingEvents) {
        let dbSuccess = false;
        try {
          await this.prisma.outboxEvent.update({
            where: {
              id: event.id,
              status: 'PENDING', // Optimistic locking
            },
            data: {
              status: 'PROCESSED',
              processed_at: new Date(),
            },
          });
          dbSuccess = true;
        } catch (dbErr) {
          // Abaikan jika sudah diproses oleh proses lain
          continue;
        }

        if (dbSuccess) {
          try {
            await this.redis.xadd(
              'outbox_stream',
              '*',
              'id',
              event.id,
              'event_type',
              event.event_type,
              'payload',
              JSON.stringify(event.payload),
            );
          } catch (redisErr) {
            this.logger.error(
              `Failed to publish event ${event.id} to Redis stream. Reverting status to PENDING...`,
              redisErr instanceof Error ? redisErr.stack : String(redisErr),
            );

            try {
              await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: {
                  status: 'PENDING',
                  processed_at: null,
                },
              });
            } catch (revertErr) {
              this.logger.error(
                `Failed to revert outbox event ${event.id} status to PENDING!`,
                revertErr instanceof Error ? revertErr.stack : String(revertErr),
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to process outbox events', error instanceof Error ? error.stack : String(error));
    } finally {
      this.isProcessing = false;
    }
  }
}

// OutboxRelayer: delivers domain events via Redis Streams
