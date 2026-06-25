import { Entity } from '@/shared/domain/entity';

import { Money } from '@/shared/kernel/domain/value-objects/money.vo';

export enum LedgerEntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export interface LedgerEntryProps {
  accountId: string;
  transferId: string;
  type: LedgerEntryType;
  amount: Money;
  occurredAt: Date;
  createdAt: Date;
}

export class LedgerEntry extends Entity<LedgerEntryProps> {
  private constructor(props: LedgerEntryProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: Pick<LedgerEntryProps, 'accountId' | 'transferId' | 'type' | 'amount'>,
    id?: string,
  ): LedgerEntry {
    const now = new Date();

    return new LedgerEntry(
      {
        ...props,
        occurredAt: now,
        createdAt: now,
      },
      id,
    );
  }

  public static reconstruct(props: LedgerEntryProps, id: string): LedgerEntry {
    return new LedgerEntry(props, id);
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get transferId(): string {
    return this.props.transferId;
  }

  get type(): LedgerEntryType {
    return this.props.type;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

// LedgerEntry: immutable financial record
