import type { Metadata } from 'next';
import Link from 'next/link';
import { registerAction } from '@/actions/auth';
import { SubmitButton } from '@/components/submit-button';
import { db } from '@/lib/db';
import { getTranslations } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Đăng ký',
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getTranslations();
  const registrationSetting = await db.appSetting.findUnique({
    where: { key: 'registration_open' },
  });
  const registrationOpen = registrationSetting?.value !== 'false';

  if (!registrationOpen) {
    return (
      <>
        <h1>{t('auth.registrationClosed')}</h1>
        <p className="muted">{t('auth.registrationClosedDescription')}</p>
        <Link className="button" href="/login">
          {t('auth.goToLogin')}
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>{t('auth.createLedger')}</h1>
      <p className="muted">{t('auth.createLedgerDescription')}</p>
      <form action={registerAction} className="stack">
        {error ? <p className="notice">{error}</p> : null}
        <div className="field">
          <label htmlFor="email">{t('common.email')}</label>
          <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="phone">{t('auth.phone')}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('auth.phoneExample')}
            pattern="0[35789][0-9]{8}"
            maxLength={10}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t('common.password')}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="passwordConfirmation">{t('auth.confirmPassword')}</label>
          <input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <SubmitButton pendingText={t('auth.creatingAccount')}>
          {t('auth.createAccount')}
        </SubmitButton>
      </form>
      <p className="auth-footer">
        {t('auth.haveAccount')} <Link href="/login">{t('auth.login')}</Link>
      </p>
    </>
  );
}
