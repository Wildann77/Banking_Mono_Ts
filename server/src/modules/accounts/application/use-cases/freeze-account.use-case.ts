import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY_PORT, AccountRepositoryPort } from '@/modules/accounts/application/ports/account.repository.port';
import { AccountResult } from '@/modules/accounts/application/types/account.types';
import { DomainError } from '@/shared/domain/errors';

@Injectable()
export class FreezeAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  async execute(userId: string, accountId: string): Promise<AccountResult> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new DomainError('Account not found', 'ACCOUNT_NOT_FOUND', 404);
    }
    if (account.userId !== userId) {
      throw new DomainError('You do not have access to this account', 'FORBIDDEN', 403);
    }

    account.freeze();
    await this.accountRepository.save(account);

    return {
      id: account.id,
      accountNumber: account.accountNumber,
      userId: account.userId,
      status: account.status,
      currency: account.currency,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}

// FreezeAccountUseCase
