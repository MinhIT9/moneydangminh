import {
  createDebtAction,
  recordDebtPaymentAction,
  settleDebtAction,
  updateDebtAction,
} from '@/actions/finance';
import { DebtHistory, type DebtHistoryItem } from '@/components/debt-history';
import { DebtModal } from '@/components/debt-modal';
import { DeleteDebtForm } from '@/components/delete-debt-form';
import { MoneyInput } from '@/components/money-input';
import { SubmitButton } from '@/components/submit-button';
import { getTranslations } from '@/i18n/server';
import { requireUser } from '@/lib/auth';
import { dateInputValue } from '@/lib/date';
import { db } from '@/lib/db';
import { debtSummary } from '@/lib/finance';
import { formatVnd } from '@/lib/money';

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { locale, t } = await getTranslations();
  const { error } = await searchParams;
  const [debts, methods] = await Promise.all([
    db.debt.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        counterparty: true,
        direction: true,
        originalAmount: true,
        status: true,
        note: true,
        startedOn: true,
        dueOn: true,
        settledOn: true,
        payments: {
          select: {
            id: true,
            amount: true,
            isSettlement: true,
            paidOn: true,
            note: true,
            createdAt: true,
            transaction: {
              select: {
                paymentMethod: { select: { name: true } },
              },
            },
          },
          orderBy: [{ paidOn: 'desc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: [{ status: 'asc' }, { dueOn: 'asc' }, { createdAt: 'desc' }],
    }),
    db.paymentMethod.findMany({
      where: { userId: user.id, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const today = dateInputValue(new Date());
  const dateFormatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const historyItems: DebtHistoryItem[] = debts
    .flatMap((debt) => {
      const summary = debtSummary(debt);

      return debt.payments.map((payment) => ({
        id: payment.id,
        debtId: debt.id,
        counterparty: debt.counterparty,
        direction: debt.direction,
        amount: Number(payment.amount),
        paidOn: payment.paidOn.toISOString(),
        note: payment.note,
        method: payment.transaction?.paymentMethod?.name ?? null,
        isSettlement: payment.isSettlement,
        settlementAdjustment: payment.isSettlement ? summary.settlementAdjustment : 0,
        createdAt: payment.createdAt.getTime(),
      }));
    })
    .sort((itemA, itemB) => {
      const dateOrder = itemB.paidOn.localeCompare(itemA.paidOn);
      return dateOrder || itemB.createdAt - itemA.createdAt;
    })
    .map(({ createdAt: _createdAt, ...item }) => item);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t('debt.title')}</h1>
          <p className="muted">{t('debt.description')}</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <details className="form-reveal" open={Boolean(error)}>
        <summary>{t('debt.add')}</summary>
        <form action={createDebtAction} className="form-card">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="counterparty">{t('debt.counterparty')}</label>
              <input
                id="counterparty"
                name="counterparty"
                maxLength={150}
                placeholder={t('debt.counterpartyExample')}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="direction">{t('debt.direction')}</label>
              <select id="direction" name="direction" defaultValue="I_OWE">
                <option value="I_OWE">{t('debt.iOwe')}</option>
                <option value="OWED_TO_ME">{t('debt.owedToMe')}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="originalAmount">{t('debt.originalAmount')}</label>
              <MoneyInput id="originalAmount" name="originalAmount" required />
            </div>
            <div className="field">
              <label htmlFor="startedOn">{t('debt.startedOn')}</label>
              <input id="startedOn" name="startedOn" type="date" defaultValue={today} required />
            </div>
            <div className="field">
              <label htmlFor="dueOn">{t('debt.dueOn')}</label>
              <input id="dueOn" name="dueOn" type="date" />
            </div>
            <div className="field full">
              <label htmlFor="debt-note">{t('common.note')}</label>
              <input
                id="debt-note"
                name="note"
                maxLength={300}
                placeholder={t('debt.noteExample')}
              />
            </div>
          </div>
          <div className="form-actions">
            <SubmitButton>{t('debt.add')}</SubmitButton>
          </div>
        </form>
      </details>

      <section className="debt-grid debt-management-grid">
        {debts.length ? (
          debts.map((debt) => {
            const summary = debtSummary(debt);
            const isSettled = debt.status === 'SETTLED';
            const progress = isSettled
              ? 100
              : summary.original
                ? Math.round((summary.paid / summary.original) * 100)
                : 0;

            return (
              <article className={`card debt-card${isSettled ? ' is-settled' : ''}`} key={debt.id}>
                <div className="debt-card__top">
                  <span className={`badge ${isSettled ? 'success' : ''}`}>
                    {isSettled
                      ? t('debt.completed')
                      : debt.direction === 'I_OWE'
                        ? t('debt.toPay')
                        : t('debt.toCollect')}
                  </span>
                  {debt.settledOn ? (
                    <span className="debt-card__date">
                      {t('debt.settledOn', { date: dateFormatter.format(debt.settledOn) })}
                    </span>
                  ) : null}
                </div>
                <h2>{debt.counterparty}</h2>
                <p className="debt-number">{formatVnd(summary.remaining)}</p>
                <span className="muted">
                  {t('debt.ofOriginal', {
                    original: formatVnd(summary.original),
                    paid: formatVnd(summary.paid),
                  })}
                </span>
                {summary.settlementAdjustment > 0 ? (
                  <div className="debt-adjustment">
                    <span>{t('debt.settlementAdjustment')}</span>
                    <strong>{formatVnd(summary.settlementAdjustment)}</strong>
                  </div>
                ) : null}
                <div className="progress" aria-label={t('debt.progress', { progress })}>
                  <span style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
                <span className="muted">
                  {t('debt.progress', { progress })}
                  {debt.dueOn
                    ? ` ${t('debt.due', { date: dateFormatter.format(debt.dueOn) })}`
                    : ''}
                </span>
                {debt.note ? <p className="debt-card__note">{debt.note}</p> : null}

                <div className="debt-card__actions">
                  <DebtModal
                    title={`${t('debt.edit')} · ${debt.counterparty}`}
                    description={t('debt.editModalDescription')}
                    triggerLabel={`✎ ${t('debt.edit')}`}
                  >
                    <form action={updateDebtAction} className="form-card">
                      <input type="hidden" name="id" value={debt.id} />
                      <div className="form-grid">
                        <div className="field">
                          <label htmlFor={`edit-counterparty-${debt.id}`}>
                            {t('debt.counterparty')}
                          </label>
                          <input
                            id={`edit-counterparty-${debt.id}`}
                            name="counterparty"
                            defaultValue={debt.counterparty}
                            maxLength={150}
                            required
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-direction-${debt.id}`}>{t('debt.direction')}</label>
                          <select
                            id={`edit-direction-${debt.id}`}
                            name="direction"
                            defaultValue={debt.direction}
                          >
                            <option value="I_OWE">{t('debt.iOwe')}</option>
                            <option value="OWED_TO_ME">{t('debt.owedToMe')}</option>
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-amount-${debt.id}`}>
                            {t('debt.originalAmount')}
                          </label>
                          <MoneyInput
                            id={`edit-amount-${debt.id}`}
                            name="originalAmount"
                            defaultValue={Number(debt.originalAmount)}
                            required
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-started-${debt.id}`}>{t('debt.startedOn')}</label>
                          <input
                            id={`edit-started-${debt.id}`}
                            name="startedOn"
                            type="date"
                            defaultValue={dateInputValue(debt.startedOn)}
                            required
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-due-${debt.id}`}>{t('debt.dueOn')}</label>
                          <input
                            id={`edit-due-${debt.id}`}
                            name="dueOn"
                            type="date"
                            defaultValue={dateInputValue(debt.dueOn)}
                          />
                        </div>
                        <div className="field full">
                          <label htmlFor={`edit-note-${debt.id}`}>{t('common.note')}</label>
                          <input
                            id={`edit-note-${debt.id}`}
                            name="note"
                            defaultValue={debt.note ?? ''}
                            maxLength={300}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <SubmitButton>{t('debt.saveChanges')}</SubmitButton>
                      </div>
                    </form>
                  </DebtModal>

                  {!isSettled ? (
                    <>
                      <DebtModal
                        title={`${t('debt.recordPayment')} · ${debt.counterparty}`}
                        description={t('debt.paymentModalDescription')}
                        triggerLabel={`＋ ${t('debt.recordPayment')}`}
                      >
                        <form action={recordDebtPaymentAction} className="form-card">
                          <input type="hidden" name="debtId" value={debt.id} />
                          <div className="form-grid">
                            <div className="field">
                              <label htmlFor={`payment-amount-${debt.id}`}>
                                {t('common.amount')}
                              </label>
                              <MoneyInput id={`payment-amount-${debt.id}`} name="amount" required />
                            </div>
                            <div className="field">
                              <label htmlFor={`payment-date-${debt.id}`}>{t('common.date')}</label>
                              <input
                                id={`payment-date-${debt.id}`}
                                name="paidOn"
                                type="date"
                                defaultValue={today}
                                required
                              />
                            </div>
                            <div className="field full">
                              <label htmlFor={`payment-method-${debt.id}`}>
                                {t('common.method')}
                              </label>
                              <select
                                id={`payment-method-${debt.id}`}
                                name="paymentMethodId"
                                defaultValue=""
                              >
                                <option value="">{t('common.notSelected')}</option>
                                {methods.map((method) => (
                                  <option key={method.id} value={method.id}>
                                    {method.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="field full">
                              <label htmlFor={`payment-note-${debt.id}`}>{t('common.note')}</label>
                              <input id={`payment-note-${debt.id}`} name="note" maxLength={300} />
                            </div>
                          </div>
                          <div className="form-actions">
                            <SubmitButton>{t('debt.recordPayment')}</SubmitButton>
                          </div>
                        </form>
                      </DebtModal>

                      <DebtModal
                        title={`${t('debt.settle')} · ${debt.counterparty}`}
                        description={t('debt.settlementModalDescription')}
                        triggerLabel={`✓ ${t('debt.settle')}`}
                        triggerClassName="button"
                      >
                        <form action={settleDebtAction} className="form-card">
                          <input type="hidden" name="debtId" value={debt.id} />
                          <div className="settlement-callout">
                            <span>{t('debt.currentRemaining')}</span>
                            <strong>{formatVnd(summary.remaining)}</strong>
                          </div>
                          <div className="form-grid">
                            <div className="field">
                              <label htmlFor={`settle-amount-${debt.id}`}>
                                {t('debt.settlementAmount')}
                              </label>
                              <MoneyInput
                                id={`settle-amount-${debt.id}`}
                                name="amount"
                                placeholder={t('debt.settlementAmountPlaceholder')}
                              />
                              <span className="field-help">{t('debt.settlementAmountHint')}</span>
                            </div>
                            <div className="field">
                              <label htmlFor={`settle-date-${debt.id}`}>
                                {t('debt.settlementDate')}
                              </label>
                              <input
                                id={`settle-date-${debt.id}`}
                                name="paidOn"
                                type="date"
                                defaultValue={today}
                                required
                              />
                            </div>
                            <div className="field full">
                              <label htmlFor={`settle-method-${debt.id}`}>
                                {t('common.method')}
                              </label>
                              <select
                                id={`settle-method-${debt.id}`}
                                name="paymentMethodId"
                                defaultValue=""
                              >
                                <option value="">{t('common.notSelected')}</option>
                                {methods.map((method) => (
                                  <option key={method.id} value={method.id}>
                                    {method.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="field full">
                              <label htmlFor={`settle-note-${debt.id}`}>{t('common.note')}</label>
                              <input
                                id={`settle-note-${debt.id}`}
                                name="note"
                                maxLength={300}
                                placeholder={t('debt.settlementNotePlaceholder')}
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <SubmitButton>{t('debt.confirmSettlement')}</SubmitButton>
                          </div>
                        </form>
                      </DebtModal>
                    </>
                  ) : null}

                  <DeleteDebtForm debtId={debt.id} paymentCount={debt.payments.length} />
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-card">
            <div>
              <strong>{t('debt.none')}</strong>
              <span>{t('debt.noneDescription')}</span>
            </div>
          </div>
        )}
      </section>

      <DebtHistory
        debts={debts.map((debt) => ({ id: debt.id, counterparty: debt.counterparty }))}
        items={historyItems}
      />
    </>
  );
}
