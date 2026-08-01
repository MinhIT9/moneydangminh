import Link from 'next/link';
import type { Metadata } from 'next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LocaleProvider } from '@/i18n/locale-provider';
import { getTranslations } from '@/i18n/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getTranslations();

  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <main className="auth-page">
        <section className="auth-card">
          <Link className="brand" href="/">
            <span className="brand-mark">V</span>
            {t('brand.name')}
          </Link>
          <LanguageSwitcher className="auth-language" />
          {children}
        </section>
      </main>
    </LocaleProvider>
  );
}
