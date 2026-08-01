'use client';

import { useState } from 'react';

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

function display(value: string) {
  return value ? new Intl.NumberFormat('vi-VN').format(Number(value)) : '';
}

export function MoneyInput({
  id,
  name,
  defaultValue,
  placeholder = 'Ví dụ: 200.000',
  required = false,
  className,
}: MoneyInputProps) {
  const [value, setValue] = useState(() => normalize(defaultValue));

  return (
    <span className={`money-input${className ? ` ${className}` : ''}`}>
      <input
        id={id}
        name={name}
        value={display(value)}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        onChange={(event) => setValue(normalize(event.target.value))}
      />
      <span aria-hidden="true">đ</span>
    </span>
  );
}
