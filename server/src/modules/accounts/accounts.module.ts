import { Module, forwardRef } from '@nestjs/common';
import { ACCOUNT_REPOSITORY_PORT } from '@/modules/accounts/application/ports/account.repository.port';
import { AccountRepositoryAdapter } from '@/modules/accounts/infrastructure/persistence/account.repository.adapter';
import { CreateAccountUseCase } from '@/modules/accounts/application/use-cases/create-account.use-case';
import { GetAccountUseCase } from '@/modules/accounts/application/use-cases/get-account.use-case';
import { ListUserAccountsUseCase } from '@/modules/accounts/application/use-cases/list-user-accounts.use-case';
import { LookupAccountUseCase } from '@/modules/accounts/application/use-cases/lookup-account.use-case';
import { FreezeAccountUseCase } from '@/modules/accounts/application/use-cases/freeze-account.use-case';
import { UnfreezeAccountUseCase } from '@/modules/accounts/application/use-cases/unfreeze-account.use-case';
import { CloseAccountUseCase } from '@/modules/accounts/application/use-cases/close-account.use-case';
import { AccountsController } from '@/modules/accounts/presentation/accounts.controller';
import { IdentityAccessModule } from '@/modules/identity-access/identity-access.module';
import { LedgerModule } from '@/modules/ledger/ledger.module';

@Module({
  imports: [
    forwardRef(() => IdentityAccessModule),
    forwardRef(() => LedgerModule),
  ],
  controllers: [AccountsController],
  providers: [
    {
      provide: ACCOUNT_REPOSITORY_PORT,
      useClass: AccountRepositoryAdapter,
    },
    CreateAccountUseCase,
    GetAccountUseCase,
    ListUserAccountsUseCase,
    LookupAccountUseCase,
    FreezeAccountUseCase,
    UnfreezeAccountUseCase,
    CloseAccountUseCase,
  ],
  exports: [ACCOUNT_REPOSITORY_PORT],
})
export class AccountsModule {}
