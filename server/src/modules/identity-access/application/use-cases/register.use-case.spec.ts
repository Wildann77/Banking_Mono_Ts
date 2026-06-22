import { UserRegisteredEvent } from '@/modules/identity-access/domain/events/user-registered.event';
import { DomainEventPublisherPort } from '@/shared/application/ports/domain-event-publisher.port';
import { TransactionManagerPort } from '@/shared/application/ports/transaction-manager.port';
import { RefreshSessionRepositoryPort } from '../ports/refresh-session.repository.port';
import { PasswordHasherPort } from '../ports/password-hasher.port';
import { TokenIssuerPort } from '../ports/token-issuer.port';
import { UserRepositoryPort } from '../ports/user.repository.port';
import { User } from '../../domain/user.entity';
import { RegisterUseCase } from './register.use-case';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let refreshSessionRepository: jest.Mocked<RefreshSessionRepositoryPort>;
  let tokenIssuer: jest.Mocked<TokenIssuerPort>;
  let transactionManager: jest.Mocked<TransactionManagerPort>;
  let domainEventPublisher: jest.Mocked<DomainEventPublisherPort>;
  let traceContext: jest.Mocked<TraceContextPort>;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdWithLock: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    refreshSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByJti: jest.fn(),
      findByJtiWithLock: jest.fn(),
      findByFamilyId: jest.fn(),
      revokeFamily: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    tokenIssuer = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      verifyToken: jest.fn(),
      getAccessTokenExpiresInSeconds: jest.fn().mockReturnValue(900),
      getRefreshTokenMaxAgeMs: jest.fn().mockReturnValue(30 * 24 * 60 * 60 * 1000),
    };
    transactionManager = {
      execute: jest.fn(async (work: () => Promise<unknown>) => work()),
    } as unknown as jest.Mocked<TransactionManagerPort>;
    domainEventPublisher = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<DomainEventPublisherPort>;
    traceContext = {
      getTraceId: jest.fn().mockReturnValue('mock-trace-id'),
    } as unknown as jest.Mocked<TraceContextPort>;

    useCase = new RegisterUseCase(
      userRepository,
      passwordHasher,
      refreshSessionRepository,
      tokenIssuer,
      transactionManager,
      domainEventPublisher,
      traceContext,
    );
  });

  it('registers a user and issues auth session data from a clean command', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashedPassword123');
    domainEventPublisher.publish.mockResolvedValue();

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      userAgent: 'jest-agent',
      ipAddress: '127.0.0.1',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(refreshSessionRepository.save).toHaveBeenCalledTimes(1);
    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(domainEventPublisher.publish).toHaveBeenCalledWith(
      expect.any(UserRegisteredEvent),
    );
  });

  it('throws when email already exists', async () => {
    userRepository.findByEmail.mockResolvedValue({} as User);

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      }),
    ).rejects.toThrow('Email already exists');
  });
});

// RegisterUseCase unit tests
