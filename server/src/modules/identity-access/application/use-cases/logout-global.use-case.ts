import { Inject, Injectable, Logger } from '@nestjs/common';

import { TransactionManagerPort } from '@/shared/application/ports/transaction-manager.port';
import { TraceContextPort } from '@/shared/application/ports/trace-context.port';
import { DomainError } from '@/shared/domain/errors';
import { REFRESH_SESSION_REPOSITORY_PORT, RefreshSessionRepositoryPort } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@/modules/identity-access/application/ports/user.repository.port';

@Injectable()
export class LogoutGlobalUseCase {
  private readonly logger = new Logger(LogoutGlobalUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY_PORT)
    private readonly refreshSessionRepository: RefreshSessionRepositoryPort,
    @Inject(TransactionManagerPort)
    private readonly transactionManager: TransactionManagerPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.transactionManager.execute(async () => {
      const user = await this.userRepository.findByIdWithLock(userId);
      if (!user) {
        throw new DomainError('User not found', 'USER_NOT_FOUND', 404);
      }

      user.incrementTokenVersion();
      await this.userRepository.save(user);
      const revokedCount = await this.refreshSessionRepository.revokeAllForUser(userId);

      this.logger.log({
        event: 'logout_all_completed',
        traceId: this.traceContext.getTraceId(),
        userId,
        revokedCount,
        tokenVersion: user.tokenVersion,
      });
    });
  }
}

// LogoutGlobalUseCase: revoke all sessions
