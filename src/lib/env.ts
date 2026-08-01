import 'server-only';

import { z } from 'zod';

const environmentSchema = z.object({
  DB_HOST: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().trim().min(1),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(20).default(5),
});

/** Server-only configuration. It is intentionally parsed lazily, so `next build` needs no DB access. */
export function getDatabaseEnv() {
  return environmentSchema.parse({
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_CONNECTION_LIMIT: process.env.DB_CONNECTION_LIMIT,
  });
}
