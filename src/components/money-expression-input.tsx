'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useLocale } from '@/i18n/locale-provider';

const MAX_VND_AMOUNT = 999_999_999_999_999;
const amountTermPattern = /^\d(?:[\d.,\s]*\d)?$/;

export type MoneyExpressionCalculation = {
  total: number | null;
  isEmpty: boolean;
  isValid: boolean;
};

function allowedExpression(value: string) {
  return value.replace(/[^0-9+.,\s]/g, '');
}

/**
 * Evaluates a simple VND addition expression such as `10000 + 20000`.
 * Separators are ignored deliberately so both `50.000` and `50,000` work.
 */
export function calculateMoneyExpression(value: string): MoneyExpressionCalculation {
  const expression = value.trim();

  if (!expression) {
    return { total: null, isEmpty: true, isValid: true };
  }

  const terms = expression.split('+').map((term) => term.trim());
  if (terms.some((term) => !amountTermPattern.test(term))) {
    return { total: null, isEmpty: false, isValid: false };
  }

  const values = terms.map((term) => {
    const digits = term.replace(/[^0-9]/g, '');
    const amount = Number(digits);

    return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_VND_AMOUNT ? amount : null;
  });

  if (values.some((amount) => amount === null)) {
    return { total: null, isEmpty: false, isValid: false };
  }

  const total = values.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  const isValid = Number.isSafeInteger(total) && total > 0 && total <= MAX_VND_AMOUNT;

  return { total: isValid ? total : null, isEmpty: false, isValid };
}

export function formatExpressionTotal(total: number | null, locale: 'vi' | 'en') {
  if (total === null) return '—';

  return `${new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(total)} đ`;
}

type MoneyExpressionInputProps = {
  id: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  describedBy?: string;
};

/**
 * A controlled field that preserves the expression a person typed instead of
 * continuously reformatting it. That keeps backspace and cursor behaviour natural.
 */
export function MoneyExpressionInput({
  id,
  name,
  value,
  onValueChange,
  placeholder,
  required = false,
  describedBy,
}: MoneyExpressionInputProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const calculation = useMemo(() => calculateMoneyExpression(value), [value]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      calculation.isValid ? '' : t('transaction.expressionInvalid'),
    );
  }, [calculation.isValid, t]);

  return (
    <span className="money-expression-input">
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={500}
        placeholder={placeholder}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={!calculation.isValid}
        onChange={(event) => onValueChange(allowedExpression(event.target.value))}
      />
      <span aria-hidden="true">đ</span>
    </span>
  );
}
