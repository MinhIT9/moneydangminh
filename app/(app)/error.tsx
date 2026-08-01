'use client';

import { useLocale } from '@/i18n/locale-provider';

export default function PrivateError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  return (
    <section className="error-card" role="alert">
      <span className="badge danger">{t('error.temporary')}</span>
      <h1>{t('error.dataLoad')}</h1>
      <p>{t('error.dataLoadDescription')}</p>
      <button className="button" type="button" onClick={reset}>
        {t('error.tryAgain')}
      </button>
    </section>
  );
}
