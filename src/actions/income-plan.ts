'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getMonthRange } from '@/lib/finance';
import { incomeForecastMethods, type IncomeForecastMethod } from '@/lib/income-plan-calculator';
import { db } from '@/lib/db';
import { formText } from '@/lib/validation';

const maxVnd = 999_999_999_999_999;

function parseNonNegativeMoney(value: FormDataEntryValue | null, field: string) {
  const raw = formText(value);
  if (!raw) return 0;
  const amount = Number(raw.replace(/[^0-9]/g, ''));

  if (!Number.isSafeInteger(amount) || amount < 0 || amount > maxVnd) {
    throw new Error(`${field} không hợp lệ.`);
  }

  return amount;
}

function planPath(month: string, query: string) {
  return `/income-plan?month=${encodeURIComponent(month)}&${query}`;
}

export async function saveIncomePlanAction(formData: FormData) {
  const user = await requireUser();
  const { start: monthDate, value: month } = getMonthRange(formText(formData.get('month')));

  try {
    const workdaysPerWeek = Number(formText(formData.get('workdaysPerWeek')));
    if (!Number.isInteger(workdaysPerWeek) || workdaysPerWeek < 1 || workdaysPerWeek > 7) {
      throw new Error('Số ngày kiếm tiền mỗi tuần phải từ 1 đến 7.');
    }

    const rawMethod = formText(formData.get('forecastMethod'));
    if (!incomeForecastMethods.includes(rawMethod as IncomeForecastMethod)) {
      throw new Error('Cách dự báo chi tiêu không hợp lệ.');
    }
    const forecastMethod = rawMethod as IncomeForecastMethod;
    const manualMonthlyExpense = parseNonNegativeMoney(
      formData.get('manualMonthlyExpense'),
      'Ngân sách chi thủ công',
    );

    if (forecastMethod === 'MANUAL' && manualMonthlyExpense <= 0) {
      throw new Error('Hãy nhập ngân sách chi tháng khi chọn cách tự đặt.');
    }

    const data = {
      targetSurplus: parseNonNegativeMoney(formData.get('targetSurplus'), 'Vùng đệm'),
      workdaysPerWeek,
      extraExpectedExpense: parseNonNegativeMoney(
        formData.get('extraExpectedExpense'),
        'Chi dự kiến thêm',
      ),
      includeDueDebts: formData.get('includeDueDebts') === 'on',
      forecastMethod,
      manualMonthlyExpense: forecastMethod === 'MANUAL' ? manualMonthlyExpense : null,
    };

    await db.incomePlan.upsert({
      where: { userId_month: { userId: user.id, month: monthDate } },
      create: { userId: user.id, month: monthDate, ...data },
      update: data,
    });
  } catch (error) {
    redirect(
      planPath(
        month,
        `error=${encodeURIComponent(error instanceof Error ? error.message : 'Không thể lưu kế hoạch.')}`,
      ),
    );
  }

  revalidatePath('/income-plan');
  revalidatePath('/dashboard');
  redirect(planPath(month, 'saved=1'));
}
