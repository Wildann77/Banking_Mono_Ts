import { RefreshSessionRepositoryPort } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { PasswordHasherPort } from '@/modules/identity-access/application/ports/password-hasher.port';
import { TokenIssuerPort } from '@/modules/identity-access/application/ports/token-issuer.port';
import { UserRepositoryPort } from '@/modules/identity-access/application/ports/user.repository.port';
import { User } from '@/modules/identity-access/domain/user.entity';
import { EmailAddress } from '@/modules/identity-access/domain/value-objects/email-address.vo';
import { LoginUseCase } from '@/modules/identity-access/application/use-cases/login.use-case';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let refreshSessionRepository: jest.Mocked<RefreshSessionRepositoryPort>;
  let tokenIssuer: jest.Mocked<TokenIssuerPort>;
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
    traceContext = {
      getTraceId: jest.fn().mockReturnValue('mock-trace-id'),
    } as unknown as jest.Mocked<TraceContextPort>;

    useCase = new LoginUseCase(
      userRepository,
      passwordHasher,
      refreshSessionRepository,
      tokenIssuer,
      traceContext,
    );
  });

  it('logs in a user from a clean application command', async () => {
    const user = User.create({
      email: EmailAddress.create('test@example.com'),
      name: 'Test User',
      passwordHash: 'hashed-password',
    });

    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Password123!',
      userAgent: 'jest-agent',
      ipAddress: '127.0.0.1',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(refreshSessionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid credentials with a stable error', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'missing@example.com',
        password: 'Password123!',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });
});

// LoginUseCase unit tests
