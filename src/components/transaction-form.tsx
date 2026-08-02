'use client';

import { useMemo, useState } from 'react';
import { createTransactionAction } from '@/actions/finance';
import { SubmitButton } from '@/components/submit-button';
import { TransactionAmountFields } from '@/components/transaction-amount-fields';
import { useLocale } from '@/i18n/locale-provider';

type TransactionType = 'INCOME' | 'EXPENSE';

type TransactionFormProps = {
  categories: Array<{ id: string; name: string; type: TransactionType }>;
  methods: Array<{ id: string; name: string }>;
  open: boolean;
  today: string;
  month: string;
};

export function TransactionForm({ categories, methods, open, today, month }: TransactionFormProps) {
  const { t } = useLocale();
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountExpression, setAmountExpression] = useState('');
  const [tipExpression, setTipExpression] = useState('');
  const matchingCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  return (
    <details className="form-reveal" open={open}>
      <summary>＋ {t('transaction.record')}</summary>
      <form action={createTransactionAction} className="form-card">
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
          <TransactionAmountFields
            amountExpression={amountExpression}
            onAmountExpressionChange={setAmountExpression}
            tipExpression={tipExpression}
            onTipExpressionChange={setTipExpression}
          />
          <div className="field">
            <label htmlFor="categoryId">{t('transaction.category')}</label>
            <select id="categoryId" name="categoryId" defaultValue="">
              <option value="">{t('common.uncategorized')}</option>
              {matchingCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="paymentMethodId">{t('transaction.optionalMethod')}</label>
            <select id="paymentMethodId" name="paymentMethodId" defaultValue="">
              <option value="">{t('common.notSelected')}</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="occurredOn">{t('common.date')}</label>
            <input id="occurredOn" name="occurredOn" type="date" defaultValue={today} required />
          </div>
          <div className="field full">
            <label htmlFor="note">{t('common.note')}</label>
            <input
              id="note"
              name="note"
              maxLength={300}
              placeholder={t('transaction.noteExample')}
            />
          </div>
        </div>
        <div className="form-actions">
          <SubmitButton>{t('transaction.record')}</SubmitButton>
        </div>
      </form>
    </details>
  );
}
