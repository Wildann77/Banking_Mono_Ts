import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/shared/infrastructure/redis/redis.module';
import { SendWelcomeEmailOnUserRegisteredHandler } from '@/modules/notifications/application/handlers/send-welcome-email-on-user-registered.handler';
import { UserRegisteredEvent } from '@/modules/identity-access/domain/events/user-registered.event';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisStreamConsumerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamConsumerService.name);
  private blockingRedis: Redis;
  private isRunning = false;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly sendWelcomeEmailHandler: SendWelcomeEmailOnUserRegisteredHandler,
  ) {}

  async onApplicationBootstrap() {
    this.blockingRedis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.isRunning = true;
    await this.setupConsumerGroup();
    this.runConsumerLoop().catch((err) => {
      this.logger.error('Consumer loop failed', err instanceof Error ? err.stack : String(err));
    });
  }

  onModuleDestroy() {
    this.isRunning = false;
    if (this.blockingRedis) {
      this.blockingRedis.disconnect();
    }
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  private async setupConsumerGroup() {
    try {
      await this.redis.xgroup('CREATE', 'outbox_stream', 'outbox_group', '$', 'MKSTREAM');
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) {
        this.logger.error('Failed to create consumer group', err);
      }
    }
  }

  private async runConsumerLoop() {
    this.logger.log('Starting Redis Streams consumer loop...');
    while (this.isRunning) {
      try {
        // 1. Coba baca pesan pending (PEL) milik consumer kita yang belum di-ACK
        let results = await (this.blockingRedis.xreadgroup as any)(
          'GROUP',
          'outbox_group',
          'consumer_1',
          'COUNT',
          '10',
          'STREAMS',
          'outbox_stream',
          '0',
        );

        let hasMessages = false;
        if (results && results.length > 0) {
          for (const [stream, messages] of results as any) {
            if (messages.length > 0) {
              hasMessages = true;
              this.logger.log(`Recovering ${messages.length} pending messages from PEL...`);
              for (const [messageId, fields] of messages as any) {
                await this.processMessage(messageId, fields as any);
              }
            }
          }
        }

        // 2. Jika tidak ada pesan pending di PEL, baca pesan baru (dan blokir jika tidak ada)
        if (!hasMessages) {
          results = await (this.blockingRedis.xreadgroup as any)(
            'GROUP',
            'outbox_group',
            'consumer_1',
            'BLOCK',
            '2000',
            'COUNT',
            '10',
            'STREAMS',
            'outbox_stream',
            '>',
          );

          if (results) {
            for (const [stream, messages] of results as any) {
              for (const [messageId, fields] of messages as any) {
                await this.processMessage(messageId, fields as any);
              }
            }
          }
        } else {
          // Beri jeda 1 detik jika memproses pesan pending untuk mencegah penggunaan CPU 100% saat terjadi error berulang
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (err) {
        if (!this.isRunning) break;
        this.logger.error('Error during stream consumption', err instanceof Error ? err.stack : String(err));
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private async processMessage(messageId: string, fields: string[]) {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }

      const eventType = data.event_type;
      const payload = JSON.parse(data.payload);

      this.logger.log(`Received event: ${eventType} with id ${data.id}`);

      if (eventType === 'UserRegisteredEvent') {
        const event = new UserRegisteredEvent(payload.userId, payload.email, payload.name);
        await this.sendWelcomeEmailHandler.handle(event);
      }

      await this.redis.xack('outbox_stream', 'outbox_group', messageId);
    } catch (err) {
      this.logger.error(`Failed to process message ${messageId}`, err instanceof Error ? err.stack : String(err));
    }
  }
}

// RedisStreamConsumer: consumes domain event streams
