import { setRegistrationAction, toggleUserLockAction } from '@/actions/admin';
import { DeleteUserForm } from '@/components/delete-user-form';
import { requireAdmin } from '@/lib/auth';
import { dateInputValue } from '@/lib/date';
import { db } from '@/lib/db';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
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
          <h1>Quản trị</h1>
          <p className="muted">Quản lý đăng ký và quyền truy cập tài khoản một cách an toàn.</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <section className="section-grid">
        <article className="card admin-status-card">
          <span className={`badge ${registrationOpen ? 'success' : 'danger'}`}>
            {registrationOpen ? 'Đang mở đăng ký' : 'Đang tạm đóng đăng ký'}
          </span>
          <h2>
            {registrationOpen
              ? 'Người dùng mới có thể đăng ký'
              : 'Chỉ tài khoản hiện có được đăng nhập'}
          </h2>
          <p className="muted">
            Thay đổi này có hiệu lực ngay với trang đăng ký, không ảnh hưởng dữ liệu người dùng hiện
            có.
          </p>
          <form action={setRegistrationAction} className="form-actions">
            <input type="hidden" name="registrationOpen" value={String(!registrationOpen)} />
            <button className="button" type="submit">
              {registrationOpen ? 'Tạm đóng đăng ký' : 'Mở đăng ký'}
            </button>
          </form>
        </article>

        <article className="card admin-status-card">
          <span className="badge">Tài khoản</span>
          <h2>{users.length} người dùng</h2>
          <p className="muted">
            Tài khoản quản trị được bảo vệ khỏi khóa hoặc xóa ở giao diện này. Mật khẩu không bao
            giờ hiển thị.
          </p>
        </article>
      </section>

      <section className="table-card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h2>Người dùng</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table admin-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Tham gia</th>
                <th>Đăng nhập gần nhất</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isAdmin = user.role === 'ADMIN';
                const locked = user.isLocked || user.status !== 'ACTIVE';

                return (
                  <tr key={user.id}>
                    <td>
                      <span className="cell-title">{user.displayName || 'Chưa đặt tên'}</span>
                      <span className="cell-note">{isAdmin ? 'Quản trị viên' : 'Người dùng'}</span>
                    </td>
                    <td>
                      <span className="cell-title">{user.email}</span>
                      <span className="cell-note">{user.phone}</span>
                    </td>
                    <td>
                      <span className={`badge ${locked ? 'danger' : 'success'}`}>
                        {locked ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td>{dateInputValue(user.createdAt).split('-').reverse().join('/')}</td>
                    <td>
                      {user.lastLoginAt
                        ? dateInputValue(user.lastLoginAt).split('-').reverse().join('/')
                        : 'Chưa có'}
                    </td>
                    <td>
                      {!isAdmin ? (
                        <div className="admin-actions">
                          <form action={toggleUserLockAction} className="inline-form">
                            <input type="hidden" name="id" value={user.id} />
                            <button className="button-ghost" type="submit">
                              {locked ? 'Mở khóa' : 'Khóa'}
                            </button>
                          </form>
                          <DeleteUserForm userId={user.id} email={user.email} />
                        </div>
                      ) : (
                        <span className="muted">Được bảo vệ</span>
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
