'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { monthInputValue } from '@/lib/date';
import { useLocale } from '@/i18n/locale-provider';

type MonthSelectProps = {
  name?: string;
  value: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  activeMonths?: string[];
  onValueChange?: (value: string) => void;
};

type MonthParts = {
  year: number;
  month: number;
};

const firstSupportedYear = 2000;

function toMonthValue({ year, month }: MonthParts) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function parseMonthValue(value: string, fallback: MonthParts): MonthParts {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);

  if (!match) return fallback;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function isFutureMonth(month: MonthParts, currentMonth: MonthParts) {
  return (
    month.year > currentMonth.year ||
    (month.year === currentMonth.year && month.month > currentMonth.month)
  );
}

function formatMonthYear(locale: 'vi' | 'en', month: MonthParts) {
  if (locale === 'vi') return `Tháng ${month.month} năm ${month.year}`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(month.year, month.month - 1, 1));
}

function formatMonthName(locale: 'vi' | 'en', month: number) {
  if (locale === 'vi') return `Tháng ${month}`;

  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2026, month - 1, 1));
}

export function MonthSelect({
  name = 'month',
  value,
  id = 'month',
  className = 'filter-input',
  disabled = false,
  activeMonths = [],
  onValueChange,
}: MonthSelectProps) {
  const { locale, t } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const currentMonth = parseMonthValue(monthInputValue(), {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [uncontrolledValue, setUncontrolledValue] = useState(value);
  const selectedMonth = parseMonthValue(onValueChange ? value : uncontrolledValue, currentMonth);
  const safeSelectedMonth = isFutureMonth(selectedMonth, currentMonth)
    ? currentMonth
    : selectedMonth;
  const [displayYear, setDisplayYear] = useState(safeSelectedMonth.year);
  const [isOpen, setIsOpen] = useState(false);
  const activeMonthSet = new Set(activeMonths);
  const pickerLabel = locale === 'vi' ? 'Chọn tháng và năm' : 'Choose month and year';
  const previousYearLabel = locale === 'vi' ? 'Năm trước' : 'Previous year';
  const nextYearLabel = locale === 'vi' ? 'Năm sau' : 'Next year';
  const thisMonthLabel = locale === 'vi' ? 'Tháng này' : 'This month';

  useEffect(() => {
    if (!isOpen) return;

    function closeWhenClickingAway(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('pointerdown', closeWhenClickingAway);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingAway);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  function togglePopover() {
    if (disabled) return;

    if (!isOpen) setDisplayYear(safeSelectedMonth.year);
    setIsOpen((open) => !open);
  }

  function selectMonth(nextMonth: MonthParts) {
    const nextValue = toMonthValue(nextMonth);

    if (onValueChange) {
      onValueChange(nextValue);
    } else {
      setUncontrolledValue(nextValue);
    }

    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  const selectedValue = toMonthValue(safeSelectedMonth);

  return (
    <div className="month-select" ref={rootRef}>
      <input disabled={disabled} name={name} type="hidden" value={selectedValue} />
      <button
        aria-controls={popoverId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`${t('month.select')}: ${formatMonthYear(locale, safeSelectedMonth)}`}
        className={`month-select__trigger ${className}`}
        disabled={disabled}
        id={id}
        onClick={togglePopover}
        ref={triggerRef}
        type="button"
      >
        <span>{formatMonthYear(locale, safeSelectedMonth)}</span>
        <svg aria-hidden="true" className="month-select__chevron" viewBox="0 0 16 16">
          <path
            d="m4 6 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          aria-label={pickerLabel}
          className="month-select__popover"
          id={popoverId}
          role="dialog"
        >
          <div className="month-select__header">
            <button
              aria-label={previousYearLabel}
              className="month-select__year-button"
              disabled={displayYear <= firstSupportedYear}
              onClick={() => setDisplayYear((year) => year - 1)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path
                  d="m9.5 3-5 5 5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
            <strong aria-live="polite">{displayYear}</strong>
            <button
              aria-label={nextYearLabel}
              className="month-select__year-button"
              disabled={displayYear >= currentMonth.year}
              onClick={() => setDisplayYear((year) => year + 1)}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path
                  d="m6.5 3 5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>

          <div className="month-select__grid">
            {Array.from({ length: 12 }, (_, index) => {
              const month = index + 1;
              const candidate = { year: displayYear, month };
              const candidateValue = toMonthValue(candidate);
              const isSelected = candidateValue === selectedValue;
              const isActive = activeMonthSet.has(candidateValue);
              const isFuture = isFutureMonth(candidate, currentMonth);

              return (
                <button
                  aria-pressed={isSelected}
                  className={`month-select__month${isSelected ? ' month-select__month--selected' : ''}${
                    isActive ? ' month-select__month--active' : ''
                  }`}
                  disabled={isFuture}
                  key={candidateValue}
                  onClick={() => selectMonth(candidate)}
                  type="button"
                >
                  {formatMonthName(locale, month)}
                </button>
              );
            })}
          </div>

          <div className="month-select__footer">
            <button
              className="month-select__today"
              onClick={() => selectMonth(currentMonth)}
              type="button"
            >
              {thisMonthLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
