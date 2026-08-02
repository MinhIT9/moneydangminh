'use client';

import { useMemo } from 'react';
import {
  calculateMoneyExpression,
  formatExpressionTotal,
  MoneyExpressionInput,
  type MoneyExpressionCalculation,
} from '@/components/money-expression-input';
import { useLocale } from '@/i18n/locale-provider';

type TransactionAmountFieldsProps = {
  amountExpression: string;
  onAmountExpressionChange: (value: string) => void;
  tipExpression: string;
  onTipExpressionChange: (value: string) => void;
  idPrefix?: string;
};

function CalculatedAmount({
  label,
  calculation,
  emptyAsZero = false,
}: {
  label: string;
  calculation: MoneyExpressionCalculation;
  emptyAsZero?: boolean;
}) {
  const { locale, t } = useLocale();
  const content = !calculation.isValid
    ? t('transaction.expressionInvalid')
    : calculation.isEmpty && !emptyAsZero
      ? t('transaction.expressionEmpty')
      : formatExpressionTotal(calculation.total ?? 0, locale);

  return (
    <div
      className={`calculated-money${!calculation.isValid ? ' is-invalid' : ''}${
        calculation.isEmpty ? ' is-empty' : ''
      }`}
    >
      <output
        aria-label={label}
        aria-live="polite"
        aria-atomic="true"
        className="calculated-money__value"
      >
        {content}
      </output>
    </div>
  );
}

/**
 * Shared transaction amount area. The entered expressions are submitted as-is;
 * totals are only a live client-side preview.
 */
export function TransactionAmountFields({
  amountExpression,
  onAmountExpressionChange,
  tipExpression,
  onTipExpressionChange,
  idPrefix = '',
}: TransactionAmountFieldsProps) {
  const { locale, t } = useLocale();
  const amountCalculation = useMemo(
    () => calculateMoneyExpression(amountExpression),
    [amountExpression],
  );
  const tipCalculation = useMemo(() => calculateMoneyExpression(tipExpression), [tipExpression]);
  const totalIsValid = amountCalculation.isValid && tipCalculation.isValid;
  const recordedTotal = totalIsValid
    ? (amountCalculation.total ?? 0) + (tipCalculation.total ?? 0)
    : null;
  const amountId = `${idPrefix}amountExpression`;
  const tipId = `${idPrefix}tipExpression`;

  return (
    <>
      <div className="field">
        <label htmlFor={amountId}>{t('common.amount')}</label>
        <MoneyExpressionInput
          id={amountId}
          name="amountExpression"
          value={amountExpression}
          onValueChange={onAmountExpressionChange}
          placeholder={t('money.example')}
          describedBy={`${amountId}-hint`}
          required
        />
        <p className="expression-input__hint" id={`${amountId}-hint`}>
          {t('transaction.amountExpressionHint')}
        </p>
      </div>
      <div className="field">
        <span className="field-label">{t('transaction.calculatedAmount')}</span>
        <CalculatedAmount
          label={t('transaction.calculatedAmount')}
          calculation={amountCalculation}
        />
      </div>

      <div className="field">
        <label htmlFor={tipId}>{t('transaction.tip')}</label>
        <MoneyExpressionInput
          id={tipId}
          name="tipExpression"
          value={tipExpression}
          onValueChange={onTipExpressionChange}
          placeholder={t('transaction.tipExpressionHint')}
          describedBy={`${tipId}-hint`}
        />
        <p className="expression-input__hint" id={`${tipId}-hint`}>
          {t('transaction.tipExpressionHint')}
        </p>
      </div>
      <div className="field">
        <span className="field-label">{t('transaction.calculatedTip')}</span>
        <CalculatedAmount
          label={t('transaction.calculatedTip')}
          calculation={tipCalculation}
          emptyAsZero
        />
      </div>
      <div
        className={`transaction-recorded-total full${!totalIsValid ? ' is-invalid' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span>{t('transaction.recordedTotal')}</span>
        <strong>{formatExpressionTotal(recordedTotal, locale)}</strong>
      </div>
    </>
  );
}
