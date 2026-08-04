import type { Metadata } from 'next';
import Link from 'next/link';
import { loginAction } from '@/actions/auth';
import { AuthFormField } from '@/components/auth-form-field';
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
    <div className="hx-auth-panel__inner">
      <div className="hx-auth-panel__heading">
        <p>{t('auth.loginEyebrow')}</p>
        <h2>{t('auth.login')}</h2>
        <span>{t('auth.loginDescription')}</span>
      </div>
      <form action={loginAction} className="hx-auth-form">
        {error ? <p className="notice">{error}</p> : null}
        <AuthFormField
          id="email"
          name="email"
          type="email"
          icon="email"
          label={t('common.email')}
          placeholder={t('auth.emailPlaceholder')}
          autoComplete="email"
          required
          autoFocus
        />
        <AuthFormField
          id="password"
          name="password"
          type="password"
          icon="lock"
          label={t('common.password')}
          placeholder={t('auth.passwordPlaceholder')}
          autoComplete="current-password"
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
          required
        />
        <div className="hx-auth-form__help">
          <span>{t('auth.secureLoginNote')}</span>
          <Link href="/support" prefetch>
            {t('auth.needHelp')}
          </Link>
        </div>
        <SubmitButton className="hx-auth-submit" pendingText={t('auth.loggingIn')}>
          {t('auth.login')}
        </SubmitButton>
      </form>
      <div className="hx-auth-divider">
        <span>{t('auth.or')}</span>
      </div>
      <p className="hx-auth-switch">
        {t('auth.noAccount')}{' '}
        <Link href="/register" prefetch>
          {t('auth.register')}
        </Link>
      </p>
    </div>
  );
}
