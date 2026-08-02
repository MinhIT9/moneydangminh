import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { GameError } from '@/lib/game';

export async function requireApiUser() {
  return getCurrentUser();
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== request.nextUrl.origin)
    throw new GameError('Nguồn yêu cầu không hợp lệ.', 'INVALID_ORIGIN');
}

export function gameApiError(error: unknown) {
  if (error instanceof GameError) {
    const status = error.code.startsWith('NOT_')
      ? 403
      : error.code.includes('FOUND')
        ? 404
        : error.code === 'RATE_LIMITED'
          ? 429
          : 400;
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status });
  }
  console.error('Unexpected game API error', error);
  return NextResponse.json(
    { ok: false, error: 'Lỗi máy chủ.', code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}

export function unauthorized() {
  return NextResponse.json(
    { ok: false, error: 'Bạn chưa đăng nhập.', code: 'UNAUTHORIZED' },
    { status: 401 },
  );
}

export function privateJson(data: unknown, status = 200) {
  return NextResponse.json(
    { ok: true, data },
    { status, headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
  );
}
