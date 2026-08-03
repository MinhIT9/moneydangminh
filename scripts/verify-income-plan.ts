import assert from 'node:assert/strict';
import { calculateIncomePlan } from '../src/lib/income-plan-calculator';

const manualPlan = calculateIncomePlan({
  month: '2026-08',
  currentMonth: '2026-08',
  currentDay: 3,
  actualIncome: 500_000,
  actualExpense: 300_000,
  averageMonthlyExpense: 700_000,
  dueDebtRemaining: 200_000,
  settings: {
    targetSurplus: 300_000,
    workdaysPerWeek: 6,
    extraExpectedExpense: 100_000,
    includeDueDebts: true,
    forecastMethod: 'MANUAL',
    manualMonthlyExpense: 900_000,
  },
});

assert.equal(manualPlan.totalIncomeTarget, 1_500_000);
assert.equal(manualPlan.incomeStillNeeded, 1_000_000);
assert.equal(manualPlan.workdaysRemaining, 25);
assert.equal(manualPlan.dailyTarget, 40_000);
assert.equal(manualPlan.weeklyTarget, 240_000);

const pacePlan = calculateIncomePlan({
  month: '2026-08',
  currentMonth: '2026-08',
  currentDay: 10,
  actualIncome: 700_000,
  actualExpense: 310_000,
  averageMonthlyExpense: 0,
  dueDebtRemaining: 0,
  settings: {
    targetSurplus: 0,
    workdaysPerWeek: 7,
    extraExpectedExpense: 0,
    includeDueDebts: false,
    forecastMethod: 'CURRENT_PACE',
    manualMonthlyExpense: null,
  },
});

assert.equal(pacePlan.projectedBaseExpense, 961_000);
assert.equal(pacePlan.incomeStillNeeded, 261_000);
assert.equal(pacePlan.dailyTarget, 12_000);

const completedMonth = calculateIncomePlan({
  month: '2026-07',
  currentMonth: '2026-08',
  currentDay: 3,
  actualIncome: 1_500_000,
  actualExpense: 1_200_000,
  averageMonthlyExpense: 900_000,
  dueDebtRemaining: 500_000,
  settings: {
    targetSurplus: 0,
    workdaysPerWeek: 6,
    extraExpectedExpense: 0,
    includeDueDebts: true,
    forecastMethod: 'CURRENT_PACE',
    manualMonthlyExpense: null,
  },
});

assert.equal(completedMonth.status, 'PAST');
assert.equal(completedMonth.dailyTarget, 0);
assert.equal(completedMonth.workdaysRemaining, 0);

console.log('Income-plan calculations verified.');
