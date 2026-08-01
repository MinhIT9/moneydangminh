import type { Metadata } from 'next';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LocaleProvider } from '@/i18n/locale-provider';
import { supportCopy } from '@/i18n/legal-copy';
import { getTranslations } from '@/i18n/server';

const supportEmail = process.env.SUPPORT_EMAIL;

export const metadata: Metadata = {
  title: 'Hỗ trợ | Ví Smart',
  description:
    'Cần hỗ trợ khi dùng Ví Smart? Xem các hướng dẫn cơ bản hoặc gửi câu hỏi cho đội ngũ hỗ trợ.',
  alternates: {
    canonical: '/support',
  },
  openGraph: {
    title: 'Hỗ trợ | Ví Smart',
    description: 'Hướng dẫn và kênh hỗ trợ cho người dùng Ví Smart.',
    url: '/support',
  },
};

export default async function SupportPage() {
  const { locale, t } = await getTranslations();
  const copy = supportCopy[locale];

  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <main className="support-page">
        <style>{supportStyles}</style>
        <header className="support-page__header">
          <Link className="support-page__brand" href="/">
            <span aria-hidden="true">V</span>
            {t('brand.name')}
          </Link>
          <div className="support-page__header-actions">
            <LanguageSwitcher compact />
            <Link className="support-page__back" href="/">
              {copy.home}
            </Link>
          </div>
        </header>

        <section className="support-page__hero" aria-labelledby="support-title">
          <p>{copy.eyebrow}</p>
          <h1 id="support-title">{copy.title}</h1>
          <span>{copy.description}</span>
        </section>

        <section className="support-page__content" aria-label={copy.contentLabel}>
          <div className="support-page__grid">
            {copy.guides.map((guide, index) => (
              <article key={guide.title}>
                <span className="support-page__icon" aria-hidden="true">
                  {index + 1}
                </span>
                <h2>{guide.title}</h2>
                <p>{guide.description}</p>
              </article>
            ))}
          </div>

          <div className="support-page__contact">
            <div>
              <p>{copy.contactEyebrow}</p>
              <h2>{copy.contactTitle}</h2>
              <span>{copy.contactDescription}</span>
            </div>
            {supportEmail ? (
              <a href={`mailto:${supportEmail}?subject=${encodeURIComponent(copy.contactSubject)}`}>
                {copy.contactAction}
                <small>{supportEmail}</small>
              </a>
            ) : (
              <p className="support-page__email-note">{copy.emailUnavailable}</p>
            )}
          </div>

          <aside className="support-page__privacy-note">
            <strong>{copy.securityTitle}</strong>
            <p>{copy.securityDescription}</p>
            <Link href="/privacy">{copy.privacyAction}</Link>
          </aside>
        </section>
      </main>
    </LocaleProvider>
  );
}

const supportStyles = `
  .support-page { min-height: 100vh; color: #192235; background: linear-gradient(180deg, #f7f6ff 0, #fff 430px); font-family: inherit; line-height: 1.55; }
  .support-page *, .support-page *::before, .support-page *::after { box-sizing: border-box; }
  .support-page a { text-decoration: none; }
  .support-page__header, .support-page__hero, .support-page__content { width: min(980px, calc(100% - 40px)); margin-inline: auto; }
  .support-page__header { min-height: 76px; display: flex; align-items: center; justify-content: space-between; }
  .support-page__header-actions { display: flex; align-items: center; gap: 12px; }
  .support-page__brand { display: inline-flex; align-items: center; gap: 9px; color: #192235; font-size: 17px; font-weight: 850; letter-spacing: -.03em; }
  .support-page__brand span { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, #876eff, #5836df); }
  .support-page__back { color: #667085; font-size: 14px; font-weight: 700; }
  .support-page__hero { max-width: 760px; padding: 73px 0 59px; text-align: center; }
  .support-page__hero > p { margin: 0 0 12px; color: #6545ee; font-size: 12px; font-weight: 850; letter-spacing: .1em; }
  .support-page h1, .support-page h2, .support-page p { margin-top: 0; }
  .support-page h1 { margin-bottom: 15px; font-size: clamp(38px, 6vw, 58px); line-height: 1.06; letter-spacing: -.055em; }
  .support-page__hero > span { display: block; color: #667085; font-size: 17px; }
  .support-page__content { padding-bottom: 80px; }
  .support-page__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 17px; }
  .support-page__grid article { padding: 26px; border: 1px solid #e7e8ee; border-radius: 19px; background: #fff; }
  .support-page__icon { display: inline-grid; place-items: center; width: 35px; height: 35px; margin-bottom: 25px; border-radius: 11px; color: #6545ee; background: #f0edff; font-size: 13px; font-weight: 900; }
  .support-page h2 { margin-bottom: 8px; font-size: 18px; letter-spacing: -.025em; }
  .support-page__grid p { margin-bottom: 0; color: #667085; font-size: 14px; }
  .support-page__contact { display: grid; grid-template-columns: 1.3fr .7fr; gap: 34px; align-items: center; margin-top: 25px; padding: 37px; border-radius: 24px; color: #fff; background: linear-gradient(130deg, #6545e7, #4c2cac); }
  .support-page__contact p { margin-bottom: 9px; color: #d8d0ff; font-size: 11px; font-weight: 850; letter-spacing: .1em; }
  .support-page__contact h2 { margin-bottom: 8px; font-size: 27px; }
  .support-page__contact span { color: #e2dcff; font-size: 14px; }
  .support-page__contact a { display: flex; flex-direction: column; gap: 4px; padding: 15px 18px; border-radius: 14px; color: #4c2cac; background: #fff; font-size: 14px; font-weight: 850; text-align: center; }
  .support-page__contact a small { color: #7b6bba; font-size: 11px; font-weight: 650; overflow-wrap: anywhere; }
  .support-page__email-note { margin: 0; padding: 15px 18px; border: 1px solid rgba(255,255,255,.35); border-radius: 14px; color: #eeeaff; font-size: 13px; text-align: center; }
  .support-page__privacy-note { margin: 25px 0; padding: 21px 24px; border: 1px solid #e7e5f6; border-radius: 17px; background: #fbfaff; }
  .support-page__privacy-note strong { font-size: 14px; } .support-page__privacy-note p { margin: 5px 0 7px; color: #667085; font-size: 13px; } .support-page__privacy-note a { color: #6545ee; font-size: 13px; font-weight: 800; }
  @media (max-width: 720px) { .support-page__grid { grid-template-columns: 1fr; } .support-page__contact { grid-template-columns: 1fr; gap: 23px; } .support-page__hero { padding: 50px 0 42px; } }
  @media (max-width: 460px) { .support-page__header, .support-page__hero, .support-page__content { width: calc(100% - 28px); } .support-page__contact { padding: 27px 22px; border-radius: 19px; } .support-page__contact h2 { font-size: 24px; } }
`;
