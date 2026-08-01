import { createDebtAction, recordDebtPaymentAction } from '@/actions/finance';
import { DeleteDebtForm } from '@/components/delete-debt-form';
import { MoneyInput } from '@/components/money-input';
import { SubmitButton } from '@/components/submit-button';
import { requireUser } from '@/lib/auth';
import { dateInputValue } from '@/lib/date';
import { debtSummary } from '@/lib/finance';
import { formatVnd } from '@/lib/money';
import { db } from '@/lib/db';

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const [debts, methods] = await Promise.all([
    db.debt.findMany({
      where: { userId: user.id },
      include: { payments: { orderBy: { paidOn: 'desc' } } },
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
          <h1>Khoản nợ</h1>
          <p className="muted">Theo dõi khoản bạn cần trả hoặc cần thu về, không bỏ sót tiến độ.</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <details className="form-reveal" open={Boolean(error)}>
        <summary>＋ Thêm khoản nợ</summary>
        <form action={createDebtAction} className="form-card">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="counterparty">Tên người/đơn vị</label>
              <input
                id="counterparty"
                name="counterparty"
                maxLength={150}
                placeholder="Ví dụ: Anh Nam"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="direction">Loại khoản</label>
              <select id="direction" name="direction" defaultValue="I_OWE">
                <option value="I_OWE">Tôi cần trả</option>
                <option value="OWED_TO_ME">Người khác cần trả tôi</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="originalAmount">Tổng số tiền</label>
              <MoneyInput id="originalAmount" name="originalAmount" required />
            </div>
            <div className="field">
              <label htmlFor="startedOn">Ngày bắt đầu</label>
              <input
                id="startedOn"
                name="startedOn"
                type="date"
                defaultValue={dateInputValue(new Date())}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="dueOn">Ngày đến hạn (không bắt buộc)</label>
              <input id="dueOn" name="dueOn" type="date" />
            </div>
            <div className="field full">
              <label htmlFor="debt-note">Ghi chú</label>
              <input
                id="debt-note"
                name="note"
                maxLength={300}
                placeholder="Ví dụ: Trả góp điện thoại"
              />
            </div>
          </div>
          <div className="form-actions">
            <SubmitButton>Thêm khoản nợ</SubmitButton>
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
                  {isSettled ? 'Đã hoàn tất' : debt.direction === 'I_OWE' ? 'Cần trả' : 'Cần thu'}
                </span>
                <h2 style={{ marginTop: 12 }}>{debt.counterparty}</h2>
                <p className="debt-number">{formatVnd(summary.remaining)}</p>
                <span className="muted">
                  trên {formatVnd(summary.original)} · đã xử lý {formatVnd(summary.paid)}
                </span>
                <div className="progress">
                  <span style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
                <span className="muted">
                  {progress}% hoàn thành
                  {debt.dueOn
                    ? ` · hạn ${dateInputValue(debt.dueOn).split('-').reverse().join('/')}`
                    : ''}
                </span>

                {!isSettled ? (
                  <details className="form-reveal" style={{ marginTop: 16 }}>
                    <summary>Ghi thanh toán</summary>
                    <form action={recordDebtPaymentAction} className="form-card">
                      <input type="hidden" name="debtId" value={debt.id} />
                      <div className="form-grid">
                        <div className="field">
                          <label htmlFor={`payment-amount-${debt.id}`}>Số tiền</label>
                          <MoneyInput id={`payment-amount-${debt.id}`} name="amount" required />
                        </div>
                        <div className="field">
                          <label>Ngày</label>
                          <input
                            name="paidOn"
                            type="date"
                            defaultValue={dateInputValue(new Date())}
                            required
                          />
                        </div>
                        <div className="field full">
                          <label>Phương thức</label>
                          <select name="paymentMethodId" defaultValue="">
                            <option value="">Không chọn</option>
                            {methods.map((method) => (
                              <option key={method.id} value={method.id}>
                                {method.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field full">
                          <label>Ghi chú</label>
                          <input name="note" maxLength={300} />
                        </div>
                      </div>
                      <div className="form-actions">
                        <SubmitButton>Ghi thanh toán</SubmitButton>
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
              <strong>Chưa có khoản nợ nào</strong>
              <span>Thêm khoản cần trả hoặc khoản cần thu để theo dõi rõ ràng hơn.</span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
