function zonedDateParts(value: Date, includeDay: boolean) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    ...(includeDay ? { day: '2-digit' } : {}),
  }).formatToParts(value);

  return parts.reduce<Record<string, string>>((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
}

export function dateInputValue(value: Date | null | undefined) {
  if (!value) return '';
  const parts = zonedDateParts(value, true);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthInputValue(value = new Date()) {
  const parts = zonedDateParts(value, false);
  return `${parts.year}-${parts.month}`;
}

export function parseDate(value: FormDataEntryValue | null, field = 'Ngày') {
  const raw = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error(`${field} không hợp lệ.`);

  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    year < 1 ||
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${field} không hợp lệ.`);
  }
  if (Number.isNaN(date.getTime())) throw new Error(`${field} không hợp lệ.`);
  return date;
}

export function parseOptionalDate(value: FormDataEntryValue | null, field = 'Ngày') {
  const raw = String(value ?? '');
  return raw ? parseDate(raw, field) : null;
}
