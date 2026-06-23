import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { AccessTokenValidatorPort } from '@/modules/identity-access/application/ports/access-token-validator.port';
import { AppError } from '@/shared/domain/errors';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AccessTokenValidatorPort)
    private readonly accessTokenValidator: AccessTokenValidatorPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Access token is required',
      });
    }

    try {
      const user = await this.accessTokenValidator.execute(token);

      request['user'] = {
        id: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof AppError) {
        throw new UnauthorizedException({
          code: error.code,
          message: error.message,
        });
      }

      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Access token is invalid',
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// JwtAuthGuard: access token validation
