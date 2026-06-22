import { Module } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '@/modules/identity-access/application/ports/user.repository.port';
import { REFRESH_SESSION_REPOSITORY_PORT } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { PASSWORD_HASHER_PORT } from '@/modules/identity-access/application/ports/password-hasher.port';
import { TOKEN_ISSUER_PORT } from '@/modules/identity-access/application/ports/token-issuer.port';
import { AccessTokenValidatorPort } from '@/modules/identity-access/application/ports/access-token-validator.port';
import { UserRepositoryAdapter } from '@/modules/identity-access/infrastructure/persistence/user.repository.adapter';
import { RefreshSessionRepositoryAdapter } from '@/modules/identity-access/infrastructure/persistence/refresh-session.repository.adapter';
import { BcryptPasswordHasherAdapter } from '@/modules/identity-access/infrastructure/adapters/bcrypt-password-hasher.adapter';
import { JwtTokenIssuerAdapter } from '@/modules/identity-access/infrastructure/adapters/jwt-token-issuer.adapter';
import { JwtModule } from '@nestjs/jwt';
import { RegisterUseCase } from '@/modules/identity-access/application/use-cases/register.use-case';
import { LoginUseCase } from '@/modules/identity-access/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@/modules/identity-access/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '@/modules/identity-access/application/use-cases/logout.use-case';
import { LogoutGlobalUseCase } from '@/modules/identity-access/application/use-cases/logout-global.use-case';
import { ValidateAccessTokenUseCase } from '@/modules/identity-access/application/use-cases/validate-access-token.use-case';
import { IdentityAccessDomainEventPublisherAdapter } from '@/modules/identity-access/infrastructure/events/identity-access-domain-event-publisher.adapter';
import { AuthController } from '@/modules/identity-access/presentation/auth.controller';
import { JwtAuthGuard } from '@/modules/identity-access/presentation/guards/jwt-auth.guard';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { DomainEventPublisherPort } from '@/shared/application/ports/domain-event-publisher.port';

@Module({
  imports: [
    JwtModule.register({}),
    NotificationsModule,
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: REFRESH_SESSION_REPOSITORY_PORT,
      useClass: RefreshSessionRepositoryAdapter,
    },
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasherAdapter,
    },
    {
      provide: TOKEN_ISSUER_PORT,
      useClass: JwtTokenIssuerAdapter,
    },
    {
      provide: DomainEventPublisherPort,
      useClass: IdentityAccessDomainEventPublisherAdapter,
    },
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    LogoutGlobalUseCase,
    ValidateAccessTokenUseCase,
    {
      provide: AccessTokenValidatorPort,
      useExisting: ValidateAccessTokenUseCase,
    },
    JwtAuthGuard,
  ],
  exports: [
     USER_REPOSITORY_PORT,
     TOKEN_ISSUER_PORT,
     AccessTokenValidatorPort,
     JwtAuthGuard,
  ],
})
export class IdentityAccessModule {}

// IdentityAccessModule: auth feature module
