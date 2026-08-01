import type { Metadata } from 'next';
import Link from 'next/link';
import { loginAction } from '@/actions/auth';
import { SubmitButton } from '@/components/submit-button';
import { getTranslations } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getTranslations();

  return (
    <>
      <h1>{t('auth.welcomeBack')}</h1>
      <p className="muted">{t('auth.loginDescription')}</p>
      <form action={loginAction} className="stack">
        {error ? <p className="notice">{error}</p> : null}
        <div className="field">
          <label htmlFor="email">{t('common.email')}</label>
          <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">{t('common.password')}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton pendingText={t('auth.loggingIn')}>{t('auth.login')}</SubmitButton>
      </form>
      <p className="auth-footer">
        {t('auth.noAccount')} <Link href="/register">{t('auth.register')}</Link>
      </p>
    </>
  );
}
