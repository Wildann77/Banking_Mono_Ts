import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '@/modules/identity-access/application/ports/password-hasher.port';
import { REFRESH_SESSION_REPOSITORY_PORT, RefreshSessionRepositoryPort } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { TOKEN_ISSUER_PORT, TokenIssuerPort } from '@/modules/identity-access/application/ports/token-issuer.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@/modules/identity-access/application/ports/user.repository.port';
import { RefreshSession } from '@/modules/identity-access/domain/refresh-session.entity';
import { EmailAddress } from '@/modules/identity-access/domain/value-objects/email-address.vo';
import { DomainError } from '@/shared/domain/errors';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';

export interface LoginCommand {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = EmailAddress.create(command.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.logger.warn({
        event: 'login_failed',
        traceId: this.traceContext.getTraceId(),
        reason: 'user_not_found',
      });
      throw new DomainError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const isPasswordValid = await this.passwordHasher.compare(command.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn({
        event: 'login_failed',
        traceId: this.traceContext.getTraceId(),
        userId: user.id,
        reason: 'invalid_password',
      });
      throw new DomainError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    const jti = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    const accessToken = this.tokenIssuer.generateAccessToken({
      sub: user.id,
      uid: user.id,
      tv: user.tokenVersion,
    });
    const refreshToken = this.tokenIssuer.generateRefreshToken({
      sub: user.id,
      uid: user.id,
      tv: user.tokenVersion,
      jti,
      fid: familyId,
    });

    const session = RefreshSession.create({
      userId: user.id,
      tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      jti,
      familyId,
      expiresAt: new Date(Date.now() + this.tokenIssuer.getRefreshTokenMaxAgeMs()),
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
    });

    await this.refreshSessionRepository.save(session);

    this.logger.log({
      event: 'user_logged_in',
      traceId: this.traceContext.getTraceId(),
      userId: user.id,
      refreshSessionId: session.id,
      familyId: session.familyId,
    });

    return {
      user: {
        id: user.id,
        email: user.email.value,
        name: user.name,
      },
      accessToken,
      accessTokenExpiresIn: this.tokenIssuer.getAccessTokenExpiresInSeconds(),
      refreshToken,
      refreshTokenMaxAgeMs: this.tokenIssuer.getRefreshTokenMaxAgeMs(),
    };
  }
}

// LoginUseCase: authentication flow
