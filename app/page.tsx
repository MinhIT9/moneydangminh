import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { landingCopy } from '@/i18n/landing-copy';
import { LocaleProvider } from '@/i18n/locale-provider';
import { getTranslations } from '@/i18n/server';
import './landing.css';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://heoxinh.vn').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Heo Xinh | Tiết kiệm và giải trí',
  description:
    'Heo Xinh giúp bạn ghi thu chi rõ ràng, xây thói quen tiết kiệm và thư giãn với trò chơi trí tuệ.',
  keywords: [
    'quản lý chi tiêu',
    'ghi thu chi',
    'sổ thu chi cá nhân',
    'quản lý tài chính cá nhân',
    'theo dõi chi tiêu',
  ],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Heo Xinh',
    title: 'Heo Xinh | Tiết kiệm và giải trí',
    description:
      'Một cuốn sổ thu chi gọn gàng để bạn biết tiền đang đi đâu và chủ động hơn mỗi tháng.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Heo Xinh - Tiết kiệm và giải trí',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heo Xinh | Tiết kiệm và giải trí',
    description: 'Ghi thu chi nhanh, rõ ràng và dễ duy trì cho cuộc sống hằng ngày.',
    images: ['/opengraph-image'],
  },
};

type LandingIconName =
  'arrow' | 'chart' | 'debt' | 'game' | 'receipt' | 'shield' | 'sparkles' | 'user';

