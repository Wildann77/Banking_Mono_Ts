import { Injectable } from '@nestjs/common';
import { LedgerEntry as LedgerEntryRecord, Prisma } from '@prisma/client';

import { LedgerRepositoryPort } from '@/modules/ledger/application/ports/ledger.repository.port';
import { LedgerEntry, LedgerEntryType } from '@/modules/ledger/domain/ledger-entry.entity';
import { Money } from '@/shared/kernel/domain/value-objects/money.vo';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

@Injectable()
export class LedgerRepositoryAdapter implements LedgerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(record: LedgerEntryRecord): LedgerEntry {
    return LedgerEntry.reconstruct(
      {
        accountId: record.account_id,
        transferId: record.transfer_id,
        type: record.entry_type as LedgerEntryType,
        amount: Money.fromStoredAmount(record.amount, record.currency),
        occurredAt: record.occurred_at,
        createdAt: record.created_at,
      },
      record.id,
    );
  }

  async save(entry: LedgerEntry): Promise<void> {
    await this.prisma.ledgerEntry.create({
      data: {
        id: entry.id,
        account_id: entry.accountId,
        transfer_id: entry.transferId,
        entry_type: entry.type,
        amount: entry.amount.amount,
        currency: entry.amount.currency,
        occurred_at: entry.occurredAt,
        created_at: entry.createdAt,
      },
    });
  }

  async saveBulk(entries: LedgerEntry[]): Promise<void> {
    await this.prisma.ledgerEntry.createMany({
      data: entries.map((entry) => ({
        id: entry.id,
        account_id: entry.accountId,
        transfer_id: entry.transferId,
        entry_type: entry.type,
        amount: entry.amount.amount,
        currency: entry.amount.currency,
        occurred_at: entry.occurredAt,
        created_at: entry.createdAt,
      })),
    });
  }

  async findByAccountId(
    accountId: string,
    limit: number = 20,
    cursor?: string,
    options?: { from?: Date; to?: Date },
  ): Promise<LedgerEntry[]> {
    const dateFilter: Prisma.LedgerEntryWhereInput['occurred_at'] = {};
    if (options?.from) dateFilter.gte = options.from;
    if (options?.to) dateFilter.lte = options.to;

    const records = await this.prisma.ledgerEntry.findMany({
      where: {
        account_id: accountId,
        ...(options?.from || options?.to ? { occurred_at: dateFilter } : {}),
      },
      orderBy: [
        { occurred_at: 'desc' },
        { id: 'desc' }
      ],
      take: limit,
      ...(cursor ? {
        cursor: { id: cursor },
        skip: 1
      } : {}),
    });

    return records.map((record) => this.mapToDomain(record));
  }

  async calculateBalance(accountId: string, currency: string = 'IDR'): Promise<Money> {
    const result = await this.prisma.$queryRaw<Array<{ balance: bigint | number | string | null }>>(
      Prisma.sql`
        SELECT
          COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0) AS balance
        FROM ledger_entries
        WHERE account_id = ${accountId} AND currency = ${currency}
      `,
    );

    return Money.fromStoredAmount(result[0]?.balance ?? 0n, currency);
  }

  async calculateBalancesBulk(accountIds: string[]): Promise<Map<string, Money>> {
    if (accountIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.$queryRaw<Array<{
      account_id: string;
      currency: string;
      balance: bigint | number | string | null;
    }>>(
      Prisma.sql`
        SELECT
          accounts.id AS account_id,
          accounts.currency,
          COALESCE(SUM(CASE WHEN ledger_entries.entry_type = 'credit' THEN ledger_entries.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN ledger_entries.entry_type = 'debit' THEN ledger_entries.amount ELSE 0 END), 0) AS balance
        FROM accounts
        LEFT JOIN ledger_entries
          ON ledger_entries.account_id = accounts.id
          AND ledger_entries.currency = accounts.currency
        WHERE accounts.id IN (${Prisma.join(accountIds)})
        GROUP BY accounts.id, accounts.currency
      `,
    );

    return new Map(
      rows.map((row) => [
        row.account_id,
        Money.fromStoredAmount(row.balance ?? 0n, row.currency),
      ]),
    );
  }
}

// LedgerRepositoryAdapter: Prisma implementation
