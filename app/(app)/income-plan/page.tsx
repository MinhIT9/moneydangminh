import Image from 'next/image';
import Link from 'next/link';
import { DashboardMonthFilter } from '@/components/dashboard-month-filter';
import { DashboardIcon } from '@/components/dashboard-visuals';
import { HelpTip } from '@/components/help-tip';
import { IncomePlanForm } from '@/components/income-plan-form';
import { getTranslations } from '@/i18n/server';
import { requireUser } from '@/lib/auth';
import { getIncomePlanAnalysis } from '@/lib/income-plan';
import { formatVnd } from '@/lib/money';
import './income-plan.css';

function formatSelectedMonth(value: string, locale: 'vi' | 'en') {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export default async function IncomePlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { locale, t } = await getTranslations();
  const params = await searchParams;
  const plan = await getIncomePlanAnalysis(user.id, params.month);
  const result = plan.calculation;
  const monthLabel = formatSelectedMonth(plan.month, locale);
  const statusLabel =
    result.status === 'REACHED'
      ? t('incomePlan.statusReached')
      : result.status === 'ON_TRACK'
        ? t('incomePlan.statusOnTrack')
        : result.status === 'PAST'
          ? t('incomePlan.statusPast')
          : t('incomePlan.statusAttention');
  const statusClass = result.status.toLowerCase().replace('_', '-');

  return (
    <div className="income-plan-page">
      <header className="income-plan-hero">
        <div className="income-plan-hero__copy">
          <span className="income-plan-eyebrow">
            <DashboardIcon name="sparkles" />
            {t('incomePlan.eyebrow')}
          </span>
          <h1>{t('incomePlan.title')}</h1>
          <p>{t('incomePlan.description')}</p>
          <div className="income-plan-hero__actions">
            <DashboardMonthFilter
              value={plan.month}
              activeMonths={plan.activeMonths}
              route="/income-plan"
              id="income-plan-month"
            />
            <Link
              className="button-ghost"
              href={`/transactions?month=${plan.month}&record=1`}
              prefetch
            >
              + {t('transaction.record')}
            </Link>
          </div>
        </div>
        <div className="income-plan-hero__art">
          <Image
            src="/images/heo-xinh-income-plan.png"
            alt={t('incomePlan.heroImageAlt')}
            width={1694}
            height={931}
            priority
            sizes="(max-width: 760px) 100vw, 48vw"
          />
        </div>
      </header>

      {params.saved === '1' ? (
        <div className="notice notice-success" role="status">
          {t('incomePlan.saved')}
        </div>
      ) : null}
      {params.error ? (
        <div className="notice notice-error" role="alert">
          {params.error}
        </div>
      ) : null}

      <section className="income-plan-targets" aria-label={t('incomePlan.targets')}>
        <article className="income-plan-target-card is-day">
          <span className="income-plan-target-card__icon">
            <DashboardIcon name="target" />
          </span>
          <div className="income-plan-title-with-help">
            <small>{t('incomePlan.perWorkday')}</small>
            <HelpTip label={t('incomePlan.explainDaily')}>{t('incomePlan.explainDaily')}</HelpTip>
          </div>
          <strong>{formatVnd(result.dailyTarget)}</strong>
          <p>{t('incomePlan.workdaysRemaining', { count: result.workdaysRemaining })}</p>
        </article>
        <article className="income-plan-target-card is-week">
          <span className="income-plan-target-card__icon">
            <DashboardIcon name="calendar" />
          </span>
          <div className="income-plan-title-with-help">
            <small>{t('incomePlan.perWeek')}</small>
            <HelpTip label={t('incomePlan.explainWeekly')}>{t('incomePlan.explainWeekly')}</HelpTip>
          </div>
          <strong>{formatVnd(result.weeklyTarget)}</strong>
          <p>{t('incomePlan.daysPerWeek', { count: result.workdaysPerWeek })}</p>
        </article>
        <article className="income-plan-target-card is-month">
          <span className="income-plan-target-card__icon">
            <DashboardIcon name="trend" />
          </span>
          <div className="income-plan-title-with-help">
            <small>{t('incomePlan.monthTarget')}</small>
            <HelpTip label={t('incomePlan.explainMonthly')}>
              {t('incomePlan.explainMonthly')}
            </HelpTip>
          </div>
          <strong>{formatVnd(result.totalIncomeTarget)}</strong>
          <p>{monthLabel}</p>
        </article>
      </section>

      <section className="income-plan-overview-grid">
        <article className="card income-plan-progress-card">
          <div className="income-plan-section-head">
            <span className="income-plan-section-icon is-purple">
              <DashboardIcon name="target" />
            </span>
            <div>
              <div className="income-plan-title-with-help">
                <h2>{t('incomePlan.progressTitle')}</h2>
                <HelpTip label={t('incomePlan.explainProgress')}>
                  {t('incomePlan.explainProgress')}
                </HelpTip>
              </div>
              <p>{t('incomePlan.progressDescription', { month: monthLabel })}</p>
            </div>
            <span className={`income-plan-status is-${statusClass}`}>{statusLabel}</span>
          </div>

          <div className="income-plan-progress-copy">
            <div>
              <span>{t('incomePlan.incomeRecorded')}</span>
              <strong>{formatVnd(result.actualIncome)}</strong>
            </div>
            <div>
              <span>{t('incomePlan.stillNeeded')}</span>
              <strong>{formatVnd(result.incomeStillNeeded)}</strong>
            </div>
          </div>
          <div
            className="income-plan-progress"
            role="progressbar"
            aria-valuenow={result.incomeProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('incomePlan.progressTitle')}
          >
            <span style={{ width: `${result.incomeProgress}%` }} />
          </div>
          <div className="income-plan-progress-meta">
            <span>{t('incomePlan.progressPercent', { percent: result.incomeProgress })}</span>
            <span>{t('incomePlan.timeProgress', { percent: result.timeProgress })}</span>
          </div>
        </article>

        <article className="card income-plan-breakdown-card">
          <div className="income-plan-section-head">
            <span className="income-plan-section-icon is-green">
              <DashboardIcon name="shield" />
            </span>
            <div>
              <div className="income-plan-title-with-help">
                <h2>{t('incomePlan.formulaTitle')}</h2>
                <HelpTip label={t('incomePlan.explainFormula')}>
                  {t('incomePlan.explainFormula')}
                </HelpTip>
              </div>
              <p>{t('incomePlan.formulaDescription')}</p>
            </div>
          </div>
          <div className="income-plan-breakdown">
            <div>
              <span>{t('incomePlan.actualExpense')}</span>
              <strong>{formatVnd(result.actualExpense)}</strong>
            </div>
            <div>
              <span>{t('incomePlan.forecastRemaining')}</span>
              <strong>+ {formatVnd(result.forecastExpenseRemaining)}</strong>
            </div>
            <div>
              <span>{t('incomePlan.extraExpenseShort')}</span>
              <strong>+ {formatVnd(result.extraExpectedExpense)}</strong>
            </div>
            <div>
              <span>{t('incomePlan.debtIncluded')}</span>
              <strong>+ {formatVnd(result.dueDebtIncluded)}</strong>
            </div>
            <div>
              <span>{t('incomePlan.bufferShort')}</span>
              <strong>+ {formatVnd(result.targetSurplus)}</strong>
            </div>
            <div className="is-total">
              <span>{t('incomePlan.monthTarget')}</span>
              <strong>{formatVnd(result.totalIncomeTarget)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="income-plan-editor-grid">
        <article className="card income-plan-editor-card">
          <div className="income-plan-section-head">
            <span className="income-plan-section-icon is-orange">
              <DashboardIcon name="coins" />
            </span>
            <div>
              <h2>{t('incomePlan.setupTitle')}</h2>
              <p>{t('incomePlan.setupDescription')}</p>
            </div>
          </div>
          <IncomePlanForm month={plan.month} settings={plan.settings} />
        </article>

        <aside className="income-plan-coach">
          <div className="income-plan-coach__mascot" aria-hidden="true">
            🐷
          </div>
          <span>{t('incomePlan.coachEyebrow')}</span>
          <h2>{t('incomePlan.coachTitle')}</h2>
          <p>{t('incomePlan.coachDescription')}</p>
          <ul>
            <li>🎓 {t('incomePlan.coachTipOne')}</li>
            <li>🍜 {t('incomePlan.coachTipTwo')}</li>
            <li>✨ {t('incomePlan.coachTipThree')}</li>
          </ul>
          <Link href={`/transactions?month=${plan.month}&record=1`} prefetch>
            {t('incomePlan.recordIncome')} →
          </Link>
        </aside>
      </section>
    </div>
  );
}
