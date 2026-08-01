import type { Metadata } from 'next';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LandingVisuals } from '@/components/landing-visuals';
import { landingCopy } from '@/i18n/landing-copy';
import { LocaleProvider } from '@/i18n/locale-provider';
import { getTranslations } from '@/i18n/server';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://minhfinance.vn').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Ví Smart | Thu chi rõ ràng, sống nhẹ nhàng',
  description:
    'Ví Smart giúp học sinh, sinh viên, gia đình trẻ và người làm tự do ghi thu chi nhanh, rõ ràng và dễ duy trì mỗi ngày.',
  keywords: [
    'quản lý chi tiêu',
    'ghi thu chi',
    'sổ thu chi cá nhân',
    'quản lý tài chính cá nhân',
    'theo dõi chi tiêu',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Ví Smart',
    title: 'Ví Smart | Thu chi rõ ràng, sống nhẹ nhàng',
    description:
      'Một cuốn sổ thu chi gọn gàng để bạn biết tiền đang đi đâu và chủ động hơn mỗi tháng.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Ví Smart - Thu chi rõ ràng, sống nhẹ nhàng',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ví Smart | Thu chi rõ ràng, sống nhẹ nhàng',
    description: 'Ghi thu chi nhanh, rõ ràng và dễ duy trì cho cuộc sống hằng ngày.',
    images: ['/opengraph-image'],
  },
};

