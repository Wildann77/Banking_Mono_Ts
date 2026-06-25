import { Injectable } from '@nestjs/common';
import { Account as AccountRecord, Prisma } from '@prisma/client';

import { Account, AccountStatus } from '@/modules/accounts/domain/account.entity';
import { AccountRepositoryPort } from '@/modules/accounts/application/ports/account.repository.port';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

@Injectable()
export class AccountRepositoryAdapter implements AccountRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(record: AccountRecord): Account {
    return Account.reconstruct(
      {
        // Persistence keeps `owner_id`, but application/domain contract standardizes on `userId`.
        userId: record.owner_id,
        accountNumber: record.account_number,
        currency: record.currency,
        status: record.status as AccountStatus,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      },
      record.id,
    );
  }

  async create(account: Account): Promise<boolean> {
    try {
      await this.prisma.account.create({
        data: {
          id: account.id,
          owner_id: account.userId,
          account_number: account.accountNumber,
          currency: account.currency,
          status: account.status,
          created_at: account.createdAt,
          updated_at: account.updatedAt,
        },
      });

      return true;
    } catch (error: any) {
      const isUniqueConstraint = error.code === 'P2002';
      const isAccountNumber = 
        (Array.isArray(error.meta?.target) && error.meta.target.includes('account_number')) ||
        (typeof error.meta?.target === 'string' && error.meta.target.includes('account_number')) ||
        (error.message && error.message.includes('account_number'));

      if (isUniqueConstraint && isAccountNumber) {
        return false;
      }

      throw error;
    }
  }

  async save(account: Account): Promise<void> {
    await this.prisma.account.upsert({
      where: { id: account.id },
      update: {
        status: account.status,
        currency: account.currency,
        updated_at: account.updatedAt,
      },
      create: {
        id: account.id,
        owner_id: account.userId,
        account_number: account.accountNumber,
        currency: account.currency,
        status: account.status,
        created_at: account.createdAt,
        updated_at: account.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Account | null> {
    const record = await this.prisma.account.findUnique({ where: { id } });
    return record ? this.mapToDomain(record) : null;
  }

  async findByIdWithLock(id: string): Promise<Account | null> {
    const records = await this.prisma.$queryRaw<AccountRecord[]>(
      Prisma.sql`SELECT * FROM accounts WHERE id = ${id} FOR UPDATE`,
    );

    return records[0] ? this.mapToDomain(records[0]) : null;
  }

  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    const record = await this.prisma.account.findUnique({
      where: { account_number: accountNumber },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const records = await this.prisma.account.findMany({
      where: { owner_id: userId },
      orderBy: { created_at: 'asc' },
    });
    return records.map((record) => this.mapToDomain(record));
  }
}

// AccountRepositoryAdapter: Prisma implementation
