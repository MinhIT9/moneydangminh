import 'server-only';

import { db } from '@/lib/db';

export function getMonthRange(month: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  const now = new Date();
  const year = match ? Number(match[1]) : now.getUTCFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : now.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
    value: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
  };
}

export function toNumber(value: { toString(): string } | number) {
  return Number(value.toString());
}

export function debtSummary(debt: {
  status?: 'ACTIVE' | 'SETTLED';
  originalAmount: { toString(): string } | number;
  payments: Array<{
    amount: { toString(): string } | number;
    isSettlement?: boolean;
  }>;
}) {
  const original = toNumber(debt.originalAmount);
  const paid = debt.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const outstanding = Math.max(0, original - paid);
  const isSettled =
    debt.status === 'SETTLED' || debt.payments.some((payment) => payment.isSettlement === true);

  return {
    original,
    paid,
    remaining: isSettled ? 0 : outstanding,
    settlementAdjustment: isSettled ? outstanding : 0,
  };
}
