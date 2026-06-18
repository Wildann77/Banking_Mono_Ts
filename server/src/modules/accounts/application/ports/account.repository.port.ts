import { Account } from '@/modules/accounts/domain/account.entity';

export const ACCOUNT_REPOSITORY_PORT = Symbol('ACCOUNT_REPOSITORY_PORT');

export interface AccountRepositoryPort {
  create(account: Account): Promise<boolean>;
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByIdWithLock(id: string): Promise<Account | null>;
  findByAccountNumber(accountNumber: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
}
