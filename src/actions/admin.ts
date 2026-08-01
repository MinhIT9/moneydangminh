'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { registrationSettingTag } from '@/lib/app-settings';
import { db } from '@/lib/db';
import { formText } from '@/lib/validation';

const registrationSettingKey = 'registration_open';

function redirectWithError(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

function refreshAdmin() {
  revalidatePath('/admin');
  revalidatePath('/register');
}

export async function setRegistrationAction(formData: FormData) {
  await requireAdmin();
  const registrationOpen = formText(formData.get('registrationOpen')) === 'true';

  await db.appSetting.upsert({
    where: { key: registrationSettingKey },
    create: { key: registrationSettingKey, value: String(registrationOpen) },
    update: { value: String(registrationOpen) },
  });
  updateTag(registrationSettingTag);
  refreshAdmin();
  redirect('/admin');
}

export async function toggleUserLockAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = formText(formData.get('id'));
  if (!id || id === admin.id) redirectWithError('Không thể thay đổi quyền truy cập của chính bạn.');

  const target = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true, status: true, isLocked: true },
  });
  if (!target) redirectWithError('Không tìm thấy tài khoản.');
  if (target.role === 'ADMIN') redirectWithError('Không thể khóa tài khoản quản trị.');

  const locked = target.isLocked || target.status !== 'ACTIVE';
  await db.user.update({
    where: { id: target.id },
    data: locked ? { isLocked: false, status: 'ACTIVE' } : { isLocked: true },
  });
  refreshAdmin();
  redirect('/admin');
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = formText(formData.get('id'));
  if (!id || id === admin.id) redirectWithError('Không thể xóa chính bạn.');
  if (formText(formData.get('confirm')) !== 'true') {
    redirectWithError('Hãy xác nhận trước khi xóa tài khoản.');
  }

  const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) redirectWithError('Không tìm thấy tài khoản.');
  if (target.role === 'ADMIN') redirectWithError('Không thể xóa tài khoản quản trị.');

  await db.user.delete({ where: { id: target.id } });
  refreshAdmin();
  redirect('/admin');
}
