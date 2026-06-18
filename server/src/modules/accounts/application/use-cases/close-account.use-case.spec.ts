import { AccountRepositoryPort } from '@/modules/accounts/application/ports/account.repository.port';
import { Account, AccountStatus } from '@/modules/accounts/domain/account.entity';
import { CloseAccountUseCase } from '@/modules/accounts/application/use-cases/close-account.use-case';
import { DomainError } from '@/shared/domain/errors';

describe('CloseAccountUseCase', () => {
  let useCase: CloseAccountUseCase;
  let accountRepository: jest.Mocked<AccountRepositoryPort>;

  beforeEach(() => {
    accountRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByIdWithLock: jest.fn(),
      findByAccountNumber: jest.fn(),
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<AccountRepositoryPort>;

    useCase = new CloseAccountUseCase(accountRepository);
  });

  const buildAccount = (status: AccountStatus = AccountStatus.ACTIVE, userId = 'user-1') =>
    Account.reconstruct(
      {
        userId,
        accountNumber: '1000000001',
        currency: 'IDR',
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      'acc-1',
    );

  it('closes owned account', async () => {
    accountRepository.findById.mockResolvedValue(buildAccount());

    const result = await useCase.execute('user-1', 'acc-1');

    expect(result.status).toBe(AccountStatus.CLOSED);
    expect(result.userId).toBe('user-1');
    expect(accountRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects already closed account', async () => {
    accountRepository.findById.mockResolvedValue(buildAccount(AccountStatus.CLOSED));

    await expect(useCase.execute('user-1', 'acc-1')).rejects.toMatchObject<Partial<DomainError>>({
      code: 'ACCOUNT_ALREADY_CLOSED',
      statusCode: 422,
    });

    expect(accountRepository.save).not.toHaveBeenCalled();
  });
});
