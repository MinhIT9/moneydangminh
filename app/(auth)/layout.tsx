import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LocaleProvider } from '@/i18n/locale-provider';
import { getTranslations } from '@/i18n/server';
import './auth.css';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getTranslations();

  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <main className="hx-auth-page">
        <header className="hx-auth-header">
          <Link className="hx-auth-brand" href="/" prefetch>
            <span className="hx-auth-brand__mark" aria-hidden="true">
              <span>••</span>
            </span>
            <span>
              <strong>{t('brand.name')}</strong>
              <small>{t('brand.slogan')}</small>
            </span>
          </Link>

          <div className="hx-auth-header__actions">
            <LanguageSwitcher className="hx-auth-language" compact />
            <Link className="hx-auth-support" href="/support" prefetch>
              <span aria-hidden="true">?</span>
              {t('auth.supportCenter')}
            </Link>
          </div>
        </header>

        <div className="hx-auth-main">
          <aside className="hx-auth-story">
            <div className="hx-auth-story__copy">
              <p className="hx-auth-story__eyebrow">{t('auth.storyEyebrow')}</p>
              <h1>
                {t('auth.storyTitle')} <strong>{t('auth.storyHighlight')}</strong>
              </h1>
              <p>{t('auth.storyDescription')}</p>
            </div>

            <div className="hx-auth-mascot">
              <span className="hx-auth-mascot__glow" aria-hidden="true" />
              <Image
                src="/images/heo-xinh-auth-mascot.png"
                alt={t('auth.mascotAlt')}
                width={1254}
                height={1254}
                priority
                sizes="(max-width: 820px) 230px, 430px"
              />
            </div>

            <div className="hx-auth-benefits" aria-label={t('auth.benefitsLabel')}>
              <article>
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>{t('auth.secureTitle')}</strong>
                  <small>{t('auth.secureDescription')}</small>
                </div>
              </article>
              <article>
                <span aria-hidden="true">⚡</span>
                <div>
                  <strong>{t('auth.easyTitle')}</strong>
                  <small>{t('auth.easyDescription')}</small>
                </div>
              </article>
              <article>
                <span aria-hidden="true">●</span>
                <div>
                  <strong>{t('auth.privateTitle')}</strong>
                  <small>{t('auth.privateDescription')}</small>
                </div>
              </article>
            </div>
          </aside>

          <section className="hx-auth-panel">{children}</section>
        </div>

        <footer className="hx-auth-footer">
          <div>
            <strong>{t('brand.name')}</strong>
            <span>{t('auth.copyright')}</span>
          </div>
          <nav aria-label={t('auth.footerNavigation')}>
            <Link href="/">{t('auth.home')}</Link>
            <Link href="/privacy">{t('auth.privacy')}</Link>
            <Link href="/support">{t('auth.support')}</Link>
          </nav>
        </footer>
      </main>
    </LocaleProvider>
  );
}
