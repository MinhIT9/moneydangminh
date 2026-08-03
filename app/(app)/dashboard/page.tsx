import Image from 'next/image';
import Link from 'next/link';
import { DashboardMonthFilter } from '@/components/dashboard-month-filter';
import { DashboardIcon, DashboardIllustration } from '@/components/dashboard-visuals';
import { HelpTip } from '@/components/help-tip';
import { getTranslations } from '@/i18n/server';
import { requireUser } from '@/lib/auth';
import { dateInputValue, monthInputValue } from '@/lib/date';
import { db } from '@/lib/db';
import { debtSummary, getMonthRange, toNumber } from '@/lib/finance';
import {
  calculateIncomePlan,
  defaultIncomePlanSettings,
  type IncomeForecastMethod,
} from '@/lib/income-plan-calculator';
import { formatVnd } from '@/lib/money';

function formatSelectedMonth(value: string, locale: 'vi' | 'en') {
  const [year, month] = value.split('-').map(Number);

  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function formatDebtDate(value: Date, locale: 'vi' | 'en') {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(value);
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const { locale, t } = await getTranslations();
  const params = await searchParams;
  const { start, end, value: month } = getMonthRange(params.month ?? monthInputValue());
  const currentMonth = monthInputValue();
  const todayKey = dateInputValue(new Date());
  const currentDay = Number(todayKey.slice(8, 10));
  const [selectedYear, selectedMonthNumber] = month.split('-').map(Number);
  const historyStart = new Date(Date.UTC(selectedYear, selectedMonthNumber - 4, 1));

  const [
    transactionTotals,
    recentTransactions,
    expenseTotalsByCategory,
    debts,
    categories,
    transactionDates,
    savedIncomePlan,
    historicalExpenses,
  ] = await Promise.all([
    db.transaction.groupBy({
      by: ['type'],
      where: { userId: user.id, occurredOn: { gte: start, lt: end } },
      _sum: { amount: true, tipAmount: true },
      _count: { _all: true },
    }),
    db.transaction.findMany({
      where: { userId: user.id, occurredOn: { gte: start, lt: end } },
      select: {
        id: true,
        type: true,
        amount: true,
        tipAmount: true,
        note: true,
        occurredOn: true,
        category: { select: { name: true } },
        paymentMethod: { select: { name: true } },
      },
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
      take: 7,
    }),
    db.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: user.id,
        type: 'EXPENSE',
        occurredOn: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
    db.debt.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      select: {
        id: true,
        counterparty: true,
        direction: true,
        originalAmount: true,
        dueOn: true,
        payments: { select: { amount: true } },
      },
    }),
    db.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
    db.transaction.findMany({
      where: { userId: user.id },
      select: { occurredOn: true },
      distinct: ['occurredOn'],
    }),
    db.incomePlan.findUnique({
      where: { userId_month: { userId: user.id, month: start } },
    }),
    db.transaction.aggregate({
      where: {
        userId: user.id,
        type: 'EXPENSE',
        occurredOn: { gte: historyStart, lt: start },
      },
      _sum: { amount: true },
    }),
  ]);

  const incomeTotal = transactionTotals.find((total) => total.type === 'INCOME');
  const expenseTotal = transactionTotals.find((total) => total.type === 'EXPENSE');
  const income = toNumber(incomeTotal?._sum.amount ?? 0);
  const expense = toNumber(expenseTotal?._sum.amount ?? 0);
  const tips = toNumber(incomeTotal?._sum.tipAmount ?? 0);
  const net = income - expense;
  const transactionCount = transactionTotals.reduce(
    (total, transaction) => total + transaction._count._all,
    0,
  );
  const expenseRatio = percentage(expense, income);
  const tipShare = percentage(tips, income);
  const retentionRate = income > 0 ? Math.round((net / income) * 100) : 0;
  const cashflowMax = Math.max(income, expense, 1);

  const debtItems = debts
    .map((debt) => {
      const summary = debtSummary(debt);
      const dueKey = debt.dueOn ? dateInputValue(debt.dueOn) : null;

      return {
        ...debt,
        ...summary,
        dueKey,
        isOverdue: Boolean(dueKey && dueKey < todayKey),
      };
    })
    .filter((debt) => debt.remaining > 0)
    .sort((debtA, debtB) => {
      if (debtA.dueKey && debtB.dueKey) return debtA.dueKey.localeCompare(debtB.dueKey);
      if (debtA.dueKey) return -1;
      if (debtB.dueKey) return 1;
      return debtA.counterparty.localeCompare(debtB.counterparty, locale);
    });
  const payableDebts = debtItems.filter((debt) => debt.direction === 'I_OWE');
  const lentDebts = debtItems.filter((debt) => debt.direction === 'OWED_TO_ME');
  const debtsDueThisMonth = payableDebts.filter(
    (debt) => debt.dueOn && monthInputValue(debt.dueOn) === month,
  );
  const payableAmount = payableDebts.reduce((total, debt) => total + debt.remaining, 0);
  const lentAmount = lentDebts.reduce((total, debt) => total + debt.remaining, 0);
  const dueThisMonthAmount = debtsDueThisMonth.reduce((total, debt) => total + debt.remaining, 0);
  const overduePayableCount = payableDebts.filter((debt) => debt.isOverdue).length;
  const upcomingDebts = debtItems.slice(0, 5);
  const incomePlanSettings = savedIncomePlan
    ? {
        targetSurplus: toNumber(savedIncomePlan.targetSurplus),
        workdaysPerWeek: savedIncomePlan.workdaysPerWeek,
        extraExpectedExpense: toNumber(savedIncomePlan.extraExpectedExpense),
        includeDueDebts: savedIncomePlan.includeDueDebts,
        forecastMethod: savedIncomePlan.forecastMethod as IncomeForecastMethod,
        manualMonthlyExpense: savedIncomePlan.manualMonthlyExpense
          ? toNumber(savedIncomePlan.manualMonthlyExpense)
          : null,
      }
    : defaultIncomePlanSettings;
  const incomePlan = calculateIncomePlan({
    month,
    currentMonth,
    currentDay,
    actualIncome: income,
    actualExpense: expense,
    averageMonthlyExpense: Math.round(toNumber(historicalExpenses._sum.amount ?? 0) / 3),
    dueDebtRemaining: dueThisMonthAmount,
    settings: incomePlanSettings,
  });

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const categoryTotals = new Map<string, number>();

  expenseTotalsByCategory.forEach((total) => {
    const label = total.categoryId
      ? (categoryNames.get(total.categoryId) ?? t('common.uncategorized'))
      : t('common.uncategorized');
    const amount = toNumber(total._sum.amount ?? 0);
    categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + amount);
  });

  const topCategories = [...categoryTotals.entries()]
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .slice(0, 5);
  const activeMonths = [
    ...new Set(transactionDates.map((transaction) => monthInputValue(transaction.occurredOn))),
  ];
  const selectedMonthLabel = formatSelectedMonth(month, locale);
  const recordTransactionHref = `/transactions?month=${encodeURIComponent(month)}&record=1`;

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <span className="dashboard-hero__eyebrow">
            <DashboardIcon name="sparkles" />
            {t('dashboard.overviewEyebrow')}
          </span>
          <h1>
            {t('dashboard.greeting', { name: user.displayName || t('dashboard.defaultName') })}
          </h1>
          <p>{t('dashboard.periodDescription', { month: selectedMonthLabel })}</p>
          <div className="dashboard-hero__chips">
            <span>
              <DashboardIcon name="receipt" />
              {t('dashboard.transactionCount', { count: transactionCount })}
            </span>
            <span className={net >= 0 ? 'is-positive' : 'is-negative'}>
              <DashboardIcon name={net >= 0 ? 'arrow-up' : 'arrow-down'} />
              {net >= 0 ? t('dashboard.netPositive') : t('dashboard.netNegative')}
            </span>
          </div>
          <div className="dashboard-head-actions">
            <Link className="button" href={recordTransactionHref} prefetch>
              + {t('transaction.record')}
            </Link>
            <DashboardMonthFilter value={month} activeMonths={activeMonths} />
          </div>
        </div>
        <div className="dashboard-hero__visual">
          <DashboardIllustration />
        </div>
      </header>

      <section className="dashboard-metrics-grid" aria-label={t('dashboard.summary')}>
        <article className="metric-card dashboard-metric dashboard-metric--income">
          <div className="dashboard-metric__head">
            <span className="dashboard-metric__icon">
              <DashboardIcon name="arrow-up" />
            </span>
            <small>{t('dashboard.totalIncome')}</small>
          </div>
          <strong className="amount-income">{formatVnd(income)}</strong>
          <span>{t('dashboard.transactionCount', { count: transactionCount })}</span>
        </article>
        <article className="metric-card dashboard-metric dashboard-metric--expense">
          <div className="dashboard-metric__head">
            <span className="dashboard-metric__icon">
              <DashboardIcon name="arrow-down" />
            </span>
            <small>{t('dashboard.totalExpense')}</small>
          </div>
          <strong className="amount-expense">{formatVnd(expense)}</strong>
          <span>
            {income > 0
              ? t('dashboard.expenseShare', { percent: expenseRatio })
              : t('dashboard.noIncomeComparison')}
          </span>
        </article>
        <article className="metric-card dashboard-metric dashboard-metric--net">
          <div className="dashboard-metric__head">
            <span className="dashboard-metric__icon">
              <DashboardIcon name="scale" />
            </span>
            <small>{t('dashboard.net')}</small>
          </div>
          <strong className={net >= 0 ? 'amount-income' : 'amount-expense'}>
            {formatVnd(net)}
          </strong>
          <span>{net >= 0 ? t('dashboard.netPositive') : t('dashboard.netNegative')}</span>
        </article>
        <article className="metric-card dashboard-metric dashboard-metric--tip">
          <div className="dashboard-metric__head">
            <span className="dashboard-metric__icon">
              <DashboardIcon name="coins" />
            </span>
            <small>{t('dashboard.totalTips')}</small>
          </div>
          <strong>{formatVnd(tips)}</strong>
          <span>
            {tips > 0 ? t('dashboard.tipShare', { percent: tipShare }) : t('dashboard.noTips')}
          </span>
        </article>
      </section>

      <section className="dashboard-debt-grid" aria-label={t('dashboard.debtOverview')}>
        <Link className="dashboard-debt-card is-payable" href="/debts" prefetch>
          <span className="dashboard-debt-card__icon">
            <DashboardIcon name="wallet" />
          </span>
          <div>
            <small>{t('dashboard.payableDebt')}</small>
            <strong>{formatVnd(payableAmount)}</strong>
            <span>{t('dashboard.payableDebtCount', { count: payableDebts.length })}</span>
          </div>
        </Link>
        <Link className="dashboard-debt-card is-lent" href="/debts" prefetch>
          <span className="dashboard-debt-card__icon">
            <DashboardIcon name="hand-coins" />
          </span>
          <div>
            <small>{t('dashboard.lentOut')}</small>
            <strong>{formatVnd(lentAmount)}</strong>
            <span>{t('dashboard.lentOutCount', { count: lentDebts.length })}</span>
          </div>
        </Link>
        <Link className="dashboard-debt-card is-due" href="/debts" prefetch>
          <span className="dashboard-debt-card__icon">
            <DashboardIcon name="calendar" />
          </span>
          <div>
            <small>{t('dashboard.dueThisMonth')}</small>
            <strong>{formatVnd(dueThisMonthAmount)}</strong>
            <span>
              {t('dashboard.dueThisMonthCount', {
                count: debtsDueThisMonth.length,
                month: selectedMonthLabel,
              })}
            </span>
          </div>
          {overduePayableCount > 0 ? (
            <em>{t('dashboard.overdueCount', { count: overduePayableCount })}</em>
          ) : null}
        </Link>
      </section>

      <section className="dashboard-income-plan-card">
        <div className="dashboard-income-plan-card__copy">
          <span className="dashboard-income-plan-card__eyebrow">
            <DashboardIcon name="target" />
            {t('incomePlan.eyebrow')}
          </span>
          <div className="dashboard-income-plan-card__title">
            <h2>{t('incomePlan.title')}</h2>
            <HelpTip label={t('incomePlan.explainMonthly')}>
              {t('incomePlan.explainMonthly')}
            </HelpTip>
          </div>
          <p>{t('dashboard.incomePlanDescription')}</p>
          <div className="dashboard-income-plan-card__numbers">
            <div>
              <span>{t('incomePlan.perWorkday')}</span>
              <strong>{formatVnd(incomePlan.dailyTarget)}</strong>
            </div>
            <div>
              <span>{t('incomePlan.stillNeeded')}</span>
              <strong>{formatVnd(incomePlan.incomeStillNeeded)}</strong>
            </div>
          </div>
          <div className="dashboard-income-plan-card__progress">
            <span style={{ width: `${incomePlan.incomeProgress}%` }} />
          </div>
          <div className="dashboard-income-plan-card__footer">
            <small>{t('incomePlan.progressPercent', { percent: incomePlan.incomeProgress })}</small>
            <Link href={`/income-plan?month=${month}`} prefetch>
              {t('dashboard.openIncomePlan')} →
            </Link>
          </div>
        </div>
        <div className="dashboard-income-plan-card__art">
          <Image
            src="/images/heo-xinh-income-plan.png"
            alt=""
            width={1694}
            height={931}
            sizes="(max-width: 760px) 100vw, 35vw"
          />
        </div>
      </section>

      <section className="dashboard-insight-grid">
        <article className="card dashboard-cashflow-card">
          <div className="dashboard-section-heading">
            <span className="dashboard-section-heading__icon">
              <DashboardIcon name="scale" />
            </span>
            <div>
              <h2>{t('dashboard.cashflowTitle')}</h2>
              <p>{t('dashboard.cashflowDescription', { month: selectedMonthLabel })}</p>
            </div>
          </div>
          <div className="dashboard-cashflow-status">
            <div>
              <span>{t('dashboard.retentionRate')}</span>
              <strong className={retentionRate >= 0 ? 'amount-income' : 'amount-expense'}>
                {retentionRate}%
              </strong>
            </div>
            <p>
              {transactionCount === 0
                ? t('dashboard.cashflowEmpty')
                : net >= 0
                  ? t('dashboard.cashflowPositive')
                  : t('dashboard.cashflowNegative')}
            </p>
          </div>
          <div className="dashboard-cashflow-bars">
            <div>
              <span>
                {t('dashboard.totalIncome')} <b>{formatVnd(income)}</b>
              </span>
              <i className="is-income">
                <span style={{ width: `${(income / cashflowMax) * 100}%` }} />
              </i>
            </div>
            <div>
              <span>
                {t('dashboard.totalExpense')} <b>{formatVnd(expense)}</b>
              </span>
              <i className="is-expense">
                <span style={{ width: `${(expense / cashflowMax) * 100}%` }} />
              </i>
            </div>
          </div>
        </article>

        <article className="card dashboard-upcoming-card">
          <div className="dashboard-section-heading dashboard-section-heading--with-link">
            <span className="dashboard-section-heading__icon is-orange">
              <DashboardIcon name="calendar" />
            </span>
            <div>
              <h2>{t('dashboard.upcomingDebts')}</h2>
              <p>{t('dashboard.upcomingDebtsDescription')}</p>
            </div>
            <Link href="/debts" prefetch>
              {t('dashboard.viewDebts')}
            </Link>
          </div>
          {upcomingDebts.length ? (
            <div className="dashboard-debt-reminders">
              {upcomingDebts.map((debt) => (
                <Link className="dashboard-debt-reminder" href="/debts" key={debt.id} prefetch>
                  <span
                    className={
                      debt.direction === 'I_OWE'
                        ? 'dashboard-debt-reminder__icon is-payable'
                        : 'dashboard-debt-reminder__icon is-lent'
                    }
                  >
                    <DashboardIcon name={debt.direction === 'I_OWE' ? 'wallet' : 'hand-coins'} />
                  </span>
                  <span className="dashboard-debt-reminder__main">
                    <strong>{debt.counterparty}</strong>
                    <small>
                      {debt.direction === 'I_OWE' ? t('debt.toPay') : t('debt.toCollect')}
                    </small>
                  </span>
                  <span className="dashboard-debt-reminder__meta">
                    <strong>{formatVnd(debt.remaining)}</strong>
                    <small className={debt.isOverdue ? 'is-overdue' : ''}>
                      {debt.dueOn
                        ? debt.isOverdue
                          ? t('dashboard.overdueDate', {
                              date: formatDebtDate(debt.dueOn, locale),
                            })
                          : t('dashboard.dueDate', {
                              date: formatDebtDate(debt.dueOn, locale),
                            })
                        : t('dashboard.noDueDate')}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-compact-empty">
              <span>
                <DashboardIcon name="sparkles" />
              </span>
              <div>
                <strong>{t('dashboard.noActiveDebts')}</strong>
                <p>{t('dashboard.noActiveDebtsDescription')}</p>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="section-grid dashboard-ledger-grid">
        <article className="table-card">
          <div className="card-header">
            <h2>{t('dashboard.recentTransactions')}</h2>
            <Link className="muted" href={`/transactions?month=${month}`} prefetch>
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {recentTransactions.length ? (
            <div className="table-wrap">
              <table className="data-table dashboard-transactions-table">
                <thead>
                  <tr>
                    <th>{t('dashboard.content')}</th>
                    <th>{t('common.method')}</th>
                    <th>{t('common.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => {
                    const tipAmount = toNumber(transaction.tipAmount);

                    return (
                      <tr key={transaction.id}>
                        <td>
                          <div className="dashboard-transaction-cell">
                            <span
                              className={
                                transaction.type === 'INCOME'
                                  ? 'dashboard-transaction-icon is-income'
                                  : 'dashboard-transaction-icon is-expense'
                              }
                            >
                              <DashboardIcon
                                name={transaction.type === 'INCOME' ? 'arrow-up' : 'arrow-down'}
                              />
                            </span>
                            <span>
                              <b>{transaction.category?.name ?? t('common.uncategorized')}</b>
                              <small>
                                {transaction.note ||
                                  new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    timeZone: 'Asia/Ho_Chi_Minh',
                                  }).format(transaction.occurredOn)}
                              </small>
                              {tipAmount > 0 ? (
                                <em>
                                  {t('dashboard.transactionTip', { amount: formatVnd(tipAmount) })}
                                </em>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td>{transaction.paymentMethod?.name ?? '—'}</td>
                        <td
                          className={
                            transaction.type === 'INCOME' ? 'amount-income' : 'amount-expense'
                          }
                        >
                          {transaction.type === 'INCOME' ? '+' : '−'}{' '}
                          {formatVnd(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-compact-empty dashboard-compact-empty--ledger">
              <span>
                <DashboardIcon name="receipt" />
              </span>
              <div>
                <strong>{t('dashboard.emptyMonthTitle', { month: selectedMonthLabel })}</strong>
                <p>{t('dashboard.emptyMonthDescription')}</p>
                <Link className="button-ghost" href={recordTransactionHref} prefetch>
                  {t('dashboard.emptyMonthAction')}
                </Link>
              </div>
            </div>
          )}
        </article>

        <article className="card dashboard-category-card">
          <div className="card-header">
            <h2>{t('dashboard.expensesByCategory')}</h2>
          </div>
          {topCategories.length ? (
            <div className="dashboard-category-list">
              {topCategories.map(([name, amount], index) => {
                const percent = percentage(amount, expense);

                return (
                  <div className="dashboard-category-item" key={name}>
                    <div>
                      <span className={`dashboard-category-dot color-${(index % 5) + 1}`} />
                      <strong>{name}</strong>
                      <b className="amount-expense">{formatVnd(amount)}</b>
                    </div>
                    <span>
                      <i>
                        <span style={{ width: `${percent}%` }} />
                      </i>
                      <small>{t('dashboard.percentOfExpenses', { percent })}</small>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-compact-empty">
              <span>
                <DashboardIcon name="coins" />
              </span>
              <div>
                <strong>{t('dashboard.noExpenses')}</strong>
                <p>{t('dashboard.noExpensesDescription')}</p>
              </div>
            </div>
          )}
        </article>
      </section>

      {month !== currentMonth ? (
        <Link className="dashboard-current-month-link" href="/dashboard" prefetch>
          {t('dashboard.backToCurrentMonth')}
        </Link>
      ) : null}
    </div>
  );
}