export default async function HomePage() {
  const { locale, t } = await getTranslations();
  const copy = landingCopy[locale];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: t('brand.name'),
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: locale === 'vi' ? 'vi-VN' : 'en',
        url: siteUrl,
        description: copy.hero.description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'VND',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: copy.faq.items.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };
  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <main className="landing">
        <style>{landingStyles}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <header className="landing__header">
          <Link className="landing__brand" href="/" aria-label={copy.homeLabel}>
            <span className="landing__brand-mark" aria-hidden="true">
              V
            </span>
            <span>{t('brand.name')}</span>
          </Link>

          <nav className="landing__nav" aria-label={copy.navigationLabel}>
            <a href="#tinh-nang">{copy.navigation.features}</a>
            <a href="#danh-cho-ban">{copy.navigation.audience}</a>
            <a href="#cau-hoi">{copy.navigation.questions}</a>
          </nav>

          <div className="landing__header-actions">
            <LanguageSwitcher className="landing__language" />
            <Link className="landing__login" href="/login">
              {copy.login}
            </Link>
            <Link className="landing__button landing__button--small" href="/register">
              {copy.startFree}
            </Link>
          </div>
        </header>

        <section className="landing__hero" aria-labelledby="hero-title">
          <div className="landing__hero-copy">
            <p className="landing__eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="hero-title">{copy.hero.title}</h1>
            <p className="landing__lead">{copy.hero.description}</p>
            <div className="landing__hero-actions">
              <Link className="landing__button" href="/register">
                {copy.hero.primaryAction}
                <span aria-hidden="true">→</span>
              </Link>
              <a className="landing__text-link" href="#tinh-nang">
                {copy.hero.secondaryAction}
              </a>
            </div>
            <p className="landing__note">{copy.hero.note}</p>
          </div>

          <div className="landing__preview" aria-label={copy.hero.previewLabel}>
            <div className="landing__preview-top">
              <div>
                <span className="landing__muted">{copy.preview.currentMonth}</span>
                <strong>{copy.preview.currentMonthValue}</strong>
              </div>
              <span className="landing__avatar">V</span>
            </div>
            <div className="landing__balance-card">
              <span>{copy.preview.balance}</span>
              <strong>2.450.000 đ</strong>
              <small>{copy.preview.balanceChange}</small>
            </div>
            <div className="landing__preview-grid">
              <article>
                <span className="landing__dot landing__dot--income" />
                <span>{copy.preview.income}</span>
                <strong>6.800.000 đ</strong>
              </article>
              <article>
                <span className="landing__dot landing__dot--expense" />
                <span>{copy.preview.expense}</span>
                <strong>4.350.000 đ</strong>
              </article>
            </div>
            <div className="landing__recent">
              <span>{copy.preview.recent}</span>
              <div>
                <b>{copy.preview.incomeItem}</b>
                <em>+ 200.000 đ</em>
              </div>
              <div>
                <b>{copy.preview.expenseItem}</b>
                <em className="landing__expense">− 180.000 đ</em>
              </div>
            </div>
          </div>
        </section>

        <section className="landing__section" id="tinh-nang" aria-labelledby="features-title">
          <div className="landing__section-heading">
            <p className="landing__eyebrow">{copy.features.eyebrow}</p>
            <h2 id="features-title">{copy.features.title}</h2>
            <p>{copy.features.description}</p>
          </div>
          <div className="landing__feature-grid">
            <article className="landing__feature-card">
              <span className="landing__feature-icon" aria-hidden="true">
                +
              </span>
              <h3>{copy.features.items[0].title}</h3>
              <p>{copy.features.items[0].description}</p>
            </article>
            <article className="landing__feature-card">
              <span className="landing__feature-icon" aria-hidden="true">
                ↗
              </span>
              <h3>{copy.features.items[1].title}</h3>
              <p>{copy.features.items[1].description}</p>
            </article>
            <article className="landing__feature-card">
              <span className="landing__feature-icon" aria-hidden="true">
                ✓
              </span>
              <h3>{copy.features.items[2].title}</h3>
              <p>{copy.features.items[2].description}</p>
            </article>
          </div>
        </section>

        <section className="landing__audience" id="danh-cho-ban" aria-labelledby="audience-title">
          <div className="landing__section-heading">
            <p className="landing__eyebrow">{copy.audience.eyebrow}</p>
            <h2 id="audience-title">{copy.audience.title}</h2>
          </div>
          <div className="landing__audience-grid">
            <article>
              <span aria-hidden="true">01</span>
              <h3>{copy.audience.items[0].title}</h3>
              <p>{copy.audience.items[0].description}</p>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <h3>{copy.audience.items[1].title}</h3>
              <p>{copy.audience.items[1].description}</p>
            </article>
            <article>
              <span aria-hidden="true">03</span>
              <h3>{copy.audience.items[2].title}</h3>
              <p>{copy.audience.items[2].description}</p>
            </article>
          </div>
        </section>

        <section className="landing__visual-story" aria-labelledby="visual-story-title">
          <div className="landing__visual-story-copy">
            <p className="landing__eyebrow">{copy.visuals.eyebrow}</p>
            <h2 id="visual-story-title">{copy.visuals.title}</h2>
            <p>{copy.visuals.description}</p>
          </div>
          <LandingVisuals
            alts={{
              hero: copy.visuals.heroAlt,
              student: copy.visuals.studentAlt,
              family: copy.visuals.familyAlt,
            }}
          />
        </section>

        <section className="landing__steps" aria-labelledby="steps-title">
          <div className="landing__section-heading">
            <p className="landing__eyebrow">{copy.steps.eyebrow}</p>
            <h2 id="steps-title">{copy.steps.title}</h2>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <h3>{copy.steps.items[0].title}</h3>
                <p>{copy.steps.items[0].description}</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>{copy.steps.items[1].title}</h3>
                <p>{copy.steps.items[1].description}</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>{copy.steps.items[2].title}</h3>
                <p>{copy.steps.items[2].description}</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="landing__faq" id="cau-hoi" aria-labelledby="faq-title">
          <div className="landing__section-heading">
            <p className="landing__eyebrow">{copy.faq.eyebrow}</p>
            <h2 id="faq-title">{copy.faq.title}</h2>
          </div>
          <div className="landing__faq-list">
            {copy.faq.items.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing__cta" aria-labelledby="cta-title">
          <p className="landing__eyebrow">{copy.cta.eyebrow}</p>
          <h2 id="cta-title">{copy.cta.title}</h2>
          <p>{copy.cta.description}</p>
          <Link className="landing__button landing__button--light" href="/register">
            {copy.cta.action}
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        <footer className="landing__footer">
          <Link className="landing__brand" href="/">
            <span className="landing__brand-mark" aria-hidden="true">
              V
            </span>
            <span>{t('brand.name')}</span>
          </Link>
          <p>{copy.footer.description}</p>
          <div>
            <Link href="/privacy">{copy.footer.privacy}</Link>
            <Link href="/support">{copy.footer.support}</Link>
            <Link href="/login">{copy.login}</Link>
          </div>
        </footer>
      </main>
    </LocaleProvider>
  );
}

