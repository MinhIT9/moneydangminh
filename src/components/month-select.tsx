'use client';

import { useLocale } from '@/i18n/locale-provider';

type MonthSelectProps = {
  name?: string;
  value: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
};

export function MonthSelect({
  name = 'month',
  value,
  id = 'month',
  className = 'filter-input',
  disabled = false,
  onValueChange,
}: MonthSelectProps) {
  const { locale, t } = useLocale();
  const [yearText] = value.split('-');
  const selectedYear = Number(yearText) || new Date().getFullYear();
  const options = [];

  for (let year = selectedYear - 3; year <= selectedYear + 3; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const optionValue = `${year}-${String(month).padStart(2, '0')}`;
      options.push(
        <option key={optionValue} value={optionValue}>
          {t('month.label', {
            month: new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
              month: 'long',
            }).format(new Date(year, month - 1, 1)),
            year,
          })}
        </option>,
      );
    }
  }

  return (
    <select
      id={id}
      className={className}
      name={name}
      defaultValue={value}
      aria-label={t('month.select')}
      disabled={disabled}
      onChange={onValueChange ? (event) => onValueChange(event.currentTarget.value) : undefined}
    >
      {options}
    </select>
  );
}
