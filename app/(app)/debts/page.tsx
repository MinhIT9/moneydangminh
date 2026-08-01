import { createDebtAction, recordDebtPaymentAction } from '@/actions/finance';
import { DeleteDebtForm } from '@/components/delete-debt-form';
import { MoneyInput } from '@/components/money-input';
import { SubmitButton } from '@/components/submit-button';
import { requireUser } from '@/lib/auth';
import { dateInputValue } from '@/lib/date';
import { debtSummary } from '@/lib/finance';
import { formatVnd } from '@/lib/money';
import { db } from '@/lib/db';
import { getTranslations } from '@/i18n/server';

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
        dueOn: true,
        payments: {
          select: { id: true, amount: true },
          orderBy: { paidOn: 'desc' },
        },
      },
      orderBy: [{ status: 'asc' }, { dueOn: 'asc' }],
    }),
    db.paymentMethod.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: { name: 'asc' },
    }),
  ]);

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
              <input
                id="startedOn"
                name="startedOn"
                type="date"
                defaultValue={dateInputValue(new Date())}
                required
              />
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

      <section className="debt-grid" style={{ marginTop: 16 }}>
        {debts.length ? (
          debts.map((debt) => {
            const summary = debtSummary(debt);
            const progress = summary.original
              ? Math.round((summary.paid / summary.original) * 100)
              : 0;
            const isSettled = debt.status === 'SETTLED';

            return (
              <article className="card debt-card" key={debt.id}>
                <span className={`badge ${isSettled ? 'success' : ''}`}>
                  {isSettled
                    ? t('debt.completed')
                    : debt.direction === 'I_OWE'
                      ? t('debt.toPay')
                      : t('debt.toCollect')}
                </span>
                <h2 style={{ marginTop: 12 }}>{debt.counterparty}</h2>
                <p className="debt-number">{formatVnd(summary.remaining)}</p>
                <span className="muted">
                  {t('debt.ofOriginal', {
                    original: formatVnd(summary.original),
                    paid: formatVnd(summary.paid),
                  })}
                </span>
                <div className="progress">
                  <span style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
                <span className="muted">
                  {t('debt.progress', { progress })}
                  {debt.dueOn
                    ? ` ${t('debt.due', {
                        date: new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          timeZone: 'Asia/Ho_Chi_Minh',
                        }).format(debt.dueOn),
                      })}`
                    : ''}
                </span>

                {!isSettled ? (
                  <details className="form-reveal" style={{ marginTop: 16 }}>
                    <summary>{t('debt.recordPayment')}</summary>
                    <form action={recordDebtPaymentAction} className="form-card">
                      <input type="hidden" name="debtId" value={debt.id} />
                      <div className="form-grid">
                        <div className="field">
                          <label htmlFor={`payment-amount-${debt.id}`}>{t('common.amount')}</label>
                          <MoneyInput id={`payment-amount-${debt.id}`} name="amount" required />
                        </div>
                        <div className="field">
                          <label>{t('common.date')}</label>
                          <input
                            name="paidOn"
                            type="date"
                            defaultValue={dateInputValue(new Date())}
                            required
                          />
                        </div>
                        <div className="field full">
                          <label>{t('common.method')}</label>
                          <select name="paymentMethodId" defaultValue="">
                            <option value="">{t('common.notSelected')}</option>
                            {methods.map((method) => (
                              <option key={method.id} value={method.id}>
                                {method.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field full">
                          <label>{t('common.note')}</label>
                          <input name="note" maxLength={300} />
                        </div>
                      </div>
                      <div className="form-actions">
                        <SubmitButton>{t('debt.recordPayment')}</SubmitButton>
                      </div>
                    </form>
                  </details>
                ) : null}

                <DeleteDebtForm debtId={debt.id} paymentCount={debt.payments.length} />
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
    </>
  );
}
