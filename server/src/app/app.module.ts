import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { IdentityAccessModule } from '@/modules/identity-access/identity-access.module';
import { AccountsModule } from '@/modules/accounts/accounts.module';
import { LedgerModule } from '@/modules/ledger/ledger.module';
import { TransfersModule } from '@/modules/transfers/transfers.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { HealthController } from '@/app/health.controller';
import { AppController } from '@/app/app.controller';
import { envValidationSchema } from '@/config/env.validation';
import { DatabaseHealthPort } from '@/app/application/ports/database-health.port';
import { CheckHealthUseCase } from '@/app/application/use-cases/check-health.use-case';
import { PrismaDatabaseHealthAdapter } from '@/app/infrastructure/prisma-database-health.adapter';
import { RedisModule } from '@/shared/infrastructure/redis/redis.module';
import { OperationsGrpcClientModule } from '@/shared/infrastructure/operations/operations-grpc-client.module';
import { OutboxRelayerService } from '@/shared/infrastructure/outbox/outbox-relayer.service';
import { RedisStreamConsumerService } from '@/shared/infrastructure/redis/redis-stream-consumer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => {
          return req.id || req.headers['x-correlation-id'] || randomUUID();
        },
        transport: process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                singleLine: true,
              },
            }
          : undefined,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000,
            limit: 100, // 100 requests per minute
          },
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          }),
        ),
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        }),
      }),
    }),
    DatabaseModule,
    NotificationsModule,
    IdentityAccessModule,
    AccountsModule,
    LedgerModule,
    TransfersModule,
    RedisModule,
    OperationsGrpcClientModule,
  ],
  controllers: [HealthController, AppController],
  providers: [
    {
      provide: DatabaseHealthPort,
      useClass: PrismaDatabaseHealthAdapter,
    },
    CheckHealthUseCase,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    OutboxRelayerService,
    RedisStreamConsumerService,
  ],
})
export class AppModule {}
