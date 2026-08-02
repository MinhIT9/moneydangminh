import { type NextRequest } from 'next/server';
import {
  assertSameOrigin,
  gameApiError,
  privateJson,
  requireApiUser,
  unauthorized,
} from '@/lib/game-api';
import { touchGamePresence } from '@/lib/game';

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (!user) return unauthorized();
  try {
    assertSameOrigin(request);
    const profile = await touchGamePresence(user.id);
    return privateJson({
      presence: profile.presence,
      hearts: profile.hearts,
      lastSeenAt: profile.lastSeenAt.toISOString(),
    });
  } catch (error) {
    return gameApiError(error);
  }
}
