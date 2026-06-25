import { Transfer } from '@/modules/transfers/domain/transfer.entity';
import { IdempotencyKey } from '@/shared/kernel/domain/value-objects/idempotency-key.vo';

export const TRANSFER_REPOSITORY_PORT = Symbol('TRANSFER_REPOSITORY_PORT');

export interface TransferRepositoryPort {
  save(transfer: Transfer): Promise<void>;
  findById(id: string): Promise<Transfer | null>;
  findByIdempotencyKey(key: IdempotencyKey): Promise<Transfer | null>;
  findByIdempotencyKeyWithLock(key: IdempotencyKey): Promise<Transfer | null>;
  findByAccountIds(accountIds: string[], limit?: number, cursor?: string): Promise<Transfer[]>;
}

// TransferRepositoryPort: persistence abstraction
