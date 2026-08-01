import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { debtSummary, getMonthRange, toNumber } from '@/lib/finance';
import { formatVnd } from '@/lib/money';
import { db } from '@/lib/db';
import { monthInputValue } from '@/lib/date';
import { MonthSelect } from '@/components/month-select';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const { start, end, value: month } = getMonthRange(params.month ?? monthInputValue());

  const [transactions, debts] = await Promise.all([
    db.transaction.findMany({
      where: { userId: user.id, occurredOn: { gte: start, lt: end } },
      include: { category: true, paymentMethod: true },
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
    }),
    db.debt.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { payments: { select: { amount: true } } },
      orderBy: { dueOn: 'asc' },
    }),
  ]);

  const income = transactions
    .filter((transaction) => transaction.type === 'INCOME')
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const expense = transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const remainingDebt = debts.reduce((sum, debt) => sum + debtSummary(debt).remaining, 0);
  const categoryTotals = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .forEach((transaction) => {
      const label = transaction.category?.name ?? 'Chưa phân loại';
      categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + toNumber(transaction.amount));
    });

  const topCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Chào {user.displayName || 'bạn'} 👋</h1>
          <p className="muted">Nhìn lại thu chi của bạn trong tháng này.</p>
        </div>
        <form action="/dashboard" method="get">
          <label className="sr-only" htmlFor="dashboard-month">
            Chọn tháng
          </label>
          <MonthSelect id="dashboard-month" value={month} autoSubmit />
        </form>
      </header>

      <section className="cards-grid" aria-label="Tổng quan tài chính">
        <article className="metric-card">
          <small>Tổng thu</small>
          <strong className="amount-income">{formatVnd(income)}</strong>
        </article>
        <article className="metric-card">
          <small>Tổng chi</small>
          <strong className="amount-expense">{formatVnd(expense)}</strong>
        </article>
        <article className="metric-card">
          <small>Thu trừ chi</small>
          <strong className="amount-net">{formatVnd(income - expense)}</strong>
        </article>
        <Link className="metric-card" href="/debts">
          <small>Tổng nợ còn lại</small>
          <strong>{formatVnd(remainingDebt)}</strong>
        </Link>
      </section>

      <section className="section-grid">
        <article className="table-card">
          <div className="card-header">
            <h2>Giao dịch gần đây</h2>
            <Link className="muted" href={`/transactions?month=${month}`}>
              Xem tất cả
            </Link>
          </div>
          {transactions.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nội dung</th>
                    <th>Phương thức</th>
                    <th>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 7).map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className="cell-title">
                          {transaction.category?.name ?? 'Chưa phân loại'}
                        </span>
                        <span className="cell-note">{transaction.note || 'Không có ghi chú'}</span>
                      </td>
                      <td>{transaction.paymentMethod?.name ?? '—'}</td>
                      <td
                        className={
                          transaction.type === 'INCOME' ? 'amount-income' : 'amount-expense'
                        }
                      >
                        {transaction.type === 'INCOME' ? '+' : '−'} {formatVnd(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-card">
              <div>
                <strong>Chưa có giao dịch trong tháng này</strong>
                <span>Hãy bắt đầu bằng khoản thu hoặc chi đầu tiên của bạn.</span>
              </div>
            </div>
          )}
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Chi tiêu theo danh mục</h2>
          </div>
          <div className="list-stack">
            {topCategories.length ? (
              topCategories.map(([name, amount]) => (
                <div className="list-row" key={name}>
                  <div>
                    <strong>{name}</strong>
                    <span>
                      {expense ? `${Math.round((amount / expense) * 100)}% tổng chi` : '0%'}
                    </span>
                  </div>
                  <b className="amount-expense">{formatVnd(amount)}</b>
                </div>
              ))
            ) : (
              <p className="muted">Chưa có chi tiêu để phân tích.</p>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
