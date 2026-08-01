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
import { TransactionFilters } from '@/components/transaction-filters';
import { getTranslations } from '@/i18n/server';

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
  const { t } = await getTranslations();
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
      select: {
        id: true,
        type: true,
        amount: true,
        note: true,
        occurredOn: true,
        category: { select: { name: true } },
        paymentMethod: { select: { name: true } },
        debtPayment: { select: { id: true } },
      },
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
    }),
    db.category.findMany({
      where: { userId: user.id, isArchived: false },
      select: { id: true, name: true, type: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }),
    db.paymentMethod.findMany({
      where: { userId: user.id, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    params.edit
      ? db.transaction.findFirst({
          where: { id: params.edit, userId: user.id },
          select: {
            id: true,
            type: true,
            amount: true,
            note: true,
            occurredOn: true,
            categoryId: true,
            paymentMethodId: true,
            debtPayment: { select: { id: true } },
          },
        })
      : null,
  ]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t('transaction.title')}</h1>
          <p className="muted">{t('transaction.description')}</p>
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
        <p className="notice">{t('transaction.debtPaymentNotice')}</p>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <TransactionFilters
          key={`${month}:${query}:${type ?? ''}`}
          month={month}
          query={query}
          type={type}
        />
      </div>

      <section className="table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2>{t('transaction.count', { count: transactions.length })}</h2>
        </div>
        {transactions.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{t('dashboard.content')}</th>
                  <th>{t('common.method')}</th>
                  <th>{t('common.amount')}</th>
                  <th aria-label={t('common.actions')} />
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{dateInputValue(transaction.occurredOn).split('-').reverse().join('/')}</td>
                    <td>
                      <span className="cell-title">
                        {transaction.category?.name ?? t('common.uncategorized')}
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
                            aria-label={t('transaction.edit')}
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
              <strong>{t('transaction.noMatches')}</strong>
              <span>{t('transaction.noMatchesDescription')}</span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
