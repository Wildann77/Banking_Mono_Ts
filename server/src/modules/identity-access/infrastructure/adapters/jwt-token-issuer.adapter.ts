import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  JwtClaims,
  JwtTokenType,
  TokenIssuerPort,
} from '@/modules/identity-access/application/ports/token-issuer.port';
import { DomainError } from '@/shared/domain/errors';

interface TokenExpiredLike {
  name: string;
}

function isTokenExpiredError(error: unknown): error is TokenExpiredLike {
  return typeof error === 'object' && error !== null && 'name' in error && (error as TokenExpiredLike).name === 'TokenExpiredError';
}

@Injectable()
export class JwtTokenIssuerAdapter implements TokenIssuerPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(claims: Omit<JwtClaims, 'typ' | 'iat' | 'exp'>): string {
    const payload: Omit<JwtClaims, 'iat' | 'exp'> = { ...claims, typ: 'access' };
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
  }

  generateRefreshToken(claims: Omit<JwtClaims, 'typ' | 'iat' | 'exp'>): string {
    const payload: Omit<JwtClaims, 'iat' | 'exp'> = { ...claims, typ: 'refresh' };
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
  }

  async verifyToken(token: string, type: JwtTokenType): Promise<JwtClaims> {
    try {
      const secretOption = type === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET';
      const secret = this.configService.getOrThrow<string>(secretOption);
      const payload = await this.jwtService.verifyAsync<JwtClaims>(token, { secret });

      if (payload.typ !== type) {
        throw new DomainError('Invalid token type', this.invalidTokenCode(type), 401);
      }

      return payload;
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        throw error;
      }

      if (isTokenExpiredError(error)) {
        throw new DomainError(
          type === 'refresh' ? 'Refresh token has expired' : 'Access token has expired',
          type === 'refresh' ? 'REFRESH_TOKEN_EXPIRED' : 'UNAUTHORIZED',
          401,
        );
      }

      throw new DomainError(
        type === 'refresh' ? 'Refresh token is invalid' : 'Access token is invalid',
        this.invalidTokenCode(type),
        401,
      );
    }
  }

  getAccessTokenExpiresInSeconds(): number {
    return this.parseDurationToSeconds(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    );
  }

  getRefreshTokenMaxAgeMs(): number {
    return this.parseDurationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    ) * 1000;
  }

  private invalidTokenCode(type: JwtTokenType): string {
    return type === 'refresh' ? 'REFRESH_TOKEN_INVALID' : 'UNAUTHORIZED';
  }

  private parseDurationToSeconds(value: string): number {
    const normalized = value.trim();
    const match = normalized.match(/^(\d+)([smhd])$/i);

    if (!match) {
      const numeric = Number(normalized);
      return Number.isFinite(numeric) ? numeric : 900;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return amount;
    }
  }
}

// JwtTokenIssuerAdapter: JWT implementation
