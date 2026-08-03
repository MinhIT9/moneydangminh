'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { MonthSelect } from '@/components/month-select';
import { useLocale } from '@/i18n/locale-provider';

export function DashboardMonthFilter({
  value,
  activeMonths,
  route = '/dashboard',
  id = 'dashboard-month',
}: {
  value: string;
  activeMonths?: string[];
  route?: string;
  id?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateMonth(month: string) {
    startTransition(() => {
      router.replace(`${route}?month=${encodeURIComponent(month)}`, { scroll: false });
    });
  }

  return (
    <div aria-busy={isPending}>
      <label className="sr-only" htmlFor={id}>
        {t('month.select')}
      </label>
      <MonthSelect
        key={value}
        id={id}
        value={value}
        activeMonths={activeMonths}
        disabled={isPending}
        onValueChange={updateMonth}
      />
      <span className="sr-only" role="status">
        {isPending ? t('common.loading') : ''}
      </span>
    </div>
  );
}
