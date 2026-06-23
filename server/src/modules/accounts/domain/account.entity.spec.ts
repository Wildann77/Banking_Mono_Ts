import { DomainError } from '@/shared/domain/errors';

import { Account, AccountStatus } from './account.entity';

describe('Account entity', () => {
  const buildAccount = (status: AccountStatus) =>
    Account.reconstruct(
      {
        userId: 'user-1',
        accountNumber: '1234567890',
        currency: 'IDR',
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      'account-1',
    );

  it('allows frozen account to receive incoming transfer', () => {
    expect(() => buildAccount(AccountStatus.FROZEN).assertCanReceiveTransfer()).not.toThrow();
  });

  it('rejects closed account from receiving incoming transfer', () => {
    expect(() => buildAccount(AccountStatus.CLOSED).assertCanReceiveTransfer()).toThrow(DomainError);
  });
});

// Account entity unit tests
