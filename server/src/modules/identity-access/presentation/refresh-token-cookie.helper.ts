import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

function baseRefreshTokenCookieOptions(configService: ConfigService): CookieOptions {
  const cookieDomain = configService.get<string>('COOKIE_DOMAIN');

  return {
    httpOnly: true,
    secure: configService.get<boolean>('COOKIE_SECURE', true),
    sameSite: configService.get<'lax' | 'strict' | 'none'>('COOKIE_SAME_SITE', 'lax'),
    domain: cookieDomain || undefined,
    path: '/',
  };
}

export function writeRefreshTokenCookie(
  res: Response,
  configService: ConfigService,
  token: string,
  maxAgeMs: number,
): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    ...baseRefreshTokenCookieOptions(configService),
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(
  res: Response,
  configService: ConfigService,
): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, baseRefreshTokenCookieOptions(configService));
}

// Refresh token cookie helpers
