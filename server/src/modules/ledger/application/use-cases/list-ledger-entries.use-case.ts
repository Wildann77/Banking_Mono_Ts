import { Injectable, Inject, Logger } from '@nestjs/common';
import { LEDGER_REPOSITORY_PORT, LedgerRepositoryPort } from '@/modules/ledger/application/ports/ledger.repository.port';
import { ACCOUNT_REPOSITORY_PORT, AccountRepositoryPort } from '@/modules/accounts/application/ports/account.repository.port';
import { DomainError } from '@/shared/domain/errors';
import { LedgerEntryType } from '@/modules/ledger/domain/ledger-entry.entity';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';

export interface LedgerEntryResult {
  id: string;
  accountId: string;
  transferId: string;
  type: LedgerEntryType;
  amount: string;
  currency: string;
  createdAt: Date;
}

export interface ListLedgerEntriesResult {
  items: LedgerEntryResult[];
  nextCursor: string | null;
}

@Injectable()
export class ListLedgerEntriesUseCase {
  private readonly logger = new Logger(ListLedgerEntriesUseCase.name);

  constructor(
    @Inject(LEDGER_REPOSITORY_PORT)
    private readonly ledgerRepository: LedgerRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {}

  async execute(
    userId: string,
    accountId: string,
    limit: number = 20,
    cursor?: string,
    options?: { from?: string; to?: string },
  ): Promise<ListLedgerEntriesResult> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new DomainError('Account not found', 'ACCOUNT_NOT_FOUND', 404);
    }

    if (account.userId !== userId) {
      throw new DomainError('You do not have access to this account', 'FORBIDDEN', 403);
    }

    const dateOptions = {
      ...(options?.from ? { from: new Date(options.from) } : {}),
      ...(options?.to ? { to: new Date(options.to) } : {}),
    };

    const entries = await this.ledgerRepository.findByAccountId(
      accountId,
      limit + 1,
      cursor,
      Object.keys(dateOptions).length > 0 ? dateOptions : undefined,
    );
    const hasMore = entries.length > limit;
    const visibleEntries = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? visibleEntries[visibleEntries.length - 1]?.id ?? null : null;

    this.logger.log({
      event: 'ledger_entries_read',
      accountId,
      userId,
      limit,
      cursor,
      traceId: this.traceContext.getTraceId(),
    });

    return {
      items: visibleEntries.map(entry => ({
        id: entry.id,
        accountId: entry.accountId,
        transferId: entry.transferId,
        type: entry.type,
        amount: entry.amount.amountString,
        currency: entry.amount.currency,
        occurredAt: entry.occurredAt,
        createdAt: entry.createdAt,
      })),
      nextCursor,
    };
  }
}

// ListLedgerEntriesUseCase
