export interface VerifyAccountBalanceRequest {
  accountId: string;
  currency: string;
  expectedBalance?: string;
  traceId?: string;
}

export interface VerifyAccountBalanceResult {
  isValid: boolean;
  accountId: string;
  currency: string;
  expectedBalance: string;
  calculatedBalance: string;
  discrepancy: string;
  comparisonBasis: string;
  message: string;
  errorCode: string;
}

export interface VerifySystemInvariantsRequest {
  fromOccurredAt?: string;
  toOccurredAt?: string;
  traceId?: string;
}

export interface VerifySystemInvariantsResult {
  isValid: boolean;
  totalDebit: string;
  totalCredit: string;
  netDifference: string;
  message: string;
  errorCode: string;
}

export interface AuditLedgerTamperingRequest {
  accountId?: string;
  fromOccurredAt?: string;
  toOccurredAt?: string;
  traceId?: string;
}

export interface LedgerAnomalyResult {
  type: string;
  message: string;
  referenceId: string;
  occurredAt: string;
}

export interface AuditLedgerTamperingResult {
  anomaliesFound: boolean;
  anomalies: LedgerAnomalyResult[];
  message: string;
  errorCode: string;
}

export interface GetExchangeRateRequest {
  sourceCurrency: string;
  targetCurrency: string;
  traceId?: string;
}

export interface GetExchangeRateResult {
  sourceCurrency: string;
  targetCurrency: string;
  rate: string;
  provider: string;
  asOf: string;
  message: string;
  errorCode: string;
}

export interface ConvertCurrencyRequest {
  sourceCurrency: string;
  targetCurrency: string;
  amount: string;
  traceId?: string;
}

export interface ConvertCurrencyResult {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: string;
  convertedAmount: string;
  rate: string;
  roundingMode: string;
  message: string;
  errorCode: string;
}

// Reconciliation types
