import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  PreconditionFailedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { lastValueFrom, Observable } from 'rxjs';

import {
  NotificationServicePort,
} from '@/modules/notifications/application/ports/notification-service.port';
import {
  NotificationDispatchResult,
  SendWelcomeEmailRequest,
} from '@/modules/notifications/application/types/notification-service.types';
import {
  ReconciliationServicePort,
} from '@/modules/ledger/application/ports/reconciliation-service.port';
import {
  AuditLedgerTamperingRequest,
  AuditLedgerTamperingResult,
  ConvertCurrencyRequest,
  ConvertCurrencyResult,
  GetExchangeRateRequest,
  GetExchangeRateResult,
  VerifyAccountBalanceRequest,
  VerifyAccountBalanceResult,
  VerifySystemInvariantsRequest,
  VerifySystemInvariantsResult,
} from '@/modules/ledger/application/types/reconciliation-service.types';
export const OPERATIONS_GRPC_CLIENT = 'OPERATIONS_GRPC_CLIENT';

interface NotificationResponseDto {
  success: boolean;
  error_code: string;
  message: string;
}

interface VerifyAccountBalanceResponseDto {
  is_valid: boolean;
  account_id: string;
  currency: string;
  expected_balance: string;
  calculated_balance: string;
  discrepancy: string;
  comparison_basis: string;
  message: string;
  error_code: string;
}

interface VerifySystemInvariantsResponseDto {
  is_valid: boolean;
  total_debit: string;
  total_credit: string;
  net_difference: string;
  message: string;
  error_code: string;
}

interface LedgerAnomalyDto {
  type: string;
  message: string;
  reference_id: string;
  occurred_at: string;
}

interface AuditLedgerTamperingResponseDto {
  anomalies_found: boolean;
  anomalies: LedgerAnomalyDto[];
  message: string;
  error_code: string;
}

interface GetExchangeRateResponseDto {
  source_currency: string;
  target_currency: string;
  rate: string;
  provider: string;
  as_of: string;
  message: string;
  error_code: string;
}

interface ConvertCurrencyResponseDto {
  source_currency: string;
  target_currency: string;
  source_amount: string;
  converted_amount: string;
  rate: string;
  rounding_mode: string;
  message: string;
  error_code: string;
}

interface BankingOperationsServiceClient {
  SendWelcomeEmail(payload: Record<string, unknown>): Observable<NotificationResponseDto>;
  VerifyAccountBalance(payload: Record<string, unknown>): Observable<VerifyAccountBalanceResponseDto>;
  VerifySystemInvariants(payload: Record<string, unknown>): Observable<VerifySystemInvariantsResponseDto>;
  AuditLedgerTampering(payload: Record<string, unknown>): Observable<AuditLedgerTamperingResponseDto>;
  GetExchangeRate(payload: Record<string, unknown>): Observable<GetExchangeRateResponseDto>;
  ConvertCurrency(payload: Record<string, unknown>): Observable<ConvertCurrencyResponseDto>;
}

