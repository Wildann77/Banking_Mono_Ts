import { Entity } from '@/shared/domain/entity';
import { DomainError } from '@/shared/domain/errors';

export enum AccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  CLOSED = 'closed',
}

export interface AccountProps {
  userId: string;
  accountNumber: string;
  currency: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends Entity<AccountProps> {
  private constructor(props: AccountProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: Pick<AccountProps, 'userId' | 'accountNumber' | 'currency'>,
    id?: string,
  ): Account {
    return new Account(
      {
        ...props,
        currency: props.currency || 'IDR',
        status: AccountStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  public static reconstruct(props: AccountProps, id: string): Account {
    return new Account(props, id);
  }

  public freeze(): void {
    if (this.props.status === AccountStatus.CLOSED) {
      throw new DomainError('Cannot freeze a closed account', 'ACCOUNT_ALREADY_CLOSED', 422);
    }
    this.props.status = AccountStatus.FROZEN;
    this.props.updatedAt = new Date();
  }

  public unfreeze(): void {
    if (this.props.status === AccountStatus.CLOSED) {
      throw new DomainError('Cannot unfreeze a closed account', 'ACCOUNT_ALREADY_CLOSED', 422);
    }
    this.props.status = AccountStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public close(): void {
    if (this.props.status === AccountStatus.CLOSED) {
      throw new DomainError('Account is already closed', 'ACCOUNT_ALREADY_CLOSED', 422);
    }
    this.props.status = AccountStatus.CLOSED;
    this.props.updatedAt = new Date();
  }

  public assertCanTransferOut(): void {
    if (this.props.status !== AccountStatus.ACTIVE) {
      throw new DomainError('Account is not transferable', 'ACCOUNT_NOT_TRANSFERABLE', 422);
    }
  }

  public assertCanReceiveTransfer(): void {
    // Fraud/ops freeze blocks outgoing movement, but inbound credits may still land.
    if (this.props.status === AccountStatus.CLOSED) {
      throw new DomainError('Account cannot receive transfers', 'ACCOUNT_NOT_TRANSFERABLE', 422);
    }
  }

  get userId(): string {
    return this.props.userId;
  }

  get accountNumber(): string {
    return this.props.accountNumber;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): AccountStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

// Account entity with lifecycle
