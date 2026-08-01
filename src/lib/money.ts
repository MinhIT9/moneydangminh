export function formatVnd(value: number | string | { toString(): string }) {
  const amount = Number(value.toString());
  return `${new Intl.NumberFormat('vi-VN').format(Number.isFinite(amount) ? amount : 0)} đ`;
}

export function parseVnd(value: FormDataEntryValue | null, field = 'Số tiền') {
  const normalized = String(value ?? '').replace(/[^0-9]/g, '');
  const amount = Number(normalized);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(`${field} phải là số tiền lớn hơn 0.`);
  }

  return amount;
}

export function parseOptionalVnd(value: FormDataEntryValue | null, field = 'Số tiền') {
  const raw = String(value ?? '').trim();
  return raw ? parseVnd(raw, field) : null;
}
