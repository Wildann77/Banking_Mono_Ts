import { AccountStatus } from '@/modules/accounts/domain/account.entity';

export interface AccountResult {
  id: string;
  accountNumber: string;
  userId: string;
  status: AccountStatus;
  currency: string;
  balance?: {
    amount: string;
    currency: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface AccountLookupResult {
  id: string;
  accountNumber: string;
  currency: string;
  status: AccountStatus;
}
