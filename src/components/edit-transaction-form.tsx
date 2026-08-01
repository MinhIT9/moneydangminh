'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { updateTransactionAction } from '@/actions/finance';
import { MoneyInput } from '@/components/money-input';
import { SubmitButton } from '@/components/submit-button';

type TransactionType = 'INCOME' | 'EXPENSE';

type EditTransactionFormProps = {
  transaction: {
    id: string;
    type: TransactionType;
    amount: string;
    note: string | null;
    occurredOn: string;
    categoryId: string | null;
    paymentMethodId: string | null;
  };
  categories: Array<{ id: string; name: string; type: TransactionType }>;
  methods: Array<{ id: string; name: string }>;
  month: string;
};

export function EditTransactionForm({
  transaction,
  categories,
  methods,
  month,
}: EditTransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction.type);
  const matchingCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  return (
    <details className="form-reveal" open>
      <summary>✎ Sửa giao dịch</summary>
      <form action={updateTransactionAction} className="form-card">
        <input type="hidden" name="id" value={transaction.id} />
        <input type="hidden" name="month" value={month} />
        <div className="form-grid">
          <fieldset className="field full type-field">
            <legend>Loại giao dịch</legend>
            <input name="type" type="hidden" value={type} />
            <div className="type-toggle" role="group" aria-label="Loại giao dịch">
              <button
                className={
                  type === 'INCOME' ? 'type-toggle__button is-income' : 'type-toggle__button'
                }
                type="button"
                aria-pressed={type === 'INCOME'}
                onClick={() => setType('INCOME')}
              >
                ↗ Thu nhập
              </button>
              <button
                className={
                  type === 'EXPENSE' ? 'type-toggle__button is-expense' : 'type-toggle__button'
                }
                type="button"
                aria-pressed={type === 'EXPENSE'}
                onClick={() => setType('EXPENSE')}
              >
                ↘ Chi tiêu
              </button>
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="edit-amount">Số tiền</label>
            <MoneyInput id="edit-amount" name="amount" defaultValue={transaction.amount} required />
          </div>
          <div className="field">
            <label htmlFor="edit-categoryId">Danh mục</label>
            <select
              id="edit-categoryId"
              key={type}
              name="categoryId"
              defaultValue={type === transaction.type ? (transaction.categoryId ?? '') : ''}
            >
              <option value="">Chưa phân loại</option>
              {matchingCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-paymentMethodId">Phương thức (không bắt buộc)</label>
            <select
              id="edit-paymentMethodId"
              name="paymentMethodId"
              defaultValue={transaction.paymentMethodId ?? ''}
            >
              <option value="">Không chọn</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-occurredOn">Ngày</label>
            <input
              id="edit-occurredOn"
              name="occurredOn"
              type="date"
              defaultValue={transaction.occurredOn}
              required
            />
          </div>
          <div className="field full">
            <label htmlFor="edit-note">Ghi chú</label>
            <input
              id="edit-note"
              name="note"
              defaultValue={transaction.note ?? ''}
              maxLength={300}
            />
          </div>
        </div>
        <div className="form-actions">
          <Link className="button-ghost" href={`/transactions?month=${month}`}>
            Hủy
          </Link>
          <SubmitButton pendingText="Đang cập nhật…">Lưu thay đổi</SubmitButton>
        </div>
      </form>
    </details>
  );
}
