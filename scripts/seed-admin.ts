import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

loadEnvConfig(process.cwd());

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const environment = {
    host: requiredEnvironmentValue('DB_HOST'),
    port: Number(requiredEnvironmentValue('DB_PORT')),
    user: requiredEnvironmentValue('DB_USER'),
    password: requiredEnvironmentValue('DB_PASSWORD'),
    database: requiredEnvironmentValue('DB_NAME'),
    email: requiredEnvironmentValue('ADMIN_EMAIL').toLowerCase(),
  };

  if (!Number.isInteger(environment.port) || environment.port < 1 || environment.port > 65535) {
    throw new Error('DB_PORT is invalid.');
  }
  if (!/^\S+@\S+\.\S+$/.test(environment.email)) {
    throw new Error('ADMIN_EMAIL is invalid.');
  }
  const adapter = new PrismaMariaDb({
    host: environment.host,
    port: environment.port,
    user: environment.user,
    password: environment.password,
    database: environment.database,
    connectionLimit: 1,
  });
  const db = new PrismaClient({ adapter });

  try {
    const existing = await db.user.findUnique({ where: { email: environment.email } });

    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', status: 'ACTIVE', isLocked: false },
      });
      console.log(`Promoted existing account ${environment.email} to ADMIN.`);
    } else {
      const passwordForAdmin = requiredEnvironmentValue('ADMIN_PASSWORD');
      const phone = requiredEnvironmentValue('ADMIN_PHONE');
      if (passwordForAdmin.length < 8) {
        throw new Error('ADMIN_PASSWORD must contain at least 8 characters.');
      }
      if (!/^0[35789][0-9]{8}$/.test(phone)) {
        throw new Error('ADMIN_PHONE is invalid.');
      }

      await db.user.create({
        data: {
          email: environment.email,
          phone,
          displayName: process.env.ADMIN_DISPLAY_NAME?.trim() || 'Quản trị viên',
          passwordHash: await bcrypt.hash(passwordForAdmin, 12),
          role: 'ADMIN',
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
      console.log(`Created ADMIN account ${environment.email}.`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Unable to bootstrap administrator.');
  process.exitCode = 1;
});
