'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { createSession, destroySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { emailSchema, formText, passwordSchema, phoneSchema } from '@/lib/validation';

function redirectWithError(path: '/login' | '/register', message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function registerAction(formData: FormData) {
  const registrationSetting = await db.appSetting.findUnique({
    where: { key: 'registration_open' },
  });
  if (registrationSetting?.value === 'false') {
    redirectWithError('/register', 'Đăng ký tài khoản hiện đang tạm đóng.');
  }

  const emailResult = emailSchema.safeParse(formText(formData.get('email')));
  const phoneResult = phoneSchema.safeParse(formText(formData.get('phone')));
  const passwordResult = passwordSchema.safeParse(formData.get('password'));
  const confirmation = String(formData.get('passwordConfirmation') ?? '');

  if (!emailResult.success) redirectWithError('/register', emailResult.error.issues[0].message);
  if (!phoneResult.success) redirectWithError('/register', phoneResult.error.issues[0].message);
  if (!passwordResult.success)
    redirectWithError('/register', passwordResult.error.issues[0].message);
  if (passwordResult.data !== confirmation) {
    redirectWithError('/register', 'Nhập lại mật khẩu chưa khớp.');
  }

  const [existing, existingPhone] = await Promise.all([
    db.user.findUnique({ where: { email: emailResult.data } }),
    db.user.findUnique({ where: { phone: phoneResult.data } }),
  ]);
  if (existingPhone) {
    redirectWithError('/register', 'Số điện thoại này đã được đăng ký.');
  }
  if (existing) redirectWithError('/register', 'Email này đã được đăng ký.');

  const passwordHash = await bcrypt.hash(passwordResult.data, 12);
  let user: { id: string };
  try {
    user = await db.user.create({
      data: {
        email: emailResult.data,
        phone: phoneResult.data,
        passwordHash,
        displayName: emailResult.data.split('@')[0],
        categories: {
          create: [
            { name: 'Lương', type: 'INCOME', sortOrder: 10 },
            { name: 'Làm thêm', type: 'INCOME', sortOrder: 20 },
            { name: 'Ăn uống', type: 'EXPENSE', sortOrder: 10 },
            { name: 'Di chuyển', type: 'EXPENSE', sortOrder: 20 },
            { name: 'Sinh hoạt', type: 'EXPENSE', sortOrder: 30 },
          ],
        },
        paymentMethods: {
          create: [
            { name: 'Tiền mặt', type: 'CASH', sortOrder: 10 },
            { name: 'Chuyển khoản', type: 'BANK', sortOrder: 20 },
            { name: 'Ví điện tử', type: 'EWALLET', sortOrder: 30 },
          ],
        },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWithError('/register', 'Email hoặc số điện thoại đã được đăng ký.');
    }
    throw error;
  }

  await createSession(user.id);
  redirect('/dashboard');
}

export async function loginAction(formData: FormData) {
  const emailResult = emailSchema.safeParse(formText(formData.get('email')));
  const password = String(formData.get('password') ?? '');

  if (!emailResult.success || !password) {
    redirectWithError('/login', 'Email hoặc mật khẩu không đúng.');
  }

  const user = await db.user.findUnique({ where: { email: emailResult.data } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirectWithError('/login', 'Email hoặc mật khẩu không đúng.');
  }

  if (user.status !== 'ACTIVE' || user.isLocked) {
    redirectWithError('/login', 'Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ hỗ trợ.');
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

export async function changePasswordAction(formData: FormData) {
  const { requireUser } = await import('@/lib/auth');
  const user = await requireUser();
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const nextPasswordResult = passwordSchema.safeParse(formData.get('newPassword'));
  const confirmation = String(formData.get('passwordConfirmation') ?? '');

  if (!nextPasswordResult.success) {
    redirect(`/settings?error=${encodeURIComponent(nextPasswordResult.error.issues[0].message)}`);
  }
  if (nextPasswordResult.data !== confirmation) {
    redirect('/settings?error=Nhập lại mật khẩu chưa khớp.');
  }
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    redirect('/settings?error=Mật khẩu hiện tại không đúng.');
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(nextPasswordResult.data, 12) },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  redirect('/settings');
}
