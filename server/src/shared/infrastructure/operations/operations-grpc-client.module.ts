import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  NOTIFICATION_SERVICE_PORT,
} from '@/modules/notifications/application/ports/notification-service.port';
import {
  RECONCILIATION_SERVICE_PORT,
} from '@/modules/ledger/application/ports/reconciliation-service.port';
import { OPERATIONS_GRPC_CLIENT, OperationsGrpcClientAdapter } from '@/shared/infrastructure/operations/operations-grpc-client.adapter';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: OPERATIONS_GRPC_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get<string>('OPERATIONS_GRPC_URL', 'localhost:50051'),
            package: 'banking.operations.v1',
            protoPath: require.resolve('@banking/proto/operations.proto'),
            loader: {
              keepCase: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [
    {
      provide: NOTIFICATION_SERVICE_PORT,
      useFactory: (adapter: OperationsGrpcClientAdapter) => adapter,
      inject: [OperationsGrpcClientAdapter],
    },
    {
      provide: RECONCILIATION_SERVICE_PORT,
      useFactory: (adapter: OperationsGrpcClientAdapter) => adapter,
      inject: [OperationsGrpcClientAdapter],
    },
    OperationsGrpcClientAdapter,
  ],
  exports: [NOTIFICATION_SERVICE_PORT, RECONCILIATION_SERVICE_PORT, OperationsGrpcClientAdapter],
})
export class OperationsGrpcClientModule {}

// OperationsGrpcClientModule: gRPC client setup
