'use client';

import { useState } from 'react';
import { saveIncomePlanAction } from '@/actions/income-plan';
import { HelpTip } from '@/components/help-tip';
import { MoneyInput } from '@/components/money-input';
import { SubmitButton } from '@/components/submit-button';
import { useLocale } from '@/i18n/locale-provider';
import type { IncomeForecastMethod, IncomePlanSettings } from '@/lib/income-plan-calculator';

export function IncomePlanForm({
  month,
  settings,
}: {
  month: string;
  settings: IncomePlanSettings;
}) {
  const { t } = useLocale();
  const [method, setMethod] = useState<IncomeForecastMethod>(settings.forecastMethod);

  return (
    <form action={saveIncomePlanAction} className="income-plan-form">
      <input type="hidden" name="month" value={month} />
      <div className="income-plan-form__grid">
        <div className="field">
          <span className="field-label income-plan-label">
            {t('incomePlan.targetSurplus')}
            <HelpTip label={t('incomePlan.explainTargetSurplus')}>
              {t('incomePlan.explainTargetSurplus')}
            </HelpTip>
          </span>
          <MoneyInput name="targetSurplus" defaultValue={settings.targetSurplus} />
          <small>{t('incomePlan.targetSurplusHint')}</small>
        </div>

        <div className="field">
          <span className="field-label income-plan-label">
            {t('incomePlan.workdaysPerWeek')}
            <HelpTip label={t('incomePlan.explainWorkdays')}>
              {t('incomePlan.explainWorkdays')}
            </HelpTip>
          </span>
          <select name="workdaysPerWeek" defaultValue={settings.workdaysPerWeek}>
            {Array.from({ length: 7 }, (_, index) => index + 1).map((days) => (
              <option value={days} key={days}>
                {t('incomePlan.daysPerWeek', { count: days })}
              </option>
            ))}
          </select>
          <small>{t('incomePlan.workdaysHint')}</small>
        </div>

        <div className="field">
          <span className="field-label income-plan-label">
            {t('incomePlan.forecastMethod')}
            <HelpTip label={t('incomePlan.explainForecast')}>
              {t('incomePlan.explainForecast')}
            </HelpTip>
          </span>
          <select
            name="forecastMethod"
            value={method}
            onChange={(event) => setMethod(event.target.value as IncomeForecastMethod)}
          >
            <option value="CURRENT_PACE">{t('incomePlan.forecastPace')}</option>
            <option value="THREE_MONTH_AVERAGE">{t('incomePlan.forecastAverage')}</option>
            <option value="MANUAL">{t('incomePlan.forecastManual')}</option>
          </select>
          <small>
            {method === 'CURRENT_PACE'
              ? t('incomePlan.forecastPaceHint')
              : method === 'THREE_MONTH_AVERAGE'
                ? t('incomePlan.forecastAverageHint')
                : t('incomePlan.forecastManualHint')}
          </small>
        </div>

        <div className={`field${method === 'MANUAL' ? '' : ' is-muted-field'}`}>
          <span className="field-label income-plan-label">
            {t('incomePlan.manualExpense')}
            <HelpTip label={t('incomePlan.explainManualExpense')}>
              {t('incomePlan.explainManualExpense')}
            </HelpTip>
          </span>
          <MoneyInput
            name="manualMonthlyExpense"
            defaultValue={settings.manualMonthlyExpense ?? ''}
            required={method === 'MANUAL'}
          />
          <small>
            {method === 'MANUAL'
              ? t('incomePlan.manualExpenseHint')
              : t('incomePlan.manualExpenseDisabled')}
          </small>
        </div>

        <div className="field full">
          <span className="field-label income-plan-label">
            {t('incomePlan.extraExpense')}
            <HelpTip label={t('incomePlan.explainExtraExpense')}>
              {t('incomePlan.explainExtraExpense')}
            </HelpTip>
          </span>
          <MoneyInput name="extraExpectedExpense" defaultValue={settings.extraExpectedExpense} />
          <small>{t('incomePlan.extraExpenseHint')}</small>
        </div>
      </div>

      <label className="income-plan-check">
        <input type="checkbox" name="includeDueDebts" defaultChecked={settings.includeDueDebts} />
        <span>
          <strong>{t('incomePlan.includeDebts')}</strong>
          <small>{t('incomePlan.includeDebtsHint')}</small>
        </span>
        <HelpTip label={t('incomePlan.explainDebts')}>{t('incomePlan.explainDebts')}</HelpTip>
      </label>

      <div className="form-actions">
        <SubmitButton pendingText={t('incomePlan.saving')}>{t('incomePlan.save')}</SubmitButton>
      </div>
    </form>
  );
}
