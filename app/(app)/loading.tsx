import { getTranslations } from '@/i18n/server';

export default async function PrivateLoading() {
  const { t } = await getTranslations();

  return (
    <div className="loading-page" aria-busy="true" aria-label={t('common.loading')}>
      <div className="loading-page__heading skeleton" />
      <div className="loading-page__subheading skeleton" />
      <div className="loading-page__cards">
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton" />
        <span className="skeleton" />
      </div>
      <div className="loading-page__content skeleton" />
    </div>
  );
}
