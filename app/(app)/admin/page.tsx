import { setRegistrationAction, toggleUserLockAction } from '@/actions/admin';
import { DeleteUserForm } from '@/components/delete-user-form';
import { requireAdmin } from '@/lib/auth';
import { dateInputValue } from '@/lib/date';
import { db } from '@/lib/db';
import { getTranslations } from '@/i18n/server';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { t } = await getTranslations();
  const { error } = await searchParams;
  const [registrationSetting, users] = await Promise.all([
    db.appSetting.findUnique({ where: { key: 'registration_open' } }),
    db.user.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isLocked: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  const registrationOpen = registrationSetting?.value !== 'false';

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{t('admin.title')}</h1>
          <p className="muted">{t('admin.description')}</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <section className="section-grid">
        <article className="card admin-status-card">
          <span className={`badge ${registrationOpen ? 'success' : 'danger'}`}>
            {registrationOpen ? t('admin.registrationOpen') : t('admin.registrationClosed')}
          </span>
          <h2>
            {registrationOpen
              ? t('admin.registrationOpenDescription')
              : t('admin.registrationClosedDescription')}
          </h2>
          <p className="muted">{t('admin.registrationNotice')}</p>
          <form action={setRegistrationAction} className="form-actions">
            <input type="hidden" name="registrationOpen" value={String(!registrationOpen)} />
            <button className="button" type="submit">
              {registrationOpen ? t('admin.closeRegistration') : t('admin.openRegistration')}
            </button>
          </form>
        </article>

        <article className="card admin-status-card">
          <span className="badge">{t('admin.accounts')}</span>
          <h2>{t('admin.users', { count: users.length })}</h2>
          <p className="muted">{t('admin.usersDescription')}</p>
        </article>
      </section>

      <section className="table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2>{t('admin.userTable')}</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table admin-table">
            <thead>
              <tr>
                <th>{t('admin.account')}</th>
                <th>{t('admin.contact')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.joined')}</th>
                <th>{t('admin.lastLogin')}</th>
                <th aria-label={t('common.actions')} />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isAdmin = user.role === 'ADMIN';
                const locked = user.isLocked || user.status !== 'ACTIVE';

                return (
                  <tr key={user.id}>
                    <td>
                      <span className="cell-title">{user.displayName || t('admin.unnamed')}</span>
                      <span className="cell-note">
                        {isAdmin ? t('admin.administrator') : t('admin.user')}
                      </span>
                    </td>
                    <td>
                      <span className="cell-title">{user.email}</span>
                      <span className="cell-note">{user.phone}</span>
                    </td>
                    <td>
                      <span className={`badge ${locked ? 'danger' : 'success'}`}>
                        {locked ? t('admin.locked') : t('admin.active')}
                      </span>
                    </td>
                    <td>{dateInputValue(user.createdAt).split('-').reverse().join('/')}</td>
                    <td>
                      {user.lastLoginAt
                        ? dateInputValue(user.lastLoginAt).split('-').reverse().join('/')
                        : t('admin.never')}
                    </td>
                    <td>
                      {!isAdmin ? (
                        <div className="admin-actions">
                          <form action={toggleUserLockAction} className="inline-form">
                            <input type="hidden" name="id" value={user.id} />
                            <button className="button-ghost" type="submit">
                              {locked ? t('admin.unlock') : t('admin.lock')}
                            </button>
                          </form>
                          <DeleteUserForm userId={user.id} email={user.email} />
                        </div>
                      ) : (
                        <span className="muted">{t('admin.protected')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
