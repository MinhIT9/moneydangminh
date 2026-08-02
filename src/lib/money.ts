const MAX_VND_AMOUNT = 999_999_999_999_999;
const amountTermPattern = /^\d(?:[\d.,\s]*\d)?$/;

export type VndExpression = {
  expression: string;
  amount: number;
};

export function formatVnd(value: number | string | { toString(): string }) {
  const amount = Number(value.toString());
  return `${new Intl.NumberFormat('vi-VN').format(Number.isFinite(amount) ? amount : 0)} đ`;
}

function ensureVndAmount(amount: number, field: string) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_VND_AMOUNT) {
    throw new Error(`${field} phải là số tiền lớn hơn 0.`);
  }

  return amount;
}

export function parseVnd(value: FormDataEntryValue | null, field = 'Số tiền') {
  const normalized = String(value ?? '').replace(/[^0-9]/g, '');
  return ensureVndAmount(Number(normalized), field);
}

/**
 * Parses a VND addition expression without evaluating arbitrary JavaScript.
 *
 * Examples: "10000+20000", "10.000 + 20,000".
 * The returned expression is the original, trimmed text so it can be saved as
 * a useful record of how the amount was entered.
 */
export function parseVndExpression(
  value: FormDataEntryValue | null,
  field = 'Số tiền',
): VndExpression {
  const expression = String(value ?? '').trim();

  if (!expression) {
    throw new Error(`${field} phải là số tiền lớn hơn 0.`);
  }

  if (expression.length > 500) {
    throw new Error(`${field} tối đa 500 ký tự.`);
  }

  const terms = expression.split('+').map((term) => term.trim());
  if (terms.some((term) => !amountTermPattern.test(term))) {
    throw new Error(`${field} chỉ hỗ trợ các số dương, ngăn cách bằng dấu +.`);
  }

  const amount = terms.reduce((total, term) => {
    const termAmount = ensureVndAmount(Number(term.replace(/[^0-9]/g, '')), field);

    const nextTotal = total + termAmount;

    if (!Number.isSafeInteger(nextTotal) || nextTotal > MAX_VND_AMOUNT) {
      throw new Error(`${field} vượt quá giới hạn cho phép.`);
    }

    return nextTotal;
  }, 0);

  return { expression, amount };
}

export function parseOptionalVndExpression(value: FormDataEntryValue | null, field = 'Tiền tip') {
  const expression = String(value ?? '').trim();
  return expression ? parseVndExpression(expression, field) : null;
}

export function sumVndAmounts(amounts: number[], field = 'Tổng số tiền') {
  const total = amounts.reduce((sum, amount) => sum + amount, 0);

  if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_VND_AMOUNT) {
    throw new Error(`${field} vượt quá giới hạn cho phép.`);
  }

  return total;
}

export function parseOptionalVnd(value: FormDataEntryValue | null, field = 'Số tiền') {
  const raw = String(value ?? '').trim();
  return raw ? parseVnd(raw, field) : null;
}
