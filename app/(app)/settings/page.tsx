import { changePasswordAction } from '@/actions/auth';
import { updateProfileAction } from '@/actions/finance';
import { SubmitButton } from '@/components/submit-button';
import { requireUser } from '@/lib/auth';
import { getTranslations } from '@/i18n/server';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { t } = await getTranslations();
  const { error } = await searchParams;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t('settings.title')}</h1>
          <p className="muted">{t('settings.description')}</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <section className="section-grid">
        <form action={updateProfileAction} className="form-card">
          <h2>{t('settings.personal')}</h2>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="displayName">{t('settings.displayName')}</label>
              <input
                id="displayName"
                name="displayName"
                defaultValue={user.displayName}
                maxLength={100}
                required
              />
            </div>
            <div className="field">
              <label>{t('common.email')}</label>
              <input value={user.email} readOnly aria-readonly="true" />
            </div>
            <div className="field">
              <label>{t('auth.phone')}</label>
              <input value={user.phone} readOnly aria-readonly="true" />
            </div>
          </div>
          <div className="form-actions">
            <SubmitButton>{t('transaction.saveChanges')}</SubmitButton>
          </div>
        </form>

        <form action={changePasswordAction} className="form-card">
          <h2>{t('settings.changePassword')}</h2>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="currentPassword">{t('settings.currentPassword')}</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="newPassword">{t('settings.newPassword')}</label>
              <input
                id="newPassword"
                name="newPassword"
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
          </div>
          <div className="form-actions">
            <SubmitButton pendingText={t('settings.changingPassword')}>
              {t('settings.changePassword')}
            </SubmitButton>
          </div>
        </form>
      </section>
    </>
  );
}
