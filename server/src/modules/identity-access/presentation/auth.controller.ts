import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

import { LoginUseCase } from '@/modules/identity-access/application/use-cases/login.use-case';
import { LogoutGlobalUseCase } from '@/modules/identity-access/application/use-cases/logout-global.use-case';
import { LogoutUseCase } from '@/modules/identity-access/application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from '@/modules/identity-access/application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '@/modules/identity-access/application/use-cases/register.use-case';
import { GetCurrentUser, CurrentUser } from '@/modules/identity-access/presentation/decorators/current-user.decorator';
import { LoginDto } from '@/modules/identity-access/presentation/dto/login.dto';
import { RegisterDto } from '@/modules/identity-access/presentation/dto/register.dto';
import { JwtAuthGuard } from '@/modules/identity-access/presentation/guards/jwt-auth.guard';
import {
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  writeRefreshTokenCookie,
} from '@/modules/identity-access/presentation/refresh-token-cookie.helper';
import { DomainError } from '@/shared/domain/errors';
import { withResponseMeta } from '@/shared/presentation/response.interface';

const AUTH_LOGIN_THROTTLE = {
  default: {
    limit: 5,
    ttl: 60_000,
    getTracker: getAuthTracker,
  },
};

const AUTH_REGISTER_THROTTLE = {
  default: {
    limit: 3,
    ttl: 3_600_000,
    getTracker: getAuthTracker,
  },
};

function getAuthTracker(req: Record<string, unknown>): string {
  const headers = req.headers as Record<string, string | string[] | undefined> | undefined;
  const forwardedFor = headers?.['x-forwarded-for'];

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].split(',')[0].trim();
  }

  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return typeof req.ip === 'string' && req.ip.length > 0 ? req.ip : 'unknown';
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly logoutGlobalUseCase: LogoutGlobalUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle(AUTH_REGISTER_THROTTLE)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registerUseCase.execute({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    writeRefreshTokenCookie(
      res,
      this.configService,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );

    return withResponseMeta({
      user: result.user,
      accessToken: result.accessToken,
      accessTokenExpiresIn: result.accessTokenExpiresIn,
    });
  }

  @Post('login')
  @Throttle(AUTH_LOGIN_THROTTLE)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    writeRefreshTokenCookie(
      res,
      this.configService,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );

    return withResponseMeta({
      user: result.user,
      accessToken: result.accessToken,
      accessTokenExpiresIn: result.accessTokenExpiresIn,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      throw new DomainError('Refresh token is required', 'REFRESH_TOKEN_MISSING', 401);
    }

    const result = await this.refreshTokenUseCase.execute(
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    );

    writeRefreshTokenCookie(
      res,
      this.configService,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );

    return withResponseMeta({
      accessToken: result.accessToken,
      accessTokenExpiresIn: result.accessTokenExpiresIn,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUseCase.execute(req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]);
    clearRefreshTokenCookie(res, this.configService);

    return withResponseMeta({
      message: 'Logged out successfully',
    });
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @GetCurrentUser() user: CurrentUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutGlobalUseCase.execute(user.id);
    clearRefreshTokenCookie(res, this.configService);

    return withResponseMeta({
      message: 'All sessions revoked successfully',
    });
  }
}

// AuthController: auth HTTP endpoints
