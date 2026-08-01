'use client';

import { useMemo, useState } from 'react';
import { createTransactionAction } from '@/actions/finance';
import { MoneyInput } from '@/components/money-input';
import { SubmitButton } from '@/components/submit-button';

type TransactionType = 'INCOME' | 'EXPENSE';

type TransactionFormProps = {
  categories: Array<{ id: string; name: string; type: TransactionType }>;
  methods: Array<{ id: string; name: string }>;
  open: boolean;
  today: string;
};

export function TransactionForm({ categories, methods, open, today }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const matchingCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  return (
    <details className="form-reveal" open={open}>
      <summary>＋ Ghi thu chi</summary>
      <form action={createTransactionAction} className="form-card">
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
            <label htmlFor="amount">Số tiền</label>
            <MoneyInput id="amount" name="amount" required />
          </div>
          <div className="field">
            <label htmlFor="categoryId">Danh mục</label>
            <select id="categoryId" name="categoryId" defaultValue="">
              <option value="">Chưa phân loại</option>
              {matchingCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="paymentMethodId">Phương thức (không bắt buộc)</label>
            <select id="paymentMethodId" name="paymentMethodId" defaultValue="">
              <option value="">Không chọn</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="occurredOn">Ngày</label>
            <input id="occurredOn" name="occurredOn" type="date" defaultValue={today} required />
          </div>
          <div className="field full">
            <label htmlFor="note">Ghi chú</label>
            <input
              id="note"
              name="note"
              maxLength={300}
              placeholder="Ví dụ: Tip cuối ngày, nước mía..."
            />
          </div>
        </div>
        <div className="form-actions">
          <SubmitButton>Ghi giao dịch</SubmitButton>
        </div>
      </form>
    </details>
  );
}
