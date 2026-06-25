import { Entity } from '@/shared/domain/entity';
import { DomainError } from '@/shared/domain/errors';
import { IdempotencyKey } from '@/shared/kernel/domain/value-objects/idempotency-key.vo';
import { Money } from '@/shared/kernel/domain/value-objects/money.vo';

export enum TransferStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export interface TransferProps {
  idempotencyKey: IdempotencyKey;
  fromAccountId: string;
  toAccountId: string;
  createdByUserId: string;
  amount: Money;
  status: TransferStatus;
  reference?: string | null;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class Transfer extends Entity<TransferProps> {
  private constructor(props: TransferProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: Pick<
      TransferProps,
      'idempotencyKey' | 'fromAccountId' | 'toAccountId' | 'createdByUserId' | 'amount' | 'reference'
    >,
    id?: string,
  ): Transfer {
    if (props.fromAccountId === props.toAccountId) {
      throw new DomainError('Source and destination account must be different', 'INVALID_TRANSFER_ROUTE', 422);
    }

    const now = new Date();

    return new Transfer(
      {
        ...props,
        status: TransferStatus.PENDING,
        reference: props.reference ?? null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: TransferProps, id: string): Transfer {
    return new Transfer(props, id);
  }

  public markCompleted(): void {
    const now = new Date();
    this.props.status = TransferStatus.COMPLETED;
    this.props.updatedAt = now;
    this.props.completedAt = now;
  }

  public markFailed(reason: string): void {
    const now = new Date();
    this.props.status = TransferStatus.FAILED;
    this.props.failureReason = reason;
    this.props.updatedAt = now;
    this.props.completedAt = now;
  }

  get idempotencyKey(): IdempotencyKey {
    return this.props.idempotencyKey;
  }

  get fromAccountId(): string {
    return this.props.fromAccountId;
  }

  get toAccountId(): string {
    return this.props.toAccountId;
  }

  get createdByUserId(): string {
    return this.props.createdByUserId;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get status(): TransferStatus {
    return this.props.status;
  }

  get reference(): string | null | undefined {
    return this.props.reference;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }
}

// Transfer entity with atomic semantics
