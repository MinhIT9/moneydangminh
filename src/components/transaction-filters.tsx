'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition, type FormEvent } from 'react';
import { MonthSelect } from '@/components/month-select';
import { useLocale } from '@/i18n/locale-provider';

type TransactionFiltersProps = {
  month: string;
  query: string;
  type?: 'INCOME' | 'EXPENSE';
};

export function TransactionFilters({ month, query, type }: TransactionFiltersProps) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get('q') ?? '').trim();
    const nextMonth = String(formData.get('month') ?? month);
    const nextType = String(formData.get('type') ?? '');
    const params = new URLSearchParams({ month: nextMonth });

    if (nextQuery) params.set('q', nextQuery);
    if (nextType === 'INCOME' || nextType === 'EXPENSE') params.set('type', nextType);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <form className="filter-bar" onSubmit={applyFilters} aria-busy={isPending}>
      <input
        className="filter-input"
        name="q"
        defaultValue={query}
        placeholder={t('transaction.searchNotes')}
      />
      <MonthSelect value={month} disabled={isPending} />
      <select className="filter-input" name="type" defaultValue={type ?? ''} disabled={isPending}>
        <option value="">{t('transaction.allTypes')}</option>
        <option value="INCOME">{t('transaction.income')}</option>
        <option value="EXPENSE">{t('transaction.expense')}</option>
      </select>
      <button className="button-ghost" type="submit" disabled={isPending}>
        {isPending ? t('transaction.filtering') : t('transaction.filter')}
      </button>
      <span className="sr-only" role="status">
        {isPending ? t('transaction.updatingList') : ''}
      </span>
    </form>
  );
}
