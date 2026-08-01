import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { debtSummary, getMonthRange, toNumber } from '@/lib/finance';
import { formatVnd } from '@/lib/money';
import { db } from '@/lib/db';
import { monthInputValue } from '@/lib/date';
import { DashboardMonthFilter } from '@/components/dashboard-month-filter';
import { getTranslations } from '@/i18n/server';

function formatSelectedMonth(value: string, locale: 'vi' | 'en') {
  const [year, month] = value.split('-').map(Number);

  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
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

  const [
    transactionTotals,
    recentTransactions,
    expenseTotalsByCategory,
    debts,
    categories,
    transactionDates,
  ] = await Promise.all([
    db.transaction.groupBy({
      by: ['type'],
      where: { userId: user.id, occurredOn: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: { userId: user.id, occurredOn: { gte: start, lt: end } },
      select: {
        id: true,
        type: true,
        amount: true,
        note: true,
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
        originalAmount: true,
        payments: { select: { amount: true } },
      },
      orderBy: { dueOn: 'asc' },
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
  ]);

  const income = toNumber(
    transactionTotals.find((total) => total.type === 'INCOME')?._sum.amount ?? 0,
  );
  const expense = toNumber(
    transactionTotals.find((total) => total.type === 'EXPENSE')?._sum.amount ?? 0,
  );
  const remainingDebt = debts.reduce((sum, debt) => sum + debtSummary(debt).remaining, 0);
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
  const hasMonthTransactions = recentTransactions.length > 0;
  const selectedMonthLabel = formatSelectedMonth(month, locale);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>
            {t('dashboard.greeting', { name: user.displayName || t('dashboard.defaultName') })}
          </h1>
          <p className="muted">{t('dashboard.description')}</p>
        </div>
        <DashboardMonthFilter value={month} activeMonths={activeMonths} />
      </header>

      <section className="cards-grid" aria-label={t('dashboard.summary')}>
        <article className="metric-card">
          <small>{t('dashboard.totalIncome')}</small>
          <strong className="amount-income">{formatVnd(income)}</strong>
        </article>
        <article className="metric-card">
          <small>{t('dashboard.totalExpense')}</small>
          <strong className="amount-expense">{formatVnd(expense)}</strong>
        </article>
        <article className="metric-card">
          <small>{t('dashboard.net')}</small>
          <strong className="amount-net">{formatVnd(income - expense)}</strong>
        </article>
        <Link className="metric-card" href="/debts" prefetch>
          <small>{t('dashboard.remainingDebt')}</small>
          <strong>{formatVnd(remainingDebt)}</strong>
        </Link>
      </section>

      <section
        className={hasMonthTransactions ? 'section-grid' : 'section-grid dashboard-empty-grid'}
      >
        <article
          className={hasMonthTransactions ? 'table-card' : 'empty-card dashboard-empty-card'}
        >
          {hasMonthTransactions ? (
            <>
              <div className="card-header">
                <h2>{t('dashboard.recentTransactions')}</h2>
                <Link className="muted" href={`/transactions?month=${month}`} prefetch>
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('dashboard.content')}</th>
                      <th>{t('common.method')}</th>
                      <th>{t('common.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <span className="cell-title">
                            {transaction.category?.name ?? t('common.uncategorized')}
                          </span>
                          <span className="cell-note">
                            {transaction.note || t('common.noNote')}
                          </span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div>
              <span className="dashboard-empty-card__icon" aria-hidden="true">
                ◌
              </span>
              <p className="dashboard-empty-card__eyebrow">{t('dashboard.emptyMonthEyebrow')}</p>
              <strong>{t('dashboard.emptyMonthTitle', { month: selectedMonthLabel })}</strong>
              <span>{t('dashboard.emptyMonthDescription')}</span>
              <div className="dashboard-empty-card__actions">
                <Link className="button" href={`/transactions?month=${month}`} prefetch>
                  {t('dashboard.emptyMonthAction')}
                </Link>
                {month !== currentMonth ? (
                  <Link className="button-ghost" href="/dashboard" prefetch>
                    {t('dashboard.backToCurrentMonth')}
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </article>

        {hasMonthTransactions ? (
          <article className="card">
            <div className="card-header">
              <h2>{t('dashboard.expensesByCategory')}</h2>
            </div>
            <div className="list-stack">
              {topCategories.length ? (
                topCategories.map(([name, amount]) => (
                  <div className="list-row" key={name}>
                    <div>
                      <strong>{name}</strong>
                      <span>
                        {t('dashboard.percentOfExpenses', {
                          percent: expense ? Math.round((amount / expense) * 100) : 0,
                        })}
                      </span>
                    </div>
                    <b className="amount-expense">{formatVnd(amount)}</b>
                  </div>
                ))
              ) : (
                <p className="muted">{t('dashboard.noExpenses')}</p>
              )}
            </div>
          </article>
        ) : null}
      </section>
    </>
  );
}
