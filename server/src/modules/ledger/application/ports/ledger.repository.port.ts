import { LedgerEntry } from '@/modules/ledger/domain/ledger-entry.entity';
import { Money } from '@/shared/kernel/domain/value-objects/money.vo';

export const LEDGER_REPOSITORY_PORT = Symbol('LEDGER_REPOSITORY_PORT');

export interface LedgerRepositoryPort {
  save(entry: LedgerEntry): Promise<void>;
  saveBulk(entries: LedgerEntry[]): Promise<void>;
  findByAccountId(accountId: string, limit?: number, cursor?: string, options?: { from?: Date; to?: Date }): Promise<LedgerEntry[]>;
  calculateBalance(accountId: string, currency?: string): Promise<Money>;
  calculateBalancesBulk(accountIds: string[]): Promise<Map<string, Money>>;
}

// LedgerRepositoryPort: persistence abstraction
