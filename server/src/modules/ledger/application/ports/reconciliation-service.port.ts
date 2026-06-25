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

export const RECONCILIATION_SERVICE_PORT = Symbol('RECONCILIATION_SERVICE_PORT');

export interface ReconciliationServicePort {
  verifyAccountBalance(request: VerifyAccountBalanceRequest): Promise<VerifyAccountBalanceResult>;
  verifySystemInvariants(
    request: VerifySystemInvariantsRequest,
  ): Promise<VerifySystemInvariantsResult>;
  auditLedgerTampering(
    request: AuditLedgerTamperingRequest,
  ): Promise<AuditLedgerTamperingResult>;
  getExchangeRate(request: GetExchangeRateRequest): Promise<GetExchangeRateResult>;
  convertCurrency(request: ConvertCurrencyRequest): Promise<ConvertCurrencyResult>;
}

// ReconciliationServicePort: external interface
