import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/identity-access/presentation/guards/jwt-auth.guard';
import { GetCurrentUser, CurrentUser } from '@/modules/identity-access/presentation/decorators/current-user.decorator';
import { GetAccountBalanceUseCase } from '@/modules/ledger/application/use-cases/get-account-balance.use-case';
import { ListLedgerEntriesUseCase } from '@/modules/ledger/application/use-cases/list-ledger-entries.use-case';
import { ListLedgerEntriesQueryDto } from '@/modules/ledger/presentation/dto/list-ledger-entries-query.dto';
import { withResponseMeta } from '@/shared/presentation/response.interface';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(
    private readonly getAccountBalanceUseCase: GetAccountBalanceUseCase,
    private readonly listLedgerEntriesUseCase: ListLedgerEntriesUseCase,
  ) {}

  @Get(':accountId/balance')
  async getBalance(
    @GetCurrentUser() user: CurrentUser,
    @Param('accountId') accountId: string,
  ) {
    return this.getAccountBalanceUseCase.execute(user.id, accountId);
  }

  @Get(':accountId/ledger')
  async getLedger(
    @GetCurrentUser() user: CurrentUser,
    @Param('accountId') accountId: string,
    @Query() query: ListLedgerEntriesQueryDto,
  ) {
    const result = await this.listLedgerEntriesUseCase.execute(
      user.id,
      accountId,
      query.limit ?? 20,
      query.cursor,
      { from: query.from, to: query.to },
    );

    return withResponseMeta(result.items, {
      nextCursor: result.nextCursor,
    });
  }
}

// LedgerController: ledger HTTP endpoints
