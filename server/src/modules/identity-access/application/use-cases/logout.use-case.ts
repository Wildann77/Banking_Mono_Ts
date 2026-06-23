import { Inject, Injectable, Logger } from '@nestjs/common';

import { TraceContextPort } from '@/shared/application/ports/trace-context.port';
import { TransactionManagerPort } from '@/shared/application/ports/transaction-manager.port';
import { REFRESH_SESSION_REPOSITORY_PORT, RefreshSessionRepositoryPort } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { TOKEN_ISSUER_PORT, TokenIssuerPort } from '@/modules/identity-access/application/ports/token-issuer.port';

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    @Inject(TransactionManagerPort)
    private readonly transactionManager: TransactionManagerPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {}

  async execute(refreshTokenString?: string): Promise<void> {
    if (!refreshTokenString) {
      this.logger.log({
        event: 'logout_skipped',
        traceId: this.traceContext.getTraceId(),
        reason: 'missing_refresh_token',
      });
      return;
    }

    try {
      const claims = await this.tokenIssuer.verifyToken(refreshTokenString, 'refresh');
      if (!claims.jti) {
        this.logger.warn({
          event: 'logout_skipped',
          traceId: this.traceContext.getTraceId(),
          reason: 'missing_refresh_token_jti',
        });
        return;
      }

      await this.transactionManager.execute(async () => {
        const session = await this.refreshSessionRepository.findByJtiWithLock(claims.jti!);
        if (session && !session.isRevoked()) {
          session.revoke();
          await this.refreshSessionRepository.save(session);

          this.logger.log({
            event: 'logout_completed',
            traceId: this.traceContext.getTraceId(),
            userId: session.userId,
            refreshSessionId: session.id,
            familyId: session.familyId,
          });
        }
      });
    } catch {
      this.logger.warn({
        event: 'logout_skipped',
        traceId: this.traceContext.getTraceId(),
        reason: 'invalid_refresh_token',
      });

      // Ignore invalid refresh tokens during logout; cookie will still be cleared.
    }
  }
}

// LogoutUseCase: revoke refresh session
