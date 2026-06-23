import { Inject, Injectable, Logger } from '@nestjs/common';

import { TraceContextPort } from '@/shared/application/ports/trace-context.port';
import { TOKEN_ISSUER_PORT, TokenIssuerPort } from '@/modules/identity-access/application/ports/token-issuer.port';
import { USER_REPOSITORY_PORT, UserRepositoryPort } from '@/modules/identity-access/application/ports/user.repository.port';
import { AccessTokenValidatorPort } from '@/modules/identity-access/application/ports/access-token-validator.port';
import { DomainError } from '@/shared/domain/errors';

export interface ValidatedAccessUser {
  id: string;
  email: string;
  tokenVersion: number;
}

@Injectable()
export class ValidateAccessTokenUseCase extends AccessTokenValidatorPort {
  private readonly logger = new Logger(ValidateAccessTokenUseCase.name);

  constructor(
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(TraceContextPort)
    private readonly traceContext: TraceContextPort,
  ) {
    super();
  }

  async execute(token: string): Promise<ValidatedAccessUser> {
    const payload = await this.tokenIssuer.verifyToken(token, 'access');
    const user = await this.userRepository.findById(payload.uid);

    if (!user || user.tokenVersion !== payload.tv) {
      this.logger.warn({
        event: 'access_token_rejected',
        traceId: this.traceContext.getTraceId(),
        tokenUserId: payload.uid,
        tokenVersion: payload.tv,
        persistedTokenVersion: user?.tokenVersion,
      });

      throw new DomainError('Access token is no longer valid', 'UNAUTHORIZED', 401);
    }

    return {
      id: user.id,
      email: user.email.value,
      tokenVersion: user.tokenVersion,
    };
  }
}

// ValidateAccessTokenUseCase: JWT verification
