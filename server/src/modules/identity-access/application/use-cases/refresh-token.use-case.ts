import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import { TransactionManagerPort } from '@/shared/application/ports/transaction-manager.port';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';
import { DomainError } from '@/shared/domain/errors';
import { REFRESH_SESSION_REPOSITORY_PORT, RefreshSessionRepositoryPort } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { TOKEN_ISSUER_PORT, TokenIssuerPort } from '@/modules/identity-access/application/ports/token-issuer.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@/modules/identity-access/application/ports/user.repository.port';
import { RefreshSession } from '@/modules/identity-access/domain/refresh-session.entity';

export interface RefreshTokenResult {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
}

type RefreshTokenExecutionResult =
  | { kind: 'rotated'; payload: RefreshTokenResult }
  | { kind: 'reused' }
  | { kind: 'expired' };

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    @Inject(TransactionManagerPort)
    private readonly transactionManager: TransactionManagerPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {}

  async execute(
    refreshTokenString: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshTokenResult> {
    const claims = await this.tokenIssuer.verifyToken(refreshTokenString, 'refresh');

    if (!claims.jti || !claims.fid || !claims.uid) {
      throw new DomainError('Refresh token is invalid', 'REFRESH_TOKEN_INVALID', 401);
    }

    const result = await this.transactionManager.execute<RefreshTokenExecutionResult>(async () => {
      const session = await this.refreshSessionRepository.findByJtiWithLock(claims.jti);
      if (!session) {
        throw new DomainError('Refresh token is invalid', 'REFRESH_TOKEN_INVALID', 401);
      }

      const user = await this.userRepository.findByIdWithLock(session.userId);
      if (!user) {
        throw new DomainError('User not found', 'USER_NOT_FOUND', 404);
      }

      if (claims.tv !== user.tokenVersion) {
        throw new DomainError('Refresh token is invalid', 'REFRESH_TOKEN_INVALID', 401);
      }

      if (session.isRevoked()) {
        const revokedCount = await this.refreshSessionRepository.revokeFamily(session.familyId);
        user.incrementTokenVersion();
        await this.userRepository.save(user);

        this.logger.warn({
          event: 'refresh_token_reuse_detected',
          traceId: this.traceContext.getTraceId(),
          userId: user.id,
          familyId: session.familyId,
          refreshSessionId: session.id,
          revokedCount,
        });

        return { kind: 'reused' };
      }

      const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');
      if (session.tokenHash !== tokenHash) {
        throw new DomainError('Refresh token is invalid', 'REFRESH_TOKEN_INVALID', 401);
      }

      if (session.isExpired()) {
        session.revoke();
        await this.refreshSessionRepository.save(session);

        this.logger.warn({
          event: 'refresh_token_expired',
          traceId: this.traceContext.getTraceId(),
          userId: user.id,
          familyId: session.familyId,
          refreshSessionId: session.id,
        });

        return { kind: 'expired' };
      }

      const newJti = crypto.randomUUID();
      const accessToken = this.tokenIssuer.generateAccessToken({
        sub: user.id,
        uid: user.id,
        tv: user.tokenVersion,
      });
      const newRefreshToken = this.tokenIssuer.generateRefreshToken({
        sub: user.id,
        uid: user.id,
        tv: user.tokenVersion,
        jti: newJti,
        fid: session.familyId,
      });

      const nextSession = RefreshSession.create({
        userId: user.id,
        tokenHash: crypto.createHash('sha256').update(newRefreshToken).digest('hex'),
        jti: newJti,
        familyId: session.familyId,
        expiresAt: new Date(Date.now() + this.tokenIssuer.getRefreshTokenMaxAgeMs()),
        userAgent,
        ipAddress,
      });

      await this.refreshSessionRepository.save(nextSession);
      session.revoke(nextSession.id);
      await this.refreshSessionRepository.save(session);

      this.logger.log({
        event: 'refresh_token_rotated',
        traceId: this.traceContext.getTraceId(),
        userId: user.id,
        familyId: session.familyId,
        previousRefreshSessionId: session.id,
        nextRefreshSessionId: nextSession.id,
      });

      return {
        kind: 'rotated',
        payload: {
          accessToken,
          accessTokenExpiresIn: this.tokenIssuer.getAccessTokenExpiresInSeconds(),
          refreshToken: newRefreshToken,
          refreshTokenMaxAgeMs: this.tokenIssuer.getRefreshTokenMaxAgeMs(),
        },
      };
    });

    if (result.kind === 'reused') {
      throw new DomainError('Refresh token was reused', 'REFRESH_TOKEN_REUSED', 401);
    }

    if (result.kind === 'expired') {
      throw new DomainError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED', 401);
    }

    return result.payload;
  }
}

// RefreshTokenUseCase: token rotation
