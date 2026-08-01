import {
  archivePaymentMethodAction,
  createCategoryAction,
  createPaymentMethodAction,
  restorePaymentMethodAction,
  updateCategoryAction,
  updatePaymentMethodAction,
} from '@/actions/finance';
import { DeleteCategoryForm } from '@/components/delete-category-form';
import { SubmitButton } from '@/components/submit-button';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTranslations } from '@/i18n/server';
import type { MessageKey, TranslationValues } from '@/i18n/messages';

type Translate = (key: MessageKey, values?: TranslationValues) => string;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { t } = await getTranslations();
  const { error } = await searchParams;
  const [categories, methods, archivedMethods] = await Promise.all([
    db.category.findMany({
      where: { userId: user.id, isArchived: false },
      include: { _count: { select: { transactions: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }),
    db.paymentMethod.findMany({
      where: { userId: user.id, isArchived: false },
      include: { _count: { select: { transactions: true } } },
      orderBy: { name: 'asc' },
    }),
    db.paymentMethod.findMany({
      where: { userId: user.id, isArchived: true },
      include: { _count: { select: { transactions: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);
  const income = categories.filter((category) => category.type === 'INCOME');
  const expense = categories.filter((category) => category.type === 'EXPENSE');

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t('category.title')}</h1>
          <p className="muted">{t('category.description')}</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <section className="section-grid">
        <details className="form-reveal" open={Boolean(error)}>
          <summary>{t('category.addCategory')}</summary>
          <form action={createCategoryAction} className="form-card">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="category-name">{t('category.categoryName')}</label>
                <input
                  id="category-name"
                  name="name"
                  maxLength={100}
                  placeholder={t('category.nameExample')}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="category-type">{t('category.type')}</label>
                <select id="category-type" name="type" defaultValue="EXPENSE">
                  <option value="INCOME">{t('category.incomeSource')}</option>
                  <option value="EXPENSE">{t('category.expenseCategory')}</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <SubmitButton>{t('category.addCategory')}</SubmitButton>
            </div>
          </form>
        </details>

        <details className="form-reveal">
          <summary>{t('category.addMethod')}</summary>
          <form action={createPaymentMethodAction} className="form-card">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="method-name">{t('category.methodName')}</label>
                <input
                  id="method-name"
                  name="name"
                  maxLength={100}
                  placeholder={t('category.methodExample')}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="method-type">{t('category.type')}</label>
                <select id="method-type" name="type" defaultValue="EWALLET">
                  <option value="CASH">{t('category.cash')}</option>
                  <option value="BANK">{t('category.bank')}</option>
                  <option value="EWALLET">{t('category.ewallet')}</option>
                  <option value="CARD">{t('category.card')}</option>
                  <option value="OTHER">{t('category.other')}</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <SubmitButton>{t('category.addMethod')}</SubmitButton>
            </div>
          </form>
        </details>
      </section>

      <section className="section-grid">
        <article className="card">
          <div className="card-header">
            <h2>{t('category.incomeSources', { count: income.length })}</h2>
          </div>
          <CategoryList categories={income} t={t} />
        </article>
        <article className="card">
          <div className="card-header">
            <h2>{t('category.expenseCategories', { count: expense.length })}</h2>
          </div>
          <CategoryList categories={expense} t={t} />
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2>{t('category.paymentMethods', { count: methods.length })}</h2>
        </div>
        <div className="list-stack">
          {methods.length ? (
            methods.map((method) => (
              <div className="list-row" key={method.id}>
                <div>
                  <strong>{method.name}</strong>
                  <span>
                    {t('category.transactionsRecorded', { count: method._count.transactions })} ·{' '}
                    {methodTypeLabel(method.type, t)}
                  </span>
                </div>
                <PaymentMethodActions method={method} t={t} />
              </div>
            ))
          ) : (
            <p className="muted">{t('category.noMethods')}</p>
          )}
        </div>
      </section>

      {archivedMethods.length ? (
        <details className="card archived-list" style={{ marginTop: 16 }}>
          <summary>{t('category.archivedMethods', { count: archivedMethods.length })}</summary>
          <div className="list-stack">
            {archivedMethods.map((method) => (
              <div className="list-row" key={method.id}>
                <div>
                  <strong>{method.name}</strong>
                  <span>
                    {t('category.transactionsRecorded', { count: method._count.transactions })} ·{' '}
                    {methodTypeLabel(method.type, t)}
                  </span>
                </div>
                <form action={restorePaymentMethodAction}>
                  <input type="hidden" name="id" value={method.id} />
                  <button className="button-ghost" type="submit">
                    {t('common.restore')}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

function CategoryList({
  categories,
  t,
}: {
  categories: Array<{ id: string; name: string; _count: { transactions: number } }>;
  t: Translate;
}) {
  return (
    <div className="list-stack">
      {categories.length ? (
        categories.map((category) => (
          <div className="list-row" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <span>{t('category.transactions', { count: category._count.transactions })}</span>
            </div>
            <div className="list-actions">
              <details className="inline-editor">
                <summary>{t('common.edit')}</summary>
                <form action={updateCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <label className="sr-only" htmlFor={`category-name-${category.id}`}>
                    {t('category.categoryName')}
                  </label>
                  <input
                    id={`category-name-${category.id}`}
                    name="name"
                    defaultValue={category.name}
                    maxLength={100}
                    required
                  />
                  <SubmitButton className="button-ghost">{t('common.save')}</SubmitButton>
                </form>
              </details>
              <DeleteCategoryForm
                categoryId={category.id}
                transactionCount={category._count.transactions}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="muted">{t('category.noCategories')}</p>
      )}
    </div>
  );
}

function PaymentMethodActions({
  method,
  t,
}: {
  method: { id: string; name: string; type: string };
  t: Translate;
}) {
  return (
    <div className="list-actions">
      <details className="inline-editor">
        <summary>{t('common.edit')}</summary>
        <form action={updatePaymentMethodAction}>
          <input type="hidden" name="id" value={method.id} />
          <label className="sr-only" htmlFor={`method-name-${method.id}`}>
            {t('category.methodName')}
          </label>
          <input
            id={`method-name-${method.id}`}
            name="name"
            defaultValue={method.name}
            maxLength={100}
            required
          />
          <label className="sr-only" htmlFor={`method-type-${method.id}`}>
            {t('category.methodType')}
          </label>
          <select id={`method-type-${method.id}`} name="type" defaultValue={method.type}>
            <option value="CASH">{t('category.cash')}</option>
            <option value="BANK">{t('category.bank')}</option>
            <option value="EWALLET">{t('category.ewallet')}</option>
            <option value="CARD">{t('category.card')}</option>
            <option value="OTHER">{t('category.other')}</option>
          </select>
          <SubmitButton className="button-ghost">{t('common.save')}</SubmitButton>
        </form>
      </details>
      <form action={archivePaymentMethodAction}>
        <input type="hidden" name="id" value={method.id} />
        <button className="button-ghost" type="submit">
          {t('common.hide')}
        </button>
      </form>
    </div>
  );
}

function methodTypeLabel(type: string, t: Translate) {
  const labels: Record<string, string> = {
    CASH: t('category.cash'),
    BANK: t('category.bank'),
    EWALLET: t('category.ewallet'),
    CARD: t('category.card'),
    OTHER: t('category.other'),
  };

  return labels[type] ?? type;
}
