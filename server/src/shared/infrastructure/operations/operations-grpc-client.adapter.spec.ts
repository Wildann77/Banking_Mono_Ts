import { BadRequestException, NotFoundException, PreconditionFailedException, ServiceUnavailableException } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { ClientGrpc } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

import { OperationsGrpcClientAdapter } from '@/shared/infrastructure/operations/operations-grpc-client.adapter';

describe('OperationsGrpcClientAdapter', () => {
  const grpcService = {
    SendWelcomeEmail: jest.fn(),
    VerifyAccountBalance: jest.fn(),
    VerifySystemInvariants: jest.fn(),
    AuditLedgerTampering: jest.fn(),
    GetExchangeRate: jest.fn(),
    ConvertCurrency: jest.fn(),
  };

  const grpcClient = {
    getService: jest.fn().mockReturnValue(grpcService),
  } as unknown as jest.Mocked<ClientGrpc>;

  const adapter = new OperationsGrpcClientAdapter(grpcClient);

  beforeEach(() => {
    jest.clearAllMocks();
    grpcClient.getService = jest.fn().mockReturnValue(grpcService);
    adapter.onModuleInit();
  });

  it('maps sendWelcomeEmail payload and response', async () => {
    grpcService.SendWelcomeEmail.mockReturnValue(of({
      success: true,
      error_code: '',
      message: 'sent',
    }));

    await expect(adapter.sendWelcomeEmail({
      userId: 'user-1',
      email: 'user@example.com',
      name: 'User',
      traceId: 'trace-1',
    })).resolves.toEqual({
      success: true,
      errorCode: '',
      message: 'sent',
    });

    expect(grpcService.SendWelcomeEmail).toHaveBeenCalledWith({
      trace_id: 'trace-1',
      user_id: 'user-1',
      email: 'user@example.com',
      name: 'User',
    });
  });

  it('maps UNAVAILABLE to OPERATIONS_SERVICE_UNAVAILABLE', async () => {
    grpcService.SendWelcomeEmail.mockReturnValue(throwError(() => ({
      code: status.UNAVAILABLE,
      details: 'service down',
    })));

    await expect(adapter.sendWelcomeEmail({
      userId: 'user-1',
      email: 'user@example.com',
      name: 'User',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps INVALID_ARGUMENT to BadRequestException', async () => {
    grpcService.GetExchangeRate.mockReturnValue(throwError(() => ({
      code: status.INVALID_ARGUMENT,
      details: 'bad currency',
    })));

    await expect(adapter.getExchangeRate({
      sourceCurrency: 'AAA',
      targetCurrency: 'USD',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps NOT_FOUND to NotFoundException', async () => {
    grpcService.VerifyAccountBalance.mockReturnValue(throwError(() => ({
      code: status.NOT_FOUND,
      details: 'account missing',
    })));

    await expect(adapter.verifyAccountBalance({
      accountId: 'missing',
      currency: 'USD',
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps FAILED_PRECONDITION to PreconditionFailedException', async () => {
    grpcService.VerifySystemInvariants.mockReturnValue(throwError(() => ({
      code: status.FAILED_PRECONDITION,
      details: 'invariant failed',
    })));

    await expect(adapter.verifySystemInvariants({})).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });
});

// gRPC client adapter unit tests