function LandingIcon({ name }: { name: LandingIconName }) {
  const paths: Record<LandingIconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    chart: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 4-4 3 2 6-7M16 6h4v4" />
      </>
    ),
    debt: (
      <>
        <path d="M5 8h14v11H5zM8 5h8v3M8 12h8M8 15h5" />
        <circle cx="17" cy="17" r="3" />
      </>
    ),
    game: (
      <>
        <path d="M8 8h8a5 5 0 0 1 4.8 6.5l-1 3a2 2 0 0 1-3.3.8L14 16h-4l-2.5 2.3a2 2 0 0 1-3.3-.8l-1-3A5 5 0 0 1 8 8Z" />
        <path d="M7 11v4M5 13h4M16 12h.01M18 14h.01" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z" />
        <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="hx-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function PigBrandMark() {
  return (
    <svg aria-hidden="true" className="hx-brand__mark" viewBox="0 0 48 48">
      <defs>
        <linearGradient id="pig-brand-gradient" x1="8" y1="5" x2="40" y2="43">
          <stop stopColor="#ff8aae" />
          <stop offset="1" stopColor="#ff467d" />
        </linearGradient>
      </defs>
      <path d="M12 15 9 7l9 4a20 20 0 0 1 12 0l9-4-3 8a18 18 0 1 1-24 0Z" fill="#fff" />
      <path
        d="M13 16.5 11 9l7.5 4A17 17 0 0 1 35 16.5a16 16 0 1 1-22 0Z"
        fill="url(#pig-brand-gradient)"
      />
      <circle cx="19" cy="23" r="2" fill="#71304a" />
      <circle cx="29" cy="23" r="2" fill="#71304a" />
      <ellipse cx="24" cy="30" rx="7" ry="5" fill="#ffb0c6" />
      <circle cx="21.5" cy="30" r="1.2" fill="#b84565" />
      <circle cx="26.5" cy="30" r="1.2" fill="#b84565" />
    </svg>
  );
}

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
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: copy.faq.items.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };
  const featureIcons: LandingIconName[] = ['receipt', 'chart', 'debt', 'game'];

  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <main className="hx-landing">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="hx-landing__glow hx-landing__glow--one" aria-hidden="true" />
        <div className="hx-landing__glow hx-landing__glow--two" aria-hidden="true" />

        <header className="hx-header">
          <Link className="hx-brand" href="/" aria-label={copy.homeLabel}>
            <PigBrandMark />
            <span>
              <strong>{t('brand.name')}</strong>
              <small>{t('brand.slogan')}</small>
            </span>
          </Link>

          <nav className="hx-nav" aria-label={copy.navigationLabel}>
            <a href="#tinh-nang">{copy.navigation.features}</a>
            <a href="#danh-cho-ban">{copy.navigation.audience}</a>
            <a href="#cau-hoi">{copy.navigation.questions}</a>
            <a href="#ho-tro">{copy.navigation.support}</a>
          </nav>

          <div className="hx-header__actions">
            <LanguageSwitcher className="hx-language" />
            <Link className="hx-login" href="/login" prefetch>
              {copy.login}
            </Link>
            <Link className="hx-button hx-button--small" href="/register" prefetch>
              {copy.startFree}
            </Link>
          </div>
        </header>

        <section className="hx-hero" aria-labelledby="hero-title">
          <div className="hx-hero__copy">
            <p className="hx-eyebrow">
              <LandingIcon name="sparkles" />
              {copy.hero.eyebrow}
            </p>
            <h1 id="hero-title">
              <span>{copy.hero.title}</span>
              <strong>{copy.hero.titleAccent}</strong>
            </h1>
            <p className="hx-hero__lead">{copy.hero.description}</p>
            <div className="hx-hero__actions">
              <Link className="hx-button" href="/register" prefetch>
                {copy.hero.primaryAction}
                <LandingIcon name="arrow" />
              </Link>
              <a className="hx-button hx-button--ghost" href="#tinh-nang">
                {copy.hero.secondaryAction}
              </a>
            </div>
            <p className="hx-hero__trust">
              <LandingIcon name="shield" />
              {copy.hero.note}
            </p>
          </div>

          <div className="hx-hero__visual" aria-label={copy.hero.previewLabel}>
            <span className="hx-hero__orb" aria-hidden="true" />
            <span className="hx-hero__coin hx-hero__coin--one" aria-hidden="true">
              ₫
            </span>
            <span className="hx-hero__coin hx-hero__coin--two" aria-hidden="true">
              ₫
            </span>
            <Image
              className="hx-hero__pig"
              src="/images/heo-xinh-landing-piggy.png"
              alt={copy.hero.previewLabel}
              width={1254}
              height={1254}
              priority
              sizes="(max-width: 760px) 82vw, 430px"
            />

            <article className="hx-stat hx-stat--saving">
              <span>{copy.preview.savings}</span>
              <strong>12.450.000 đ</strong>
              <small>↗ {copy.preview.savingsChange}</small>
              <i className="hx-mini-chart is-pink" aria-hidden="true">
                <b />
                <b />
                <b />
                <b />
                <b />
              </i>
            </article>
            <article className="hx-stat hx-stat--expense">
              <span>{copy.preview.expense}</span>
              <strong>5.350.000 đ</strong>
              <small>{copy.preview.currentMonthValue}</small>
              <i className="hx-mini-chart is-blue" aria-hidden="true">
                <b />
                <b />
                <b />
                <b />
                <b />
              </i>
            </article>
            <article className="hx-stat hx-stat--game">
              <span>{copy.preview.gameScore}</span>
              <strong>{copy.preview.gameScoreValue}</strong>
              <small>{copy.preview.gameScoreHint}</small>
              <span className="hx-caro-mini" aria-hidden="true">
                × ○ ×<br />○ × ○
              </span>
            </article>
          </div>
        </section>

        <section className="hx-feature-strip" id="tinh-nang" aria-label={copy.features.title}>
          {copy.features.items.map((feature, index) => (
            <article key={feature.title}>
              <span className={`hx-feature-strip__icon color-${index + 1}`}>
                <LandingIcon name={featureIcons[index]} />
              </span>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section
          className="hx-section hx-audience"
          id="danh-cho-ban"
          aria-labelledby="audience-title"
        >
          <div className="hx-section__heading hx-section__heading--center">
            <p className="hx-eyebrow">{copy.audience.eyebrow}</p>
            <h2 id="audience-title">{copy.audience.title}</h2>
          </div>
          <div className="hx-audience__grid">
            <article className="hx-audience__card tone-pink">
              <div className="hx-audience__visual is-student">
                <Image
                  src="/images/vi-smart-student.png"
                  alt={copy.visuals.studentAlt}
                  fill
                  sizes="(max-width: 700px) 42vw, 180px"
                />
              </div>
              <div>
                <h3>{copy.audience.items[0].title}</h3>
                <p>{copy.audience.items[0].description}</p>
              </div>
            </article>
            <article className="hx-audience__card tone-orange">
              <div className="hx-audience__visual is-family">
                <Image
                  src="/images/vi-smart-family.png"
                  alt={copy.visuals.familyAlt}
                  fill
                  sizes="(max-width: 700px) 42vw, 180px"
                />
              </div>
              <div>
                <h3>{copy.audience.items[1].title}</h3>
                <p>{copy.audience.items[1].description}</p>
              </div>
            </article>
            <article className="hx-audience__card tone-blue">
              <div className="hx-audience__visual is-driver">
                <Image
                  src="/images/heo-xinh-landing-driver.png"
                  alt={copy.audience.items[2].title}
                  fill
                  sizes="(max-width: 700px) 42vw, 180px"
                />
              </div>
              <div>
                <h3>{copy.audience.items[2].title}</h3>
                <p>{copy.audience.items[2].description}</p>
              </div>
            </article>
            <article className="hx-audience__card tone-green">
              <div className="hx-audience__visual is-simple">
                <Image
                  src="/images/vi-smart-hero.png"
                  alt={copy.audience.items[3].title}
                  fill
                  sizes="(max-width: 700px) 42vw, 180px"
                />
              </div>
              <div>
                <h3>{copy.audience.items[3].title}</h3>
                <p>{copy.audience.items[3].description}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="hx-section hx-steps" aria-labelledby="steps-title">
          <div className="hx-section__heading hx-section__heading--center">
            <p className="hx-eyebrow">{copy.steps.eyebrow}</p>
            <h2 id="steps-title">{copy.steps.title}</h2>
          </div>
          <ol>
            {copy.steps.items.map((step, index) => (
              <li key={step.title}>
                <span className="hx-steps__number">{index + 1}</span>
                <span className="hx-steps__icon">
                  <LandingIcon name={index === 0 ? 'user' : index === 1 ? 'receipt' : 'chart'} />
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="hx-section hx-faq" id="cau-hoi" aria-labelledby="faq-title">
          <div className="hx-faq__mascot">
            <span>{locale === 'vi' ? 'Bạn còn thắc mắc?' : 'Still curious?'}</span>
            <Image
              src="/images/heo-xinh-landing-piggy.png"
              alt=""
              width={1254}
              height={1254}
              loading="lazy"
              sizes="190px"
            />
          </div>
          <div className="hx-faq__content">
            <div className="hx-section__heading">
              <p className="hx-eyebrow">{copy.faq.eyebrow}</p>
              <h2 id="faq-title">{copy.faq.title}</h2>
            </div>
            <div className="hx-faq__grid">
              {copy.faq.items.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="hx-cta" aria-labelledby="cta-title">
          <div>
            <p className="hx-eyebrow">{copy.cta.eyebrow}</p>
            <h2 id="cta-title">{copy.cta.title}</h2>
            <p>{copy.cta.description}</p>
          </div>
          <Link className="hx-button hx-button--light" href="/register" prefetch>
            {copy.cta.action}
            <LandingIcon name="arrow" />
          </Link>
        </section>

        <footer className="hx-footer" id="ho-tro">
          <div className="hx-footer__brand">
            <Link className="hx-brand" href="/">
              <PigBrandMark />
              <span>
                <strong>{t('brand.name')}</strong>
                <small>{t('brand.slogan')}</small>
              </span>
            </Link>
            <p>{copy.footer.description}</p>
          </div>
          <div>
            <strong>{copy.footer.product}</strong>
            <a href="#tinh-nang">{copy.footer.features}</a>
            <a href="#danh-cho-ban">{copy.footer.audience}</a>
            <Link href="/register">{copy.startFree}</Link>
          </div>
          <div>
            <strong>{copy.footer.support}</strong>
            <a href="#cau-hoi">{copy.footer.questions}</a>
            <Link href="/support">{copy.footer.guide}</Link>
            <Link href="/support">{copy.footer.support}</Link>
          </div>
          <div>
            <strong>{copy.footer.about}</strong>
            <Link href="/">{copy.footer.introduction}</Link>
            <Link href="/privacy">{copy.footer.privacy}</Link>
            <Link href="/privacy">{copy.footer.terms}</Link>
          </div>
          <p className="hx-footer__copyright">{copy.footer.copyright}</p>
        </footer>

        <a
          className="hx-scroll-top"
          href="#hero-title"
          aria-label={locale === 'vi' ? 'Lên đầu trang' : 'Back to top'}
        >
          ↑
        </a>
      </main>
    </LocaleProvider>
  );
}
