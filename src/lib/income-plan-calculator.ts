export const incomeForecastMethods = ['CURRENT_PACE', 'THREE_MONTH_AVERAGE', 'MANUAL'] as const;

export type IncomeForecastMethod = (typeof incomeForecastMethods)[number];

export type IncomePlanSettings = {
  targetSurplus: number;
  workdaysPerWeek: number;
  extraExpectedExpense: number;
  includeDueDebts: boolean;
  forecastMethod: IncomeForecastMethod;
  manualMonthlyExpense: number | null;
};

export type IncomePlanCalculationInput = {
  month: string;
  currentMonth: string;
  currentDay: number;
  actualIncome: number;
  actualExpense: number;
  averageMonthlyExpense: number;
  dueDebtRemaining: number;
  settings: IncomePlanSettings;
};

export type IncomePlanCalculation = ReturnType<typeof calculateIncomePlan>;

export const defaultIncomePlanSettings: IncomePlanSettings = {
  targetSurplus: 0,
  workdaysPerWeek: 6,
  extraExpectedExpense: 0,
  includeDueDebts: true,
  forecastMethod: 'CURRENT_PACE',
  manualMonthlyExpense: null,
};

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function ceilToThousand(value: number) {
  return value > 0 ? Math.ceil(value / 1_000) * 1_000 : 0;
}

function daysInMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

/**
 * Pure calculator kept separate from database access so the financial rules can
 * be tested without a running application or MariaDB connection.
 */
export function calculateIncomePlan(input: IncomePlanCalculationInput) {
  const monthDays = daysInMonth(input.month);
  const isPastMonth = input.month < input.currentMonth;
  const isCurrentMonth = input.month === input.currentMonth;
  const elapsedDays = isPastMonth
    ? monthDays
    : isCurrentMonth
      ? Math.min(Math.max(input.currentDay, 1), monthDays)
      : 0;
  const remainingCalendarDays = isPastMonth ? 0 : Math.max(1, monthDays - elapsedDays + 1);
  const actualIncome = nonNegative(input.actualIncome);
  const actualExpense = nonNegative(input.actualExpense);
  const averageMonthlyExpense = nonNegative(input.averageMonthlyExpense);

  let projectedBaseExpense = actualExpense;

  if (!isPastMonth) {
    if (input.settings.forecastMethod === 'MANUAL') {
      projectedBaseExpense = Math.max(
        actualExpense,
        nonNegative(input.settings.manualMonthlyExpense ?? 0),
      );
    } else if (input.settings.forecastMethod === 'THREE_MONTH_AVERAGE') {
      projectedBaseExpense = Math.max(actualExpense, averageMonthlyExpense);
    } else if (elapsedDays > 0) {
      projectedBaseExpense = Math.max(
        actualExpense,
        Math.round((actualExpense / elapsedDays) * monthDays),
      );
    }
  }

  const forecastExpenseRemaining = Math.max(0, projectedBaseExpense - actualExpense);
  const dueDebtIncluded = input.settings.includeDueDebts ? nonNegative(input.dueDebtRemaining) : 0;
  const extraExpectedExpense = nonNegative(input.settings.extraExpectedExpense);
  const targetSurplus = nonNegative(input.settings.targetSurplus);
  const totalIncomeTarget =
    actualExpense +
    forecastExpenseRemaining +
    extraExpectedExpense +
    dueDebtIncluded +
    targetSurplus;
  const incomeStillNeeded = Math.max(0, totalIncomeTarget - actualIncome);
  const workdaysPerWeek = Math.min(7, Math.max(1, Math.round(input.settings.workdaysPerWeek)));
  const workdaysRemaining = isPastMonth
    ? 0
    : Math.max(1, Math.ceil((remainingCalendarDays * workdaysPerWeek) / 7));
  const dailyTarget = workdaysRemaining ? ceilToThousand(incomeStillNeeded / workdaysRemaining) : 0;
  const weeklyTarget = ceilToThousand(dailyTarget * workdaysPerWeek);
  const incomeProgress = totalIncomeTarget
    ? Math.min(100, Math.round((actualIncome / totalIncomeTarget) * 100))
    : actualIncome > 0
      ? 100
      : 0;
  const timeProgress = Math.round((elapsedDays / monthDays) * 100);
  const projectedBalance =
    actualIncome -
    actualExpense -
    forecastExpenseRemaining -
    extraExpectedExpense -
    dueDebtIncluded;
  const status = isPastMonth
    ? 'PAST'
    : incomeStillNeeded === 0
      ? 'REACHED'
      : incomeProgress + 8 >= timeProgress
        ? 'ON_TRACK'
        : 'NEEDS_ATTENTION';

  return {
    monthDays,
    elapsedDays,
    remainingCalendarDays,
    workdaysRemaining,
    workdaysPerWeek,
    actualIncome,
    actualExpense,
    averageMonthlyExpense,
    projectedBaseExpense,
    forecastExpenseRemaining,
    dueDebtRemaining: nonNegative(input.dueDebtRemaining),
    dueDebtIncluded,
    extraExpectedExpense,
    targetSurplus,
    totalIncomeTarget,
    incomeStillNeeded,
    dailyTarget,
    weeklyTarget,
    incomeProgress,
    timeProgress,
    projectedBalance,
    status,
    isPastMonth,
  } as const;
}
