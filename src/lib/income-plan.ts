import 'server-only';

import { dateInputValue, monthInputValue } from '@/lib/date';
import { db } from '@/lib/db';
import { debtSummary, getMonthRange, toNumber } from '@/lib/finance';
import {
  calculateIncomePlan,
  defaultIncomePlanSettings,
  type IncomeForecastMethod,
  type IncomePlanSettings,
} from '@/lib/income-plan-calculator';

function monthStartFromValue(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1));
}

export async function getIncomePlanAnalysis(userId: string, requestedMonth?: string) {
  const { start, end, value: month } = getMonthRange(requestedMonth ?? monthInputValue());
  const [year, monthNumber] = month.split('-').map(Number);
  const historyStart = new Date(Date.UTC(year, monthNumber - 4, 1));
  const currentMonth = monthInputValue();
  const currentDay = Number(dateInputValue(new Date()).slice(8, 10));

  const [savedPlan, totals, historicalExpenses, dueDebts, transactionDates] = await Promise.all([
    db.incomePlan.findUnique({
      where: { userId_month: { userId, month: monthStartFromValue(month) } },
    }),
    db.transaction.groupBy({
      by: ['type'],
      where: { userId, occurredOn: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        occurredOn: { gte: historyStart, lt: start },
      },
      _sum: { amount: true },
    }),
    db.debt.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        direction: 'I_OWE',
        dueOn: { gte: start, lt: end },
      },
      select: {
        originalAmount: true,
        payments: { select: { amount: true, isSettlement: true } },
      },
    }),
    db.transaction.findMany({
      where: { userId },
      select: { occurredOn: true },
      distinct: ['occurredOn'],
    }),
  ]);

  const income = toNumber(totals.find((item) => item.type === 'INCOME')?._sum.amount ?? 0);
  const expense = toNumber(totals.find((item) => item.type === 'EXPENSE')?._sum.amount ?? 0);
  const averageMonthlyExpense = Math.round(toNumber(historicalExpenses._sum.amount ?? 0) / 3);
  const dueDebtRemaining = dueDebts.reduce((sum, debt) => sum + debtSummary(debt).remaining, 0);
  const settings: IncomePlanSettings = savedPlan
    ? {
        targetSurplus: toNumber(savedPlan.targetSurplus),
        workdaysPerWeek: savedPlan.workdaysPerWeek,
        extraExpectedExpense: toNumber(savedPlan.extraExpectedExpense),
        includeDueDebts: savedPlan.includeDueDebts,
        forecastMethod: savedPlan.forecastMethod as IncomeForecastMethod,
        manualMonthlyExpense: savedPlan.manualMonthlyExpense
          ? toNumber(savedPlan.manualMonthlyExpense)
          : null,
      }
    : defaultIncomePlanSettings;
  const calculation = calculateIncomePlan({
    month,
    currentMonth,
    currentDay,
    actualIncome: income,
    actualExpense: expense,
    averageMonthlyExpense,
    dueDebtRemaining,
    settings,
  });

  return {
    month,
    monthStart: monthStartFromValue(month),
    activeMonths: [
      ...new Set(transactionDates.map((transaction) => monthInputValue(transaction.occurredOn))),
    ],
    settings,
    calculation,
    isSaved: Boolean(savedPlan),
  };
}
