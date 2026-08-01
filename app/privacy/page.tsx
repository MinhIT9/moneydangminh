import type { Metadata } from 'next';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LocaleProvider } from '@/i18n/locale-provider';
import { privacyCopy } from '@/i18n/legal-copy';
import { getTranslations } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Chính sách riêng tư | Ví Smart',
  description:
    'Tìm hiểu cách Ví Smart thu thập, sử dụng và bảo vệ dữ liệu tài chính cá nhân của bạn.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Chính sách riêng tư | Ví Smart',
    description: 'Thông tin về việc thu thập, sử dụng và bảo vệ dữ liệu cá nhân tại Ví Smart.',
    url: '/privacy',
  },
};

export default async function PrivacyPage() {
  const { locale, t } = await getTranslations();
  const copy = privacyCopy[locale];
  const contactSection = copy.sections.at(-1);

  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <main className="legal-page">
        <style>{legalStyles}</style>
        <header className="legal-page__header">
          <Link className="legal-page__brand" href="/">
            <span aria-hidden="true">V</span>
            {t('brand.name')}
          </Link>
          <div className="legal-page__header-actions">
            <LanguageSwitcher compact />
            <Link className="legal-page__back" href="/">
              {copy.home}
            </Link>
          </div>
        </header>

        <article className="legal-page__content">
          <p className="legal-page__eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="legal-page__updated">{copy.updated}</p>
          <p className="legal-page__intro">{copy.intro}</p>

          {copy.sections.slice(0, -1).map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          {contactSection ? (
            <section>
              <h2>{contactSection.title}</h2>
              <p>
                {contactSection.paragraphs[0]} <Link href="/support">{copy.supportLink}</Link>{' '}
                {copy.supportSuffix}
              </p>
            </section>
          ) : null}
        </article>
      </main>
    </LocaleProvider>
  );
}

const legalStyles = `
  .legal-page { min-height: 100vh; color: #1b2333; background: #fcfcff; font-family: inherit; line-height: 1.65; }
  .legal-page *, .legal-page *::before, .legal-page *::after { box-sizing: border-box; }
  .legal-page a { color: #5a3be0; text-decoration: none; font-weight: 750; }
  .legal-page a:hover { text-decoration: underline; }
  .legal-page__header { width: min(900px, calc(100% - 40px)); min-height: 76px; margin: auto; display: flex; align-items: center; justify-content: space-between; }
  .legal-page__header-actions { display: flex; align-items: center; gap: 12px; }
  .legal-page__brand { display: inline-flex; align-items: center; gap: 9px; color: #1b2333 !important; font-size: 17px; font-weight: 850 !important; letter-spacing: -.03em; }
  .legal-page__brand span { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, #876eff, #5836df); }
  .legal-page__back { color: #667085 !important; font-size: 14px; }
  .legal-page__content { width: min(760px, calc(100% - 40px)); margin: 36px auto 80px; padding: clamp(28px, 6vw, 58px); border: 1px solid #e8e9ef; border-radius: 24px; background: #fff; box-shadow: 0 18px 50px rgba(39, 31, 75, .06); }
  .legal-page__eyebrow { margin: 0 0 10px; color: #6545ee; font-size: 12px; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; }
  .legal-page h1 { margin: 0; font-size: clamp(34px, 6vw, 50px); line-height: 1.12; letter-spacing: -.05em; }
  .legal-page__updated { margin: 11px 0 27px; color: #7b8496; font-size: 13px; }
  .legal-page__intro { margin-bottom: 36px; color: #4f596b; font-size: 17px; }
  .legal-page section { margin-top: 31px; }
  .legal-page h2 { margin: 0 0 10px; font-size: 19px; letter-spacing: -.02em; }
  .legal-page p { margin: 0 0 12px; color: #4f596b; font-size: 15px; }
  .legal-page ul { margin: 0; padding-left: 22px; color: #4f596b; }
  .legal-page li { margin: 7px 0; font-size: 15px; }
  @media (max-width: 500px) { .legal-page__header, .legal-page__content { width: calc(100% - 28px); } .legal-page__content { margin-top: 20px; padding: 26px 21px; border-radius: 18px; } }
`;
