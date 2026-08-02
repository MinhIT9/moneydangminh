import { type NextRequest } from 'next/server';
import { gameApiError, privateJson, requireApiUser, unauthorized } from '@/lib/game-api';
import { getRoomSnapshot } from '@/lib/game';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  const user = await requireApiUser();
  if (!user) return unauthorized();
  const { roomCode } = await params;
  try {
    const room = await getRoomSnapshot(user.id, roomCode);
    if (!room) return privateJson(null, 404);
    return privateJson({
      code: room.code,
      status: room.status,
      hostId: room.hostId,
      guestId: room.guestId,
      hostReady: room.hostReady,
      guestReady: room.guestReady,
      isMember: room.isMember,
      isHost: room.isHost,
      match: room.matches[0] ?? null,
      messages: room.isMember
        ? room.messages.map((message) => ({
            id: message.id,
            senderId: message.senderId,
            content: message.content,
            kind: message.kind,
            createdAt: message.createdAt.toISOString(),
          }))
        : [],
    });
  } catch (error) {
    return gameApiError(error);
  }
}
