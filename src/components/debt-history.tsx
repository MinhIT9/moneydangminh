'use client';

import { useMemo, useState } from 'react';
import { useLocale } from '@/i18n/locale-provider';
import { formatVnd } from '@/lib/money';

export type DebtHistoryItem = {
  id: string;
  debtId: string;
  counterparty: string;
  direction: 'I_OWE' | 'OWED_TO_ME';
  amount: number;
  paidOn: string;
  note: string | null;
  method: string | null;
  isSettlement: boolean;
  settlementAdjustment: number;
};

type DebtHistoryProps = {
  debts: Array<{ id: string; counterparty: string }>;
  items: DebtHistoryItem[];
};

export function DebtHistory({ debts, items }: DebtHistoryProps) {
  const { locale, t } = useLocale();
  const [debtId, setDebtId] = useState('');
  const [kind, setKind] = useState('');
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'vi' ? 'vi-VN' : 'en-US');

    return items.filter((item) => {
      if (debtId && item.debtId !== debtId) return false;
      if (kind === 'PAYMENT' && item.isSettlement) return false;
      if (kind === 'SETTLEMENT' && !item.isSettlement) return false;
      if (!normalizedQuery) return true;

      return [item.counterparty, item.note, item.method]
        .filter(Boolean)
        .some((value) =>
          value?.toLocaleLowerCase(locale === 'vi' ? 'vi-VN' : 'en-US').includes(normalizedQuery),
        );
    });
  }, [debtId, items, kind, locale, query]);

  const filteredTotal = filteredItems.reduce((total, item) => total + item.amount, 0);
  const dateFormatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  return (
    <section className="card debt-history">
      <div className="debt-history__head">
        <div>
          <span className="eyebrow">{t('debt.historyEyebrow')}</span>
          <h2>{t('debt.history')}</h2>
          <p className="muted">{t('debt.historyDescription')}</p>
        </div>
        <div className="debt-history__summary">
          <span>{t('debt.historyResult', { count: filteredItems.length })}</span>
          <strong>{formatVnd(filteredTotal)}</strong>
        </div>
      </div>

      <div className="debt-history__filters">
        <label>
          <span>{t('debt.filterDebt')}</span>
          <select value={debtId} onChange={(event) => setDebtId(event.target.value)}>
            <option value="">{t('debt.allDebts')}</option>
            {debts.map((debt) => (
              <option key={debt.id} value={debt.id}>
                {debt.counterparty}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('debt.filterKind')}</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="">{t('debt.allActivity')}</option>
            <option value="PAYMENT">{t('debt.regularPayment')}</option>
            <option value="SETTLEMENT">{t('debt.settlement')}</option>
          </select>
        </label>
        <label className="debt-history__search">
          <span>{t('debt.searchHistory')}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('debt.searchHistoryPlaceholder')}
          />
        </label>
      </div>

      {filteredItems.length ? (
        <div className="debt-history__list">
          {filteredItems.map((item) => (
            <article className="debt-history-item" key={item.id}>
              <div className="debt-history-item__identity">
                <time dateTime={item.paidOn}>{dateFormatter.format(new Date(item.paidOn))}</time>
                <strong>{item.counterparty}</strong>
                <span>{item.direction === 'I_OWE' ? t('debt.toPay') : t('debt.toCollect')}</span>
              </div>
              <div className="debt-history-item__activity">
                <span className={`badge ${item.isSettlement ? 'success' : ''}`}>
                  {item.isSettlement ? t('debt.settlement') : t('debt.regularPayment')}
                </span>
                {item.settlementAdjustment > 0 ? (
                  <span className="is-positive">
                    {t('debt.adjustmentShort', {
                      amount: formatVnd(item.settlementAdjustment),
                    })}
                  </span>
                ) : null}
              </div>
              <div className="debt-history-item__details">
                <span>
                  <small>{t('common.method')}</small>
                  {item.method ?? t('common.notSelected')}
                </span>
                <span>
                  <small>{t('common.note')}</small>
                  {item.note || t('common.noNote')}
                </span>
              </div>
              <strong
                className={`debt-history-item__amount ${
                  item.direction === 'I_OWE' ? 'money-out' : 'money-in'
                }`}
              >
                {formatVnd(item.amount)}
              </strong>
            </article>
          ))}
        </div>
      ) : (
        <div className="debt-history__empty">
          <span aria-hidden="true">⌕</span>
          <strong>{t('debt.noHistoryResult')}</strong>
          <p>{t('debt.noHistoryResultDescription')}</p>
        </div>
      )}
    </section>
  );
}
