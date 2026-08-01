import { z } from 'zod';

export const emailSchema = z.email('Email không hợp lệ.').trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự.')
  .max(128, 'Mật khẩu quá dài.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^0[35789][0-9]{8}$/, 'Số điện thoại Việt Nam không hợp lệ.');

export const textSchema = (label: string, max = 300, required = true) =>
  z
    .string()
    .trim()
    .max(max, `${label} tối đa ${max} ký tự.`)
    .refine((value) => !required || value.length > 0, `${label} không được để trống.`);

export function formText(value: FormDataEntryValue | null) {
  return String(value ?? '').trim();
}
