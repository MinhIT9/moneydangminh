'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { updateTransactionAction } from '@/actions/finance';
import { MoneyInput } from '@/components/money-input';
import { SubmitButton } from '@/components/submit-button';
import { useLocale } from '@/i18n/locale-provider';

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
  const { t } = useLocale();
  const [type, setType] = useState<TransactionType>(transaction.type);
  const matchingCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  return (
    <details className="form-reveal" open>
      <summary>✎ {t('transaction.edit')}</summary>
      <form action={updateTransactionAction} className="form-card">
        <input type="hidden" name="id" value={transaction.id} />
        <input type="hidden" name="month" value={month} />
        <div className="form-grid">
          <fieldset className="field full type-field">
            <legend>{t('transaction.type')}</legend>
            <input name="type" type="hidden" value={type} />
            <div className="type-toggle" role="group" aria-label={t('transaction.type')}>
              <button
                className={
                  type === 'INCOME' ? 'type-toggle__button is-income' : 'type-toggle__button'
                }
                type="button"
                aria-pressed={type === 'INCOME'}
                onClick={() => setType('INCOME')}
              >
                ↗ {t('transaction.income')}
              </button>
              <button
                className={
                  type === 'EXPENSE' ? 'type-toggle__button is-expense' : 'type-toggle__button'
                }
                type="button"
                aria-pressed={type === 'EXPENSE'}
                onClick={() => setType('EXPENSE')}
              >
                ↘ {t('transaction.expense')}
              </button>
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="edit-amount">{t('common.amount')}</label>
            <MoneyInput id="edit-amount" name="amount" defaultValue={transaction.amount} required />
          </div>
          <div className="field">
            <label htmlFor="edit-categoryId">{t('transaction.category')}</label>
            <select
              id="edit-categoryId"
              key={type}
              name="categoryId"
              defaultValue={type === transaction.type ? (transaction.categoryId ?? '') : ''}
            >
              <option value="">{t('common.uncategorized')}</option>
              {matchingCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-paymentMethodId">{t('transaction.optionalMethod')}</label>
            <select
              id="edit-paymentMethodId"
              name="paymentMethodId"
              defaultValue={transaction.paymentMethodId ?? ''}
            >
              <option value="">{t('common.notSelected')}</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-occurredOn">{t('common.date')}</label>
            <input
              id="edit-occurredOn"
              name="occurredOn"
              type="date"
              defaultValue={transaction.occurredOn}
              required
            />
          </div>
          <div className="field full">
            <label htmlFor="edit-note">{t('common.note')}</label>
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
            {t('common.cancel')}
          </Link>
          <SubmitButton pendingText={t('transaction.updating')}>
            {t('transaction.saveChanges')}
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}
