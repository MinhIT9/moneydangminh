import type { Metadata } from 'next';
import Link from 'next/link';
import { registerAction } from '@/actions/auth';
import { AuthFormField } from '@/components/auth-form-field';
import { SubmitButton } from '@/components/submit-button';
import { isRegistrationOpen } from '@/lib/app-settings';
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
  const registrationOpen = await isRegistrationOpen();

  if (!registrationOpen) {
    return (
      <div className="hx-auth-panel__inner hx-auth-panel__inner--closed">
        <span className="hx-auth-closed-icon" aria-hidden="true">
          🔒
        </span>
        <h2>{t('auth.registrationClosed')}</h2>
        <p>{t('auth.registrationClosedDescription')}</p>
        <Link className="hx-auth-submit" href="/login" prefetch>
          {t('auth.goToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="hx-auth-panel__inner hx-auth-panel__inner--register">
      <div className="hx-auth-panel__heading">
        <p>{t('auth.registerEyebrow')}</p>
        <h2>{t('auth.createLedger')}</h2>
        <span>{t('auth.createLedgerDescription')}</span>
      </div>
      <form action={registerAction} className="hx-auth-form hx-auth-form--register">
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
          id="phone"
          name="phone"
          type="tel"
          icon="phone"
          label={t('auth.phone')}
          inputMode="tel"
          autoComplete="tel"
          placeholder={t('auth.phoneExample')}
          pattern="0[35789][0-9]{8}"
          maxLength={10}
          required
        />
        <AuthFormField
          id="password"
          name="password"
          type="password"
          icon="lock"
          label={t('common.password')}
          placeholder={t('auth.newPasswordPlaceholder')}
          autoComplete="new-password"
          minLength={8}
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
          required
        />
        <AuthFormField
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          icon="lock"
          label={t('auth.confirmPassword')}
          placeholder={t('auth.confirmPasswordPlaceholder')}
          autoComplete="new-password"
          minLength={8}
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
          required
        />
        <p className="hx-auth-password-note">{t('auth.passwordRule')}</p>
        <SubmitButton className="hx-auth-submit" pendingText={t('auth.creatingAccount')}>
          {t('auth.createAccount')}
        </SubmitButton>
      </form>
      <div className="hx-auth-divider">
        <span>{t('auth.or')}</span>
      </div>
      <p className="hx-auth-switch">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" prefetch>
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
