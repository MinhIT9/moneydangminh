'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  blockGamePlayer,
  cancelRankedQueue,
  createPrivateRoom,
  GameError,
  inviteFriendToRoom,
  joinPrivateRoom,
  leavePrivateRoom,
  markGameNotificationsRead,
  offerCaroDraw,
  playCaroMove,
  pollRankedMatch,
  queueForRankedMatch,
  readyForPrivateRoomRematch,
  removeFriend,
  respondFriendRequest,
  respondCaroDraw,
  searchGamePlayers,
  sendDirectMessage,
  sendFriendRequest,
  sendMatchMessage,
  sendRoomMessage,
  setRoomReady,
  startPrivateRoom,
  surrenderCaroMatch,
  touchGamePresence,
} from '@/lib/game';

export type GameActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; code: string };

function failure(error: unknown): GameActionResult<never> {
  if (error instanceof GameError) return { ok: false, error: error.message, code: error.code };
  console.error('Unexpected game action failure', error);
  return {
    ok: false,
    error: 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.',
    code: 'INTERNAL_ERROR',
  };
}

function refreshGamePaths() {
  revalidatePath('/games', 'layout');
}

export async function heartbeatGameAction() {
  const user = await requireUser();
  await touchGamePresence(user.id);
  return { ok: true, data: undefined } satisfies GameActionResult;
}

export async function createPrivateRoomAction(): Promise<GameActionResult<{ code: string }>> {
  const user = await requireUser();
  try {
    const room = await createPrivateRoom(user.id);
    refreshGamePaths();
    return { ok: true, data: { code: room.code } };
  } catch (error) {
    return failure(error);
  }
}

export async function joinPrivateRoomAction(
  code: string,
): Promise<GameActionResult<{ code: string }>> {
  const user = await requireUser();
  try {
    const room = await joinPrivateRoom(user.id, code);
    refreshGamePaths();
    return { ok: true, data: { code: room.code } };
  } catch (error) {
    return failure(error);
  }
}

export async function setRoomReadyAction(code: string, ready: boolean): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await setRoomReady(user.id, code, ready);
    refreshGamePaths();
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function readyForPrivateRoomRematchAction(
  code: string,
): Promise<GameActionResult<{ code: string }>> {
  const user = await requireUser();
  try {
    const room = await readyForPrivateRoomRematch(user.id, code);
    refreshGamePaths();
    return { ok: true, data: { code: room.code } };
  } catch (error) {
    return failure(error);
  }
}

export async function startPrivateRoomAction(
  code: string,
): Promise<GameActionResult<{ matchId: string }>> {
  const user = await requireUser();
  try {
    const match = await startPrivateRoom(user.id, code);
    refreshGamePaths();
    return { ok: true, data: { matchId: match.id } };
  } catch (error) {
    return failure(error);
  }
}

export async function leavePrivateRoomAction(code: string): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await leavePrivateRoom(user.id, code);
    refreshGamePaths();
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function queueRankedMatchAction() {
  const user = await requireUser();
  try {
    return { ok: true, data: await queueForRankedMatch(user.id) } satisfies GameActionResult<
      Awaited<ReturnType<typeof queueForRankedMatch>>
    >;
  } catch (error) {
    return failure(error);
  }
}

export async function pollRankedMatchAction() {
  const user = await requireUser();
  try {
    return { ok: true, data: await pollRankedMatch(user.id) } satisfies GameActionResult<
      Awaited<ReturnType<typeof pollRankedMatch>>
    >;
  } catch (error) {
    return failure(error);
  }
}

export async function cancelRankedMatchAction(): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await cancelRankedQueue(user.id);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function playCaroMoveAction(
  matchId: string,
  row: number,
  column: number,
): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await playCaroMove(user.id, matchId, row, column);
    revalidatePath(`/games/caro/match/${matchId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function surrenderCaroMatchAction(matchId: string): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await surrenderCaroMatch(user.id, matchId);
    revalidatePath(`/games/caro/match/${matchId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function offerCaroDrawAction(matchId: string): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await offerCaroDraw(user.id, matchId);
    revalidatePath(`/games/caro/match/${matchId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function respondCaroDrawAction(
  matchId: string,
  accept: boolean,
): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await respondCaroDraw(user.id, matchId, accept);
    revalidatePath(`/games/caro/match/${matchId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function sendMatchMessageAction(
  matchId: string,
  content: string,
  quick = false,
): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await sendMatchMessage(user.id, matchId, content, quick ? 'QUICK' : 'TEXT');
    revalidatePath(`/games/caro/match/${matchId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function sendRoomMessageAction(
  code: string,
  content: string,
): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await sendRoomMessage(user.id, code, content);
    revalidatePath(`/games/caro/room/${code}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function sendFriendRequestAction(targetId: string): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await sendFriendRequest(user.id, targetId);
    revalidatePath('/games/friends');
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function searchGamePlayersAction(query: string): Promise<
  GameActionResult<
    Array<{
      id: string;
      playerCode: string;
      avatar: string;
      rating: number;
      presence: string;
      displayName: string;
    }>
  >
> {
  const user = await requireUser();
  try {
    const players = await searchGamePlayers(user.id, query);
    return {
      ok: true,
      data: players.map((player) => ({
        id: player.userId,
        playerCode: player.playerCode,
        avatar: player.avatar,
        rating: player.caroRating,
        presence: player.presence,
        displayName: player.user.displayName,
      })),
    };
  } catch (error) {
    return failure(error);
  }
}

export async function respondFriendRequestAction(
  friendshipId: string,
  accept: boolean,
): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await respondFriendRequest(user.id, friendshipId, accept);
    revalidatePath('/games/friends');
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function removeFriendAction(targetId: string): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await removeFriend(user.id, targetId);
    revalidatePath('/games/friends');
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function blockGamePlayerAction(targetId: string): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await blockGamePlayer(user.id, targetId);
    revalidatePath('/games/friends');
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function sendDirectMessageAction(
  recipientId: string,
  content: string,
): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await sendDirectMessage(user.id, recipientId, content);
    revalidatePath('/games/friends');
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function inviteFriendToRoomAction(
  recipientId: string,
  code: string,
): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await inviteFriendToRoom(user.id, recipientId, code);
    revalidatePath(`/games/caro/room/${code}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function markGameNotificationsReadAction(): Promise<GameActionResult> {
  const user = await requireUser();
  try {
    await markGameNotificationsRead(user.id);
    refreshGamePaths();
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
