import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/identity-access/presentation/guards/jwt-auth.guard';
import { GetCurrentUser, CurrentUser } from '@/modules/identity-access/presentation/decorators/current-user.decorator';
import { CreateAccountDto } from '@/modules/accounts/presentation/dto/create-account.dto';
import { LookupAccountDto } from '@/modules/accounts/presentation/dto/lookup-account.dto';
import { CreateAccountUseCase } from '@/modules/accounts/application/use-cases/create-account.use-case';
import { GetAccountUseCase } from '@/modules/accounts/application/use-cases/get-account.use-case';
import { ListUserAccountsUseCase } from '@/modules/accounts/application/use-cases/list-user-accounts.use-case';
import { LookupAccountUseCase } from '@/modules/accounts/application/use-cases/lookup-account.use-case';
import { FreezeAccountUseCase } from '@/modules/accounts/application/use-cases/freeze-account.use-case';
import { UnfreezeAccountUseCase } from '@/modules/accounts/application/use-cases/unfreeze-account.use-case';
import { CloseAccountUseCase } from '@/modules/accounts/application/use-cases/close-account.use-case';
import { withResponseMeta } from '@/shared/presentation/response.interface';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly listUserAccountsUseCase: ListUserAccountsUseCase,
    private readonly lookupAccountUseCase: LookupAccountUseCase,
    private readonly freezeAccountUseCase: FreezeAccountUseCase,
    private readonly unfreezeAccountUseCase: UnfreezeAccountUseCase,
    private readonly closeAccountUseCase: CloseAccountUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAccount(
    @GetCurrentUser() user: CurrentUser,
    @Body() dto: CreateAccountDto,
  ) {
    const result = await this.createAccountUseCase.execute({
      userId: user.id,
      currency: dto.currency,
    });
    return withResponseMeta(result);
  }

  @Get()
  async getAccounts(
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.listUserAccountsUseCase.execute(user.id);
  }

  @Get('lookup')
  async lookupAccount(
    @GetCurrentUser() user: CurrentUser,
    @Query() dto: LookupAccountDto,
  ) {
    const result = await this.lookupAccountUseCase.execute(dto.accountNumber);
    return withResponseMeta(result);
  }

  @Get(':id')
  async getAccount(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') accountId: string,
  ) {
    return this.getAccountUseCase.execute(user.id, accountId);
  }

  @Patch(':id/freeze')
  @HttpCode(HttpStatus.OK)
  async freezeAccount(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') accountId: string,
  ) {
    const result = await this.freezeAccountUseCase.execute(user.id, accountId);
    return withResponseMeta(result);
  }

  @Patch(':id/unfreeze')
  @HttpCode(HttpStatus.OK)
  async unfreezeAccount(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') accountId: string,
  ) {
    const result = await this.unfreezeAccountUseCase.execute(user.id, accountId);
    return withResponseMeta(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async closeAccount(
    @GetCurrentUser() user: CurrentUser,
    @Param('id') accountId: string,
  ) {
    const result = await this.closeAccountUseCase.execute(user.id, accountId);
    return withResponseMeta(result);
  }
}

// AccountsController: account HTTP endpoints
