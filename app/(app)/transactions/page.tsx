import { DeleteTransactionForm } from '@/components/delete-transaction-form';
import { EditTransactionForm } from '@/components/edit-transaction-form';
import { TransactionForm } from '@/components/transaction-form';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { dateInputValue, monthInputValue } from '@/lib/date';
import { getMonthRange } from '@/lib/finance';
import { formatVnd } from '@/lib/money';
import { db } from '@/lib/db';
import { Prisma, TransactionType } from '@/generated/prisma/client';
import { MonthSelect } from '@/components/month-select';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    type?: string;
    q?: string;
    error?: string;
    edit?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const { start, end, value: month } = getMonthRange(params.month ?? monthInputValue());
  const query = params.q?.trim() ?? '';
  const type: TransactionType | undefined =
    params.type === 'INCOME'
      ? TransactionType.INCOME
      : params.type === 'EXPENSE'
        ? TransactionType.EXPENSE
        : undefined;
  const where: Prisma.TransactionWhereInput = {
    userId: user.id,
    occurredOn: { gte: start, lt: end },
    ...(type ? { type } : {}),
    ...(query ? { note: { contains: query } } : {}),
  };

  const [transactions, categories, methods, editingTransaction] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { category: true, paymentMethod: true, debtPayment: { select: { id: true } } },
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
    }),
    db.category.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }),
    db.paymentMethod.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: { name: 'asc' },
    }),
    params.edit
      ? db.transaction.findFirst({
          where: { id: params.edit, userId: user.id },
          include: { debtPayment: { select: { id: true } } },
        })
      : null,
  ]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Sổ thu chi</h1>
          <p className="muted">Ghi lại dòng tiền thật, không cần quản lý số dư ví.</p>
        </div>
      </header>

      {params.error ? <p className="notice">{params.error}</p> : null}

      <TransactionForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
        }))}
        methods={methods.map((method) => ({ id: method.id, name: method.name }))}
        open={Boolean(params.error)}
        today={dateInputValue(new Date())}
      />

      {editingTransaction && !editingTransaction.debtPayment ? (
        <EditTransactionForm
          transaction={{
            id: editingTransaction.id,
            type: editingTransaction.type,
            amount: editingTransaction.amount.toString(),
            note: editingTransaction.note,
            occurredOn: dateInputValue(editingTransaction.occurredOn),
            categoryId: editingTransaction.categoryId,
            paymentMethodId: editingTransaction.paymentMethodId,
          }}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            type: category.type,
          }))}
          methods={methods.map((method) => ({ id: method.id, name: method.name }))}
          month={month}
        />
      ) : editingTransaction ? (
        <p className="notice">
          Giao dịch này được tạo từ một lần thanh toán nợ. Hãy xóa giao dịch để khôi phục khoản nợ,
          sau đó ghi lại lần thanh toán đúng.
        </p>
      ) : null}

      <form className="filter-bar" action="/transactions" method="get" style={{ marginTop: 16 }}>
        <input className="filter-input" name="q" defaultValue={query} placeholder="Tìm ghi chú" />
        <MonthSelect value={month} />
        <select className="filter-input" name="type" defaultValue={type ?? ''}>
          <option value="">Tất cả loại</option>
          <option value="INCOME">Thu nhập</option>
          <option value="EXPENSE">Chi tiêu</option>
        </select>
        <button className="button-ghost" type="submit">
          Lọc
        </button>
      </form>

      <section className="table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2>{transactions.length} giao dịch</h2>
        </div>
        {transactions.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nội dung</th>
                  <th>Phương thức</th>
                  <th>Số tiền</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{dateInputValue(transaction.occurredOn).split('-').reverse().join('/')}</td>
                    <td>
                      <span className="cell-title">
                        {transaction.category?.name ?? 'Chưa phân loại'}
                      </span>
                      {transaction.note ? (
                        <span className="cell-note">{transaction.note}</span>
                      ) : null}
                    </td>
                    <td>{transaction.paymentMethod?.name ?? '—'}</td>
                    <td
                      className={transaction.type === 'INCOME' ? 'amount-income' : 'amount-expense'}
                    >
                      {transaction.type === 'INCOME' ? '+' : '−'} {formatVnd(transaction.amount)}
                    </td>
                    <td>
                      <div className="transaction-actions">
                        {!transaction.debtPayment ? (
                          <Link
                            className="icon-button"
                            href={`/transactions?month=${month}&edit=${transaction.id}`}
                            aria-label="Sửa giao dịch"
                          >
                            ✎
                          </Link>
                        ) : null}
                        <DeleteTransactionForm
                          transactionId={transaction.id}
                          isDebtPayment={Boolean(transaction.debtPayment)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-card">
            <div>
              <strong>Chưa có giao dịch phù hợp</strong>
              <span>Thử thay đổi bộ lọc hoặc ghi khoản đầu tiên.</span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
