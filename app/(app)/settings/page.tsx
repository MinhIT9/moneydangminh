import { changePasswordAction } from '@/actions/auth';
import { updateProfileAction } from '@/actions/finance';
import { SubmitButton } from '@/components/submit-button';
import { requireUser } from '@/lib/auth';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Cài đặt</h1>
          <p className="muted">Quản lý thông tin hiển thị và bảo mật tài khoản của bạn.</p>
        </div>
      </header>
      {error ? <p className="notice">{error}</p> : null}

      <section className="section-grid">
        <form action={updateProfileAction} className="form-card">
          <h2>Thông tin cá nhân</h2>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="displayName">Tên hiển thị</label>
              <input
                id="displayName"
                name="displayName"
                defaultValue={user.displayName}
                maxLength={100}
                required
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={user.email} readOnly aria-readonly="true" />
            </div>
            <div className="field">
              <label>Số điện thoại</label>
              <input value={user.phone} readOnly aria-readonly="true" />
            </div>
          </div>
          <div className="form-actions">
            <SubmitButton>Lưu thay đổi</SubmitButton>
          </div>
        </form>

        <form action={changePasswordAction} className="form-card">
          <h2>Đổi mật khẩu</h2>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="passwordConfirmation">Nhập lại mật khẩu</label>
              <input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <SubmitButton pendingText="Đang đổi mật khẩu…">Đổi mật khẩu</SubmitButton>
          </div>
        </form>
      </section>
    </>
  );
}