const landingStyles = `
  .landing {
    --ink: #172033;
    --muted: #667085;
    --line: #e6e8f0;
    --surface: #ffffff;
    --soft: #f7f7ff;
    --violet: #6b4eff;
    --violet-deep: #4d34d9;
    --mint: #16a67a;
    color: var(--ink);
    background: #fff;
    font-family: inherit;
    line-height: 1.55;
  }
  .landing *, .landing *::before, .landing *::after { box-sizing: border-box; }
  .landing a { color: inherit; text-decoration: none; }
  .landing__header, .landing__hero, .landing__section, .landing__audience, .landing__steps, .landing__faq, .landing__footer {
    width: min(1120px, calc(100% - 40px)); margin-inline: auto;
  }
  .landing__header { min-height: 78px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
  .landing__brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: -.03em; font-size: 18px; }
  .landing__brand-mark { width: 34px; height: 34px; display: inline-grid; place-items: center; color: #fff; background: linear-gradient(135deg, #8d74ff, #5a37e8); border-radius: 11px; box-shadow: 0 9px 20px rgba(91, 55, 232, .25); }
  .landing__nav { display: flex; gap: 28px; color: var(--muted); font-size: 14px; font-weight: 650; }
  .landing__nav a:hover, .landing__login:hover, .landing__footer a:hover { color: var(--violet); }
  .landing__header-actions { display: flex; align-items: center; gap: 18px; font-size: 14px; font-weight: 700; }
  .landing__language select { min-height: 36px; padding: 0 28px 0 10px; border: 1px solid #e2e4ee; border-radius: 10px; outline: none; background: #fff; color: var(--muted); font-size: 12px; font-weight: 750; }
  .landing__language select:focus { border-color: #9388fa; box-shadow: 0 0 0 3px rgba(103, 92, 232, .12); }
  .landing__login { color: var(--muted); }
  .landing__button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 49px; padding: 0 22px; border-radius: 14px; color: #fff !important; background: linear-gradient(135deg, #7458ff, #5737e7); box-shadow: 0 14px 26px rgba(90, 55, 232, .24); font-size: 15px; font-weight: 800; transition: transform .2s ease, box-shadow .2s ease; }
  .landing__button:hover { transform: translateY(-2px); box-shadow: 0 18px 30px rgba(90, 55, 232, .31); }
  .landing__button--small { min-height: 39px; padding: 0 15px; border-radius: 11px; font-size: 13px; box-shadow: none; }
  .landing__hero { display: grid; grid-template-columns: 1.02fr .98fr; align-items: center; gap: 70px; padding: 78px 0 105px; }
  .landing__eyebrow { margin: 0 0 13px; color: var(--violet); font-size: 12px; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; }
  .landing h1, .landing h2, .landing h3, .landing p { margin-top: 0; }
  .landing h1 { max-width: 620px; margin-bottom: 20px; font-size: clamp(42px, 6vw, 70px); line-height: 1.04; letter-spacing: -.062em; }
  .landing__lead { max-width: 570px; margin-bottom: 28px; color: var(--muted); font-size: 18px; }
  .landing__hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 20px; }
  .landing__text-link { color: var(--violet) !important; font-size: 14px; font-weight: 800; }
  .landing__note { margin: 20px 0 0; color: #8a91a3; font-size: 13px; }
  .landing__preview { padding: 22px; border: 1px solid rgba(106, 78, 255, .13); border-radius: 27px; background: linear-gradient(145deg, #fbfaff, #f3f1ff); box-shadow: 0 25px 60px rgba(56, 43, 122, .14); transform: rotate(2deg); }
  .landing__preview-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .landing__preview-top strong { display: block; margin-top: 2px; font-size: 14px; }
  .landing__muted { color: #7b849a; font-size: 11px; font-weight: 700; }
  .landing__avatar { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #f3cfab; color: #85542c; font-size: 13px; font-weight: 900; }
  .landing__balance-card { display: flex; flex-direction: column; gap: 5px; padding: 21px; border-radius: 19px; color: #fff; background: linear-gradient(135deg, #7256ff, #4b31c9); }
  .landing__balance-card span { opacity: .78; font-size: 12px; font-weight: 700; }
  .landing__balance-card strong { font-size: 26px; letter-spacing: -.04em; }
  .landing__balance-card small { color: #c9ffec; font-size: 11px; font-weight: 700; }
  .landing__preview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
  .landing__preview-grid article { position: relative; padding: 15px 13px 13px 32px; border: 1px solid #ececf7; border-radius: 15px; background: #fff; }
  .landing__preview-grid span:not(.landing__dot) { display: block; color: #7b849a; font-size: 11px; font-weight: 700; }
  .landing__preview-grid strong { display: block; margin-top: 2px; font-size: 14px; }
  .landing__dot { position: absolute; top: 18px; left: 13px; width: 10px; height: 10px; border-radius: 50%; }
  .landing__dot--income { background: #1cb785; } .landing__dot--expense { background: #f16d79; }
  .landing__recent { margin-top: 14px; padding: 15px; border-radius: 15px; background: #fff; }
  .landing__recent > span { display: block; margin-bottom: 8px; color: #7b849a; font-size: 11px; font-weight: 750; }
  .landing__recent div { display: flex; justify-content: space-between; padding: 7px 0; border-top: 1px solid #f1f2f8; font-size: 12px; }
  .landing__recent b { font-weight: 700; } .landing__recent em { color: #139d73; font-style: normal; font-weight: 800; } .landing__recent .landing__expense { color: #dc5968; }
  .landing__section { padding: 92px 0; }
  .landing__section-heading { max-width: 700px; }
  .landing h2 { margin-bottom: 14px; font-size: clamp(30px, 4vw, 46px); line-height: 1.12; letter-spacing: -.05em; }
  .landing__section-heading > p:last-child { max-width: 640px; color: var(--muted); font-size: 16px; }
  .landing__feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 38px; }
  .landing__feature-card { min-height: 235px; padding: 28px; border: 1px solid var(--line); border-radius: 22px; background: var(--surface); }
  .landing__feature-card:nth-child(2) { border-color: #ddd7ff; background: #faf9ff; }
  .landing__feature-icon { display: inline-grid; place-items: center; width: 38px; height: 38px; margin-bottom: 29px; border-radius: 12px; color: var(--violet); background: #eeeaff; font-size: 21px; font-weight: 900; }
  .landing__feature-card h3, .landing__audience h3, .landing__steps h3 { margin-bottom: 8px; font-size: 18px; letter-spacing: -.025em; }
  .landing__feature-card p, .landing__audience p, .landing__steps p { margin-bottom: 0; color: var(--muted); font-size: 14px; }
  .landing__audience { padding: 90px 0; }
  .landing__audience::before { content: ""; display: block; height: 1px; margin-bottom: 90px; background: var(--line); }
  .landing__audience-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 38px; }
  .landing__audience-grid article { padding: 28px; border-radius: 20px; background: #f7f7fc; }
  .landing__audience-grid span { display: block; margin-bottom: 33px; color: #a49aa7; font-size: 13px; font-weight: 900; letter-spacing: .08em; }
  .landing__visual-story { width: min(1120px, calc(100% - 40px)); display: grid; grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr); align-items: center; gap: clamp(32px, 6vw, 78px); padding: 26px 0 104px; }
  .landing__visual-story-copy { max-width: 440px; }
  .landing__visual-story-copy > p:last-child { margin: 0; color: var(--muted); font-size: 16px; }
  .landing__steps { display: grid; grid-template-columns: .9fr 1.1fr; gap: 60px; align-items: start; padding: 86px 0; }
  .landing__steps ol { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .landing__steps li { display: grid; grid-template-columns: 42px 1fr; gap: 18px; padding: 20px 0; border-bottom: 1px solid var(--line); }
  .landing__steps li:first-child { padding-top: 0; }
  .landing__steps li > span { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; color: var(--violet); background: #efecff; font-size: 13px; font-weight: 900; }
  .landing__faq { padding: 96px 0; }
  .landing__faq-list { max-width: 800px; margin-top: 35px; }
  .landing__faq details { border-bottom: 1px solid var(--line); }
  .landing__faq summary { position: relative; padding: 20px 35px 20px 0; cursor: pointer; list-style: none; font-size: 16px; font-weight: 800; }
  .landing__faq summary::-webkit-details-marker { display: none; }
  .landing__faq summary::after { content: "+"; position: absolute; right: 4px; color: var(--violet); font-size: 22px; font-weight: 400; }
  .landing__faq details[open] summary::after { content: "−"; }
  .landing__faq details p { max-width: 720px; padding: 0 35px 20px 0; color: var(--muted); font-size: 14px; }
  .landing__cta { width: min(1120px, calc(100% - 40px)); margin: 16px auto 75px; padding: clamp(35px, 7vw, 75px); border-radius: 30px; color: #fff; background: radial-gradient(circle at 87% 14%, rgba(183, 169, 255, .55), transparent 30%), linear-gradient(125deg, #5d3de0, #3e239d); }
  .landing__cta .landing__eyebrow { color: #d8d0ff; }
  .landing__cta h2 { max-width: 750px; }
  .landing__cta > p:not(.landing__eyebrow) { max-width: 570px; color: #e3dfff; }
  .landing__button--light { margin-top: 14px; color: #4d31c8 !important; background: #fff; box-shadow: none; }
  .landing__footer { display: grid; grid-template-columns: 1.3fr 1.7fr auto; gap: 25px; align-items: center; padding: 34px 0 44px; border-top: 1px solid var(--line); }
  .landing__footer p { margin: 0; color: var(--muted); font-size: 13px; }
  .landing__footer > div { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 18px; color: var(--muted); font-size: 13px; font-weight: 700; }
  @media (max-width: 800px) {
    .landing__header { min-height: 68px; } .landing__nav, .landing__login { display: none; }
    .landing__header-actions { gap: 0; } .landing__hero { grid-template-columns: 1fr; gap: 42px; padding: 48px 0 72px; }
    .landing__preview { width: min(440px, 94%); justify-self: center; transform: rotate(1deg); }
    .landing__feature-grid, .landing__audience-grid, .landing__visual-story { grid-template-columns: 1fr; }
    .landing__feature-card { min-height: auto; } .landing__feature-icon { margin-bottom: 18px; }
    .landing__visual-story { width: min(1120px, calc(100% - 40px)); gap: 28px; padding: 0 0 76px; } .landing__visual-story-copy { max-width: 680px; } .landing__steps { grid-template-columns: 1fr; gap: 28px; } .landing__footer { grid-template-columns: 1fr; }
    .landing__footer > div { justify-content: flex-start; } .landing__section, .landing__audience, .landing__faq { padding: 68px 0; }
    .landing__audience::before { margin-bottom: 68px; } .landing__cta { margin-bottom: 48px; border-radius: 24px; }
  }
  @media (max-width: 440px) {
    .landing__header, .landing__hero, .landing__section, .landing__audience, .landing__visual-story, .landing__steps, .landing__faq, .landing__footer { width: min(100% - 28px, 1120px); }
    .landing__header { gap: 10px; } .landing__header .landing__brand > span:last-child { display: none; } .landing__language select { max-width: 88px; padding-right: 21px; padding-left: 7px; }
    .landing__button--small { padding: 0 12px; font-size: 12px; } .landing h1 { font-size: 41px; }
    .landing__hero-actions { align-items: stretch; flex-direction: column; } .landing__text-link { padding: 4px 0; text-align: center; }
    .landing__preview-grid { grid-template-columns: 1fr; } .landing__cta { width: min(100% - 28px, 1120px); }
  }
`;
