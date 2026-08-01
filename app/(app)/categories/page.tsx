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

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
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
          <h1>Danh mục &amp; phương thức</h1>
          <p className="muted">Tùy chỉnh cách bạn phân loại để xem lại dễ hơn.</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <section className="section-grid">
        <details className="form-reveal" open={Boolean(error)}>
          <summary>＋ Thêm danh mục</summary>
          <form action={createCategoryAction} className="form-card">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="category-name">Tên danh mục</label>
                <input
                  id="category-name"
                  name="name"
                  maxLength={100}
                  placeholder="Ví dụ: Đi chợ"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="category-type">Loại</label>
                <select id="category-type" name="type" defaultValue="EXPENSE">
                  <option value="INCOME">Nguồn thu</option>
                  <option value="EXPENSE">Danh mục chi</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <SubmitButton>Thêm danh mục</SubmitButton>
            </div>
          </form>
        </details>

        <details className="form-reveal">
          <summary>＋ Thêm phương thức</summary>
          <form action={createPaymentMethodAction} className="form-card">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="method-name">Tên phương thức</label>
                <input
                  id="method-name"
                  name="name"
                  maxLength={100}
                  placeholder="Ví dụ: MoMo"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="method-type">Loại</label>
                <select id="method-type" name="type" defaultValue="EWALLET">
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK">Ngân hàng</option>
                  <option value="EWALLET">Ví điện tử</option>
                  <option value="CARD">Thẻ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <SubmitButton>Thêm phương thức</SubmitButton>
            </div>
          </form>
        </details>
      </section>

      <section className="section-grid">
        <article className="card">
          <div className="card-header">
            <h2>Nguồn thu ({income.length})</h2>
          </div>
          <CategoryList categories={income} />
        </article>
        <article className="card">
          <div className="card-header">
            <h2>Danh mục chi ({expense.length})</h2>
          </div>
          <CategoryList categories={expense} />
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2>Phương thức thanh toán ({methods.length})</h2>
        </div>
        <div className="list-stack">
          {methods.length ? (
            methods.map((method) => (
              <div className="list-row" key={method.id}>
                <div>
                  <strong>{method.name}</strong>
                  <span>
                    {method._count.transactions} giao dịch đã ghi · {methodTypeLabel(method.type)}
                  </span>
                </div>
                <PaymentMethodActions method={method} />
              </div>
            ))
          ) : (
            <p className="muted">Chưa có phương thức nào.</p>
          )}
        </div>
      </section>

      {archivedMethods.length ? (
        <details className="card archived-list" style={{ marginTop: 16 }}>
          <summary>Phương thức đã ẩn ({archivedMethods.length})</summary>
          <div className="list-stack">
            {archivedMethods.map((method) => (
              <div className="list-row" key={method.id}>
                <div>
                  <strong>{method.name}</strong>
                  <span>
                    {method._count.transactions} giao dịch đã ghi · {methodTypeLabel(method.type)}
                  </span>
                </div>
                <form action={restorePaymentMethodAction}>
                  <input type="hidden" name="id" value={method.id} />
                  <button className="button-ghost" type="submit">
                    Hiện lại
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
}: {
  categories: Array<{ id: string; name: string; _count: { transactions: number } }>;
}) {
  return (
    <div className="list-stack">
      {categories.length ? (
        categories.map((category) => (
          <div className="list-row" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <span>{category._count.transactions} giao dịch</span>
            </div>
            <div className="list-actions">
              <details className="inline-editor">
                <summary>Sửa</summary>
                <form action={updateCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <label className="sr-only" htmlFor={`category-name-${category.id}`}>
                    Tên danh mục
                  </label>
                  <input
                    id={`category-name-${category.id}`}
                    name="name"
                    defaultValue={category.name}
                    maxLength={100}
                    required
                  />
                  <SubmitButton className="button-ghost" pendingText="Đang lưu…">
                    Lưu
                  </SubmitButton>
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
        <p className="muted">Chưa có danh mục nào.</p>
      )}
    </div>
  );
}

function PaymentMethodActions({ method }: { method: { id: string; name: string; type: string } }) {
  return (
    <div className="list-actions">
      <details className="inline-editor">
        <summary>Sửa</summary>
        <form action={updatePaymentMethodAction}>
          <input type="hidden" name="id" value={method.id} />
          <label className="sr-only" htmlFor={`method-name-${method.id}`}>
            Tên phương thức
          </label>
          <input
            id={`method-name-${method.id}`}
            name="name"
            defaultValue={method.name}
            maxLength={100}
            required
          />
          <label className="sr-only" htmlFor={`method-type-${method.id}`}>
            Loại phương thức
          </label>
          <select id={`method-type-${method.id}`} name="type" defaultValue={method.type}>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK">Ngân hàng</option>
            <option value="EWALLET">Ví điện tử</option>
            <option value="CARD">Thẻ</option>
            <option value="OTHER">Khác</option>
          </select>
          <SubmitButton className="button-ghost" pendingText="Đang lưu…">
            Lưu
          </SubmitButton>
        </form>
      </details>
      <form action={archivePaymentMethodAction}>
        <input type="hidden" name="id" value={method.id} />
        <button className="button-ghost" type="submit">
          Ẩn
        </button>
      </form>
    </div>
  );
}

function methodTypeLabel(type: string) {
  const labels: Record<string, string> = {
    CASH: 'Tiền mặt',
    BANK: 'Ngân hàng',
    EWALLET: 'Ví điện tử',
    CARD: 'Thẻ',
    OTHER: 'Khác',
  };

  return labels[type] ?? type;
}