@Injectable()
export class OperationsGrpcClientAdapter
implements NotificationServicePort, ReconciliationServicePort, OnModuleInit {
  private readonly logger = new Logger(OperationsGrpcClientAdapter.name);
  private operationsClient!: BankingOperationsServiceClient;

  constructor(@Inject(OPERATIONS_GRPC_CLIENT) private readonly grpcClient: ClientGrpc) {}

  onModuleInit(): void {
    this.operationsClient = this.grpcClient.getService<BankingOperationsServiceClient>(
      'BankingOperationsService',
    );
  }

  async sendWelcomeEmail(request: SendWelcomeEmailRequest): Promise<NotificationDispatchResult> {
    const response = await this.callRpc<NotificationResponseDto>('SendWelcomeEmail', {
      trace_id: request.traceId ?? '',
      user_id: request.userId,
      email: request.email,
      name: request.name,
    });

    return {
      success: response.success,
      errorCode: response.error_code,
      message: response.message,
    };
  }

  async verifyAccountBalance(
    request: VerifyAccountBalanceRequest,
  ): Promise<VerifyAccountBalanceResult> {
    const response = await this.callRpc<VerifyAccountBalanceResponseDto>('VerifyAccountBalance', {
      trace_id: request.traceId ?? '',
      account_id: request.accountId,
      currency: request.currency,
      expected_balance: request.expectedBalance ?? '',
    });

    return {
      isValid: response.is_valid,
      accountId: response.account_id,
      currency: response.currency,
      expectedBalance: response.expected_balance,
      calculatedBalance: response.calculated_balance,
      discrepancy: response.discrepancy,
      comparisonBasis: response.comparison_basis,
      message: response.message,
      errorCode: response.error_code,
    };
  }

  async verifySystemInvariants(
    request: VerifySystemInvariantsRequest,
  ): Promise<VerifySystemInvariantsResult> {
    const response = await this.callRpc<VerifySystemInvariantsResponseDto>('VerifySystemInvariants', {
      trace_id: request.traceId ?? '',
      from_occurred_at: request.fromOccurredAt ?? '',
      to_occurred_at: request.toOccurredAt ?? '',
    });

    return {
      isValid: response.is_valid,
      totalDebit: response.total_debit,
      totalCredit: response.total_credit,
      netDifference: response.net_difference,
      message: response.message,
      errorCode: response.error_code,
    };
  }

  async auditLedgerTampering(
    request: AuditLedgerTamperingRequest,
  ): Promise<AuditLedgerTamperingResult> {
    const response = await this.callRpc<AuditLedgerTamperingResponseDto>('AuditLedgerTampering', {
      trace_id: request.traceId ?? '',
      account_id: request.accountId ?? '',
      from_occurred_at: request.fromOccurredAt ?? '',
      to_occurred_at: request.toOccurredAt ?? '',
    });

    return {
      anomaliesFound: response.anomalies_found,
      anomalies: response.anomalies.map(anomaly => ({
        type: anomaly.type,
        message: anomaly.message,
        referenceId: anomaly.reference_id,
        occurredAt: anomaly.occurred_at,
      })),
      message: response.message,
      errorCode: response.error_code,
    };
  }

  async getExchangeRate(request: GetExchangeRateRequest): Promise<GetExchangeRateResult> {
    const response = await this.callRpc<GetExchangeRateResponseDto>('GetExchangeRate', {
      trace_id: request.traceId ?? '',
      source_currency: request.sourceCurrency,
      target_currency: request.targetCurrency,
    });

    return {
      sourceCurrency: response.source_currency,
      targetCurrency: response.target_currency,
      rate: response.rate,
      provider: response.provider,
      asOf: response.as_of,
      message: response.message,
      errorCode: response.error_code,
    };
  }

  async convertCurrency(request: ConvertCurrencyRequest): Promise<ConvertCurrencyResult> {
    const response = await this.callRpc<ConvertCurrencyResponseDto>('ConvertCurrency', {
      trace_id: request.traceId ?? '',
      source_currency: request.sourceCurrency,
      target_currency: request.targetCurrency,
      amount: request.amount,
    });

    return {
      sourceCurrency: response.source_currency,
      targetCurrency: response.target_currency,
      sourceAmount: response.source_amount,
      convertedAmount: response.converted_amount,
      rate: response.rate,
      roundingMode: response.rounding_mode,
      message: response.message,
      errorCode: response.error_code,
    };
  }

  private async callRpc<TResponse>(
    method: keyof BankingOperationsServiceClient,
    payload: Record<string, unknown>,
  ): Promise<TResponse> {
    try {
      return await lastValueFrom(this.operationsClient[method](payload) as Observable<TResponse>);
    } catch (error) {
      throw this.mapGrpcError(method, payload.trace_id, error);
    }
  }

  private mapGrpcError(method: string, traceId: unknown, error: unknown): Error {
    const grpcError = error as {
      code?: number;
      details?: string;
      message?: string;
      errorCode?: string;
    };
    const message = grpcError.details ?? grpcError.message ?? 'Operations RPC failed';

    this.logger.error({
      event: 'operations_grpc_call_failed',
      module: 'OperationsGrpcClientAdapter',
      rpcMethod: method,
      traceId: typeof traceId === 'string' ? traceId : undefined,
      grpcCode: grpcError.code,
      message,
    });

    switch (grpcError.code) {
      case status.UNAVAILABLE:
        return new ServiceUnavailableException({
          code: 'OPERATIONS_SERVICE_UNAVAILABLE',
          message,
        });
      case status.INVALID_ARGUMENT:
        return new BadRequestException({
          code: 'OPERATIONS_INVALID_ARGUMENT',
          message,
        });
      case status.NOT_FOUND:
        return new NotFoundException({
          code: 'OPERATIONS_TARGET_NOT_FOUND',
          message,
        });
      case status.FAILED_PRECONDITION:
        return new PreconditionFailedException({
          code: 'OPERATIONS_PRECONDITION_FAILED',
          message,
        });
      default:
        return new ServiceUnavailableException({
          code: 'OPERATIONS_RPC_FAILED',
          message,
        });
    }
  }
}

// gRPC client adapter for Operations Service
