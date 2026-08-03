'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { parseDate, parseOptionalDate } from '@/lib/date';
import {
  parseOptionalVndExpression,
  parseVnd,
  parseVndExpression,
  sumVndAmounts,
} from '@/lib/money';
import { db } from '@/lib/db';
import { formText, textSchema } from '@/lib/validation';

const appPaths = ['/dashboard', '/income-plan', '/transactions', '/categories', '/debts'];
const paymentMethodTypes = ['CASH', 'BANK', 'EWALLET', 'CARD', 'OTHER'] as const;

function isPaymentMethodType(value: string): value is (typeof paymentMethodTypes)[number] {
  return paymentMethodTypes.includes(value as (typeof paymentMethodTypes)[number]);
}

function refreshApp() {
  appPaths.forEach((path) => revalidatePath(path));
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`);
}

function transactionPath(month: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? `/transactions?month=${month}` : '/transactions';
}

function selectedId(value: FormDataEntryValue | null) {
  const id = formText(value);
  return id || null;
}

function transactionAmounts(formData: FormData) {
  // `amount` is retained as a fallback for older forms and debt-related flows.
  const baseExpression = parseVndExpression(
    formData.has('amountExpression') ? formData.get('amountExpression') : formData.get('amount'),
  );
  const tipExpression = parseOptionalVndExpression(formData.get('tipExpression'));
  const tipAmount = tipExpression?.amount ?? 0;

  return {
    amount: sumVndAmounts([baseExpression.amount, tipAmount]),
    amountExpression: baseExpression.expression,
    tipAmount,
    tipExpression: tipExpression?.expression ?? null,
  };
}

async function ensureCategory(userId: string, id: string | null, type: 'INCOME' | 'EXPENSE') {
  if (!id) return null;
  const category = await db.category.findFirst({ where: { id, userId, type, isArchived: false } });
  if (!category) throw new Error('Danh mục không hợp lệ.');
  return category.id;
}

async function ensurePaymentMethod(userId: string, id: string | null) {
  if (!id) return null;
  const method = await db.paymentMethod.findFirst({ where: { id, userId, isArchived: false } });
  if (!method) throw new Error('Phương thức thanh toán không hợp lệ.');
  return method.id;
}

export async function createTransactionAction(formData: FormData) {
  const user = await requireUser();
  const returnPath = transactionPath(formText(formData.get('month')));
  const rawType = formText(formData.get('type'));
  const type = rawType === 'INCOME' || rawType === 'EXPENSE' ? rawType : null;

  if (!type) redirectWithError(returnPath, 'Loại giao dịch không hợp lệ.');

  try {
    const categoryId = await ensureCategory(user.id, selectedId(formData.get('categoryId')), type);
    const paymentMethodId = await ensurePaymentMethod(
      user.id,
      selectedId(formData.get('paymentMethodId')),
    );
    const note = formText(formData.get('note'));
    const amounts = transactionAmounts(formData);

    await db.transaction.create({
      data: {
        userId: user.id,
        categoryId,
        paymentMethodId,
        type,
        ...amounts,
        note: note || null,
        occurredOn: parseDate(formData.get('occurredOn')),
      },
    });
  } catch (error) {
    redirectWithError(
      returnPath,
      error instanceof Error ? error.message : 'Không thể lưu giao dịch.',
    );
  }

  refreshApp();
  redirect(returnPath);
}

export async function deleteTransactionAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  if (!id) redirectWithError('/transactions', 'Không tìm thấy giao dịch.');

  const transaction = await db.transaction.findFirst({
    where: { id, userId: user.id },
    include: { debtPayment: true },
  });
  if (!transaction) redirectWithError('/transactions', 'Không tìm thấy giao dịch.');

  if (transaction.debtPayment && formText(formData.get('confirm')) !== 'true') {
    redirectWithError(
      '/transactions',
      'Đây là giao dịch được tạo từ một lần thanh toán nợ. Hãy xác nhận xoá để cập nhật lại khoản nợ.',
    );
  }

  await db.$transaction(async (tx) => {
    if (transaction.debtPayment) {
      const payment = await tx.debtPayment.findFirst({
        where: { id: transaction.debtPayment.id, userId: user.id },
      });

      if (payment) {
        await tx.debtPayment.delete({ where: { id: payment.id } });

        const [debt, remainingPayments] = await Promise.all([
          tx.debt.findFirst({ where: { id: payment.debtId, userId: user.id } }),
          tx.debtPayment.findMany({
            where: { debtId: payment.debtId, userId: user.id },
            select: { amount: true, isSettlement: true, paidOn: true },
          }),
        ]);

        if (debt) {
          const paid = remainingPayments.reduce((sum, item) => sum + Number(item.amount), 0);
          const settlementPayment = remainingPayments.find((item) => item.isSettlement);
          const settled = Boolean(settlementPayment) || paid >= Number(debt.originalAmount);
          const latestPaidOn = remainingPayments.reduce<Date | null>(
            (latest, item) => (!latest || item.paidOn > latest ? item.paidOn : latest),
            null,
          );
          await tx.debt.update({
            where: { id: debt.id },
            data: {
              status: settled ? 'SETTLED' : 'ACTIVE',
              settledOn: settled ? (settlementPayment?.paidOn ?? latestPaidOn) : null,
            },
          });
        }
      }
    }

    await tx.transaction.delete({ where: { id: transaction.id } });
  });
  refreshApp();
  redirect('/transactions');
}

export async function updateTransactionAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  const returnPath = transactionPath(formText(formData.get('month')));
  const rawType = formText(formData.get('type'));
  const type = rawType === 'INCOME' || rawType === 'EXPENSE' ? rawType : null;

  if (!id) redirectWithError(returnPath, 'Không tìm thấy giao dịch.');
  if (!type) redirectWithError(returnPath, 'Loại giao dịch không hợp lệ.');

  const transaction = await db.transaction.findFirst({
    where: { id, userId: user.id },
    include: { debtPayment: { select: { id: true } } },
  });
  if (!transaction) redirectWithError(returnPath, 'Không tìm thấy giao dịch.');
  if (transaction.debtPayment) {
    redirectWithError(
      returnPath,
      'Giao dịch thanh toán nợ không thể sửa trực tiếp để bảo toàn lịch sử khoản nợ.',
    );
  }

  try {
    const categoryId = await ensureCategory(user.id, selectedId(formData.get('categoryId')), type);
    const paymentMethodId = await ensurePaymentMethod(
      user.id,
      selectedId(formData.get('paymentMethodId')),
    );
    const note = formText(formData.get('note'));
    const amounts = transactionAmounts(formData);

    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        categoryId,
        paymentMethodId,
        type,
        ...amounts,
        note: note || null,
        occurredOn: parseDate(formData.get('occurredOn')),
      },
    });
  } catch (error) {
    redirectWithError(
      `${returnPath}${returnPath.includes('?') ? '&' : '?'}edit=${encodeURIComponent(id)}`,
      error instanceof Error ? error.message : 'Không thể cập nhật giao dịch.',
    );
  }

  refreshApp();
  redirect(returnPath);
}

export async function createCategoryAction(formData: FormData) {
  const user = await requireUser();
  const type = formText(formData.get('type'));
  const nameResult = textSchema('Tên danh mục', 100).safeParse(formText(formData.get('name')));

  if (!nameResult.success) redirectWithError('/categories', nameResult.error.issues[0].message);
  if (type !== 'INCOME' && type !== 'EXPENSE') {
    redirectWithError('/categories', 'Loại danh mục không hợp lệ.');
  }

  try {
    await db.category.create({ data: { userId: user.id, name: nameResult.data, type } });
  } catch {
    redirectWithError('/categories', 'Danh mục này đã tồn tại.');
  }

  refreshApp();
  redirect('/categories');
}

export async function updateCategoryAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  const nameResult = textSchema('Tên danh mục', 100).safeParse(formText(formData.get('name')));

  if (!id) redirectWithError('/categories', 'Không tìm thấy danh mục.');
  if (!nameResult.success) redirectWithError('/categories', nameResult.error.issues[0].message);

  const category = await db.category.findFirst({ where: { id, userId: user.id } });
  if (!category) redirectWithError('/categories', 'Không tìm thấy danh mục.');

  try {
    await db.category.update({ where: { id: category.id }, data: { name: nameResult.data } });
  } catch {
    redirectWithError('/categories', 'Danh mục cùng tên đã tồn tại.');
  }

  refreshApp();
  redirect('/categories');
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  if (!id) redirectWithError('/categories', 'Không tìm thấy danh mục.');

  const category = await db.category.findFirst({ where: { id, userId: user.id } });
  if (!category) redirectWithError('/categories', 'Không tìm thấy danh mục.');

  const transactionCount = await db.transaction.count({
    where: { userId: user.id, categoryId: id },
  });
  if (transactionCount > 0 && formText(formData.get('confirm')) !== 'true') {
    redirectWithError(
      '/categories',
      `Danh mục này đang có ${transactionCount} giao dịch. Hãy xác nhận xoá để chuyển chúng về Chưa phân loại.`,
    );
  }

  await db.$transaction([
    db.transaction.updateMany({
      where: { userId: user.id, categoryId: id },
      data: { categoryId: null },
    }),
    db.category.deleteMany({ where: { id, userId: user.id } }),
  ]);
  refreshApp();
  redirect('/categories');
}

export async function createPaymentMethodAction(formData: FormData) {
  const user = await requireUser();
  const nameResult = textSchema('Tên phương thức', 100).safeParse(formText(formData.get('name')));
  const type = formText(formData.get('type'));

  if (!nameResult.success) redirectWithError('/categories', nameResult.error.issues[0].message);
  if (!isPaymentMethodType(type))
    redirectWithError('/categories', 'Loại phương thức không hợp lệ.');

  try {
    await db.paymentMethod.create({
      data: { userId: user.id, name: nameResult.data, type },
    });
  } catch {
    redirectWithError('/categories', 'Phương thức này đã tồn tại.');
  }

  refreshApp();
  redirect('/categories');
}

export async function updatePaymentMethodAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  const nameResult = textSchema('Tên phương thức', 100).safeParse(formText(formData.get('name')));
  const type = formText(formData.get('type'));

  if (!id) redirectWithError('/categories', 'Không tìm thấy phương thức.');
  if (!nameResult.success) redirectWithError('/categories', nameResult.error.issues[0].message);
  if (!isPaymentMethodType(type)) {
    redirectWithError('/categories', 'Loại phương thức không hợp lệ.');
  }

  const method = await db.paymentMethod.findFirst({ where: { id, userId: user.id } });
  if (!method) redirectWithError('/categories', 'Không tìm thấy phương thức.');

  try {
    await db.paymentMethod.update({
      where: { id: method.id },
      data: { name: nameResult.data, type },
    });
  } catch {
    redirectWithError('/categories', 'Phương thức cùng tên đã tồn tại.');
  }

  refreshApp();
  redirect('/categories');
}

export async function archivePaymentMethodAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  if (!id) redirectWithError('/categories', 'Không tìm thấy phương thức.');

  await db.paymentMethod.updateMany({ where: { id, userId: user.id }, data: { isArchived: true } });
  refreshApp();
  redirect('/categories');
}

export async function restorePaymentMethodAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  if (!id) redirectWithError('/categories', 'Không tìm thấy phương thức.');

  await db.paymentMethod.updateMany({
    where: { id, userId: user.id },
    data: { isArchived: false },
  });
  refreshApp();
  redirect('/categories');
}

export async function createDebtAction(formData: FormData) {
  const user = await requireUser();
  const counterpartyResult = textSchema('Tên khoản nợ', 150).safeParse(
    formText(formData.get('counterparty')),
  );
  const direction = formText(formData.get('direction'));

  if (!counterpartyResult.success)
    redirectWithError('/debts', counterpartyResult.error.issues[0].message);
  if (direction !== 'I_OWE' && direction !== 'OWED_TO_ME') {
    redirectWithError('/debts', 'Hướng khoản nợ không hợp lệ.');
  }

  try {
    await db.debt.create({
      data: {
        userId: user.id,
        counterparty: counterpartyResult.data,
        direction,
        originalAmount: parseVnd(formData.get('originalAmount'), 'Tổng khoản nợ'),
        startedOn: parseDate(formData.get('startedOn'), 'Ngày bắt đầu'),
        dueOn: parseOptionalDate(formData.get('dueOn'), 'Ngày đến hạn'),
        note: formText(formData.get('note')) || null,
      },
    });
  } catch (error) {
    redirectWithError('/debts', error instanceof Error ? error.message : 'Không thể lưu khoản nợ.');
  }

  refreshApp();
  redirect('/debts');
}

export async function updateDebtAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  const counterpartyResult = textSchema('Tên khoản nợ', 150).safeParse(
    formText(formData.get('counterparty')),
  );
  const direction = formText(formData.get('direction'));

  if (!id) redirectWithError('/debts', 'Không tìm thấy khoản nợ.');
  if (!counterpartyResult.success) {
    redirectWithError('/debts', counterpartyResult.error.issues[0].message);
  }
  if (direction !== 'I_OWE' && direction !== 'OWED_TO_ME') {
    redirectWithError('/debts', 'Hướng khoản nợ không hợp lệ.');
  }

  try {
    const originalAmount = parseVnd(formData.get('originalAmount'), 'Tổng khoản nợ');
    const startedOn = parseDate(formData.get('startedOn'), 'Ngày bắt đầu');
    const dueOn = parseOptionalDate(formData.get('dueOn'), 'Ngày đến hạn');
    const note = formText(formData.get('note'));

    await db.$transaction(async (tx) => {
      const debt = await tx.debt.findFirst({
        where: { id, userId: user.id },
        include: {
          payments: {
            select: { amount: true, isSettlement: true, paidOn: true },
          },
        },
      });
      if (!debt) throw new Error('Không tìm thấy khoản nợ.');

      const paid = debt.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      if (originalAmount < paid) {
        throw new Error('Tổng khoản nợ không thể thấp hơn số tiền đã thanh toán.');
      }

      const settlementPayment = debt.payments.find((payment) => payment.isSettlement);
      const settled = Boolean(settlementPayment) || paid >= originalAmount;
      const latestPaidOn = debt.payments.reduce<Date | null>(
        (latest, payment) => (!latest || payment.paidOn > latest ? payment.paidOn : latest),
        null,
      );

      await tx.debt.update({
        where: { id: debt.id },
        data: {
          counterparty: counterpartyResult.data,
          direction,
          originalAmount,
          startedOn,
          dueOn,
          note: note || null,
          status: settled ? 'SETTLED' : 'ACTIVE',
          settledOn: settled ? (settlementPayment?.paidOn ?? latestPaidOn) : null,
        },
      });

      if (debt.direction !== direction) {
        await tx.transaction.updateMany({
          where: { userId: user.id, debtId: debt.id },
          data: { type: direction === 'I_OWE' ? 'EXPENSE' : 'INCOME' },
        });
      }
    });
  } catch (error) {
    redirectWithError(
      '/debts',
      error instanceof Error ? error.message : 'Không thể cập nhật khoản nợ.',
    );
  }

  refreshApp();
  redirect('/debts');
}

export async function recordDebtPaymentAction(formData: FormData) {
  const user = await requireUser();
  const debtId = formText(formData.get('debtId'));
  if (!debtId) redirectWithError('/debts', 'Không tìm thấy khoản nợ.');

  try {
    const amount = parseVnd(formData.get('amount'), 'Số tiền thanh toán');
    const paidOn = parseDate(formData.get('paidOn'), 'Ngày thanh toán');
    const paymentMethodId = await ensurePaymentMethod(
      user.id,
      selectedId(formData.get('paymentMethodId')),
    );
    const note = formText(formData.get('note'));

    await db.$transaction(async (tx) => {
      const debt = await tx.debt.findFirst({
        where: { id: debtId, userId: user.id, status: 'ACTIVE' },
        include: { payments: { select: { amount: true } } },
      });
      if (!debt) throw new Error('Khoản nợ không còn hoạt động.');

      const lockTimestamp = new Date(Math.max(Date.now(), debt.updatedAt.getTime() + 1));
      const reservation = await tx.debt.updateMany({
        where: { id: debt.id, userId: user.id, status: 'ACTIVE', updatedAt: debt.updatedAt },
        data: { updatedAt: lockTimestamp },
      });
      if (reservation.count !== 1) {
        throw new Error('Khoản nợ vừa được cập nhật. Vui lòng kiểm tra lại số tiền còn lại.');
      }

      const paid = debt.payments.reduce((total, payment) => total + Number(payment.amount), 0);
      const original = Number(debt.originalAmount);
      if (amount > original - paid) throw new Error('Số tiền thanh toán vượt quá khoản còn lại.');

      const settled = amount + paid === original;
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          debtId: debt.id,
          paymentMethodId,
          type: debt.direction === 'I_OWE' ? 'EXPENSE' : 'INCOME',
          amount,
          note: note || `Thanh toán khoản nợ: ${debt.counterparty}`,
          occurredOn: paidOn,
        },
      });

      await tx.debtPayment.create({
        data: {
          userId: user.id,
          debtId: debt.id,
          transactionId: transaction.id,
          amount,
          paidOn,
          note: note || null,
        },
      });

      if (settled) {
        await tx.debt.update({
          where: { id: debt.id },
          data: { status: 'SETTLED', settledOn: paidOn },
        });
      }
    });
  } catch (error) {
    redirectWithError(
      '/debts',
      error instanceof Error ? error.message : 'Không thể ghi thanh toán.',
    );
  }

  refreshApp();
  redirect('/debts');
}

export async function settleDebtAction(formData: FormData) {
  const user = await requireUser();
  const debtId = formText(formData.get('debtId'));
  if (!debtId) redirectWithError('/debts', 'Không tìm thấy khoản nợ.');

  try {
    const paidOn = parseDate(formData.get('paidOn'), 'Ngày tất toán');
    const paymentMethodId = await ensurePaymentMethod(
      user.id,
      selectedId(formData.get('paymentMethodId')),
    );
    const enteredAmount = formText(formData.get('amount'));
    const note = formText(formData.get('note'));

    await db.$transaction(async (tx) => {
      const debt = await tx.debt.findFirst({
        where: { id: debtId, userId: user.id, status: 'ACTIVE' },
        include: { payments: { select: { amount: true } } },
      });
      if (!debt) throw new Error('Khoản nợ không còn hoạt động.');

      const lockTimestamp = new Date(Math.max(Date.now(), debt.updatedAt.getTime() + 1));
      const reservation = await tx.debt.updateMany({
        where: { id: debt.id, userId: user.id, status: 'ACTIVE', updatedAt: debt.updatedAt },
        data: { updatedAt: lockTimestamp },
      });
      if (reservation.count !== 1) {
        throw new Error('Khoản nợ vừa được cập nhật. Vui lòng kiểm tra lại số tiền còn lại.');
      }

      const paid = debt.payments.reduce((total, payment) => total + Number(payment.amount), 0);
      const remaining = Number(debt.originalAmount) - paid;
      if (remaining <= 0) throw new Error('Khoản nợ này không còn số tiền cần tất toán.');

      const amount = enteredAmount
        ? parseVnd(formData.get('amount'), 'Số tiền tất toán')
        : remaining;
      if (amount > remaining) throw new Error('Số tiền tất toán vượt quá khoản còn lại.');

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          debtId: debt.id,
          paymentMethodId,
          type: debt.direction === 'I_OWE' ? 'EXPENSE' : 'INCOME',
          amount,
          note: note || `Tất toán khoản nợ: ${debt.counterparty}`,
          occurredOn: paidOn,
        },
      });

      await tx.debtPayment.create({
        data: {
          userId: user.id,
          debtId: debt.id,
          transactionId: transaction.id,
          amount,
          isSettlement: true,
          paidOn,
          note: note || null,
        },
      });

      await tx.debt.update({
        where: { id: debt.id },
        data: { status: 'SETTLED', settledOn: paidOn },
      });
    });
  } catch (error) {
    redirectWithError('/debts', error instanceof Error ? error.message : 'Không thể tất toán.');
  }

  refreshApp();
  redirect('/debts');
}

export async function deleteDebtAction(formData: FormData) {
  const user = await requireUser();
  const id = formText(formData.get('id'));
  if (!id) redirectWithError('/debts', 'Không tìm thấy khoản nợ.');

  const debt = await db.debt.findFirst({ where: { id, userId: user.id } });
  if (!debt) redirectWithError('/debts', 'Không tìm thấy khoản nợ.');

  const paymentCount = await db.debtPayment.count({ where: { debtId: id, userId: user.id } });
  if (paymentCount > 0 && formText(formData.get('confirm')) !== 'true') {
    redirectWithError(
      '/debts',
      `Khoản nợ này có ${paymentCount} lần thanh toán. Hãy xác nhận xoá để tiếp tục.`,
    );
  }

  await db.$transaction([
    db.transaction.updateMany({ where: { userId: user.id, debtId: id }, data: { debtId: null } }),
    db.debt.delete({ where: { id } }),
  ]);
  refreshApp();
  redirect('/debts');
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const displayName = textSchema('Tên hiển thị', 100).safeParse(
    formText(formData.get('displayName')),
  );

  if (!displayName.success) redirectWithError('/settings', displayName.error.issues[0].message);
  await db.user.update({ where: { id: user.id }, data: { displayName: displayName.data } });
  revalidatePath('/settings');
  redirect('/settings');
}
