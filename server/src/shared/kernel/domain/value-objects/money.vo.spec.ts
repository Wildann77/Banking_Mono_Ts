import { DomainError } from '../../../domain/errors';
import { Money } from './money.vo';

describe('Money Value Object', () => {
  it('creates a valid money instance in minor units', () => {
    const money = Money.create(1000);
    expect(money.amount).toBe(1000n);
    expect(money.amountString).toBe('1000');
    expect(money.currency).toBe('IDR');
  });

  it('rejects decimal amounts', () => {
    expect(() => Money.create(10.5, 'IDR')).toThrow(DomainError);
    expect(() => Money.create(10.5, 'IDR')).toThrow('safe integer');
  });

  it('rejects zero and negative amounts', () => {
    expect(() => Money.create(0, 'IDR')).toThrow(DomainError);
    expect(() => Money.create(-10, 'IDR')).toThrow(DomainError);
  });

  it('adds and subtracts values with the same currency', () => {
    const moneyA = Money.create(1000, 'IDR');
    const moneyB = Money.create(500, 'IDR');

    expect(moneyA.add(moneyB).amount).toBe(1500n);
    expect(moneyA.subtract(moneyB).amount).toBe(500n);
  });

  it('throws when currencies mismatch', () => {
    const moneyA = Money.create(1000, 'IDR');
    const moneyB = Money.create(500, 'USD');

    expect(() => moneyA.add(moneyB)).toThrow(DomainError);
    expect(() => moneyA.subtract(moneyB)).toThrow(DomainError);
  });
});

// Money VO unit tests
