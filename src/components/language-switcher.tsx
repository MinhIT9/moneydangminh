'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { localeCookieName, localeOptions, type Locale } from '@/i18n/config';
import { useLocale } from '@/i18n/locale-provider';
import styles from '@/components/language-switcher.module.css';

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { locale, setLocale, t } = useLocale();

  function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;

    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    setLocale(nextLocale);
    startTransition(() => router.refresh());
  }

  return (
    <label
      className={`${styles.switcher}${compact ? ` ${styles.compact}` : ''} language-switcher${className ? ` ${className}` : ''}`}
    >
      <span className="sr-only">{t('language.select')}</span>
      <select
        aria-label={t('language.select')}
        className={styles.select}
        title={t('language.select')}
        value={locale}
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as Locale)}
      >
        {localeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {compact ? option.shortLabel : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
