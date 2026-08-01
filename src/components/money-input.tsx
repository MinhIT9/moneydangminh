'use client';

import { useState } from 'react';
import { useLocale } from '@/i18n/locale-provider';

type MoneyInputProps = {
  id?: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

function normalize(value: string | number | undefined) {
  return String(value ?? '')
    .replace(/[^0-9]/g, '')
    .replace(/^0+(?=\d)/, '');
}

function display(value: string, locale: string) {
  return value ? new Intl.NumberFormat(locale).format(Number(value)) : '';
}

export function MoneyInput({
  id,
  name,
  defaultValue,
  placeholder,
  required = false,
  className,
}: MoneyInputProps) {
  const { locale, t } = useLocale();
  const [value, setValue] = useState(() => normalize(defaultValue));

  return (
    <span className={`money-input${className ? ` ${className}` : ''}`}>
      <input
        id={id}
        name={name}
        value={display(value, locale === 'vi' ? 'vi-VN' : 'en-US')}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder ?? t('money.example')}
        required={required}
        onChange={(event) => setValue(normalize(event.target.value))}
      />
      <span aria-hidden="true">đ</span>
    </span>
  );
}
