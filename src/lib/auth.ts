import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

const SESSION_COOKIE = 'minh_finance_session';
const SESSION_DAYS = 30;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }
  return secret;
}

function tokenHash(token: string) {
  return createHash('sha256').update(`${sessionSecret()}:${token}`).digest('hex');
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash: tokenHash(token),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

/**
 * The private layout and its active page often need the same user in one React Server Component
 * render. React keeps this memoized per request only, so it removes the duplicate session query
 * without sharing authenticated data between visitors or requests.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (
    session.expiresAt <= new Date() ||
    session.user.status !== 'ACTIVE' ||
    session.user.isLocked
  ) {
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/dashboard');
  return user;
}
