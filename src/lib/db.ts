import 'server-only';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client';
import { getDatabaseEnv } from './env';

const globalForDb = globalThis as unknown as {
  db: PrismaClient | undefined;
};

function createDatabaseClient() {
  const env = getDatabaseEnv();
  const adapter = new PrismaMariaDb({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: env.DB_CONNECTION_LIMIT,
  });

  return new PrismaClient({ adapter });
}

function getClient() {
  if (!globalForDb.db) {
    globalForDb.db = createDatabaseClient();
  }
  return globalForDb.db;
}

/**
 * Lazily creates one Prisma client on first database operation. This keeps static builds independent
 * from production secrets while still validating credentials before the first real request.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
