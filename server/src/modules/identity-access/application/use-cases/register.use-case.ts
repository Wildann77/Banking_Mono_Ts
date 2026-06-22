import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import { PASSWORD_HASHER_PORT, PasswordHasherPort } from '@/modules/identity-access/application/ports/password-hasher.port';
import { REFRESH_SESSION_REPOSITORY_PORT, RefreshSessionRepositoryPort } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { TOKEN_ISSUER_PORT, TokenIssuerPort } from '@/modules/identity-access/application/ports/token-issuer.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@/modules/identity-access/application/ports/user.repository.port';
import { UserRegisteredEvent } from '@/modules/identity-access/domain/events/user-registered.event';
import { RefreshSession } from '@/modules/identity-access/domain/refresh-session.entity';
import { User } from '@/modules/identity-access/domain/user.entity';
import { EmailAddress } from '@/modules/identity-access/domain/value-objects/email-address.vo';
import { DomainEventPublisherPort } from '@/shared/application/ports/domain-event-publisher.port';
import { TransactionManagerPort } from '@/shared/application/ports/transaction-manager.port';
import { DomainError } from '@/shared/domain/errors';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';

export interface RegisterCommand {
  email: string;
  name: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface RegisterResult {
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
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    @Inject(TransactionManagerPort)
    private readonly transactionManager: TransactionManagerPort,
    @Inject(DomainEventPublisherPort)
    private readonly domainEventPublisher: DomainEventPublisherPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const email = EmailAddress.create(command.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      this.logger.warn({
        event: 'user_registration_failed',
        traceId: this.traceContext.getTraceId(),
        reason: 'email_already_exists',
      });
      throw new DomainError('Email already exists', 'DUPLICATE_EMAIL', 409);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = User.create({
      email,
      name: command.name.trim(),
      passwordHash,
    });

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

    const refreshSession = RefreshSession.create({
      userId: user.id,
      tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      jti,
      familyId,
      expiresAt: new Date(Date.now() + this.tokenIssuer.getRefreshTokenMaxAgeMs()),
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
    });

    await this.transactionManager.execute(async () => {
      await this.userRepository.save(user);
      await this.refreshSessionRepository.save(refreshSession);
      await this.domainEventPublisher.publish(
        new UserRegisteredEvent(user.id, user.email.value, user.name),
      );
    });

    this.logger.log({
      event: 'user_registered',
      traceId: this.traceContext.getTraceId(),
      userId: user.id,
      refreshSessionId: refreshSession.id,
      familyId: refreshSession.familyId,
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

// RegisterUseCase: user registration flow
