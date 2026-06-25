import { Injectable, Inject, Logger } from '@nestjs/common';
import { LEDGER_REPOSITORY_PORT, LedgerRepositoryPort } from '@/modules/ledger/application/ports/ledger.repository.port';
import { ACCOUNT_REPOSITORY_PORT, AccountRepositoryPort } from '@/modules/accounts/application/ports/account.repository.port';
import { DomainError } from '@/shared/domain/errors';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';

export interface BalanceResult {
  accountId: string;
  amount: string;
  currency: string;
}

@Injectable()
export class GetAccountBalanceUseCase {
  private readonly logger = new Logger(GetAccountBalanceUseCase.name);

  constructor(
    @Inject(LEDGER_REPOSITORY_PORT)
    private readonly ledgerRepository: LedgerRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {}

  async execute(userId: string, accountId: string): Promise<BalanceResult> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new DomainError('Account not found', 'ACCOUNT_NOT_FOUND', 404);
    }

    if (account.userId !== userId) {
      throw new DomainError('You do not have access to this account', 'FORBIDDEN', 403);
    }

    const balance = await this.ledgerRepository.calculateBalance(accountId, account.currency);

    this.logger.log({
      event: 'account_balance_read',
      accountId,
      userId,
      traceId: this.traceContext.getTraceId(),
    });

    return {
      accountId,
      amount: balance.amountString,
      currency: balance.currency,
    };
  }
}

// GetAccountBalanceUseCase
