import { type NextRequest } from 'next/server';
import {
  assertSameOrigin,
  gameApiError,
  privateJson,
  requireApiUser,
  unauthorized,
} from '@/lib/game-api';
import { getMatchSnapshot, playCaroMove } from '@/lib/game';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const user = await requireApiUser();
  if (!user) return unauthorized();
  const { matchId } = await params;
  const match = await getMatchSnapshot(user.id, matchId);
  if (!match) return privateJson(null, 404);
  return privateJson({
    id: match.id,
    status: match.status,
    mode: match.mode,
    resultReason: match.resultReason,
    currentTurn: match.currentTurn,
    turnStartedAt: match.turnStartedAt.toISOString(),
    turnSeconds: match.turnSeconds,
    version: match.version,
    playerXId: match.playerXId,
    playerOId: match.playerOId,
    winnerId: match.winnerId,
    moves: match.moves.map((move) => ({
      id: move.id,
      moveNumber: move.moveNumber,
      mark: move.mark,
      row: move.row,
      column: move.column,
      createdAt: move.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const user = await requireApiUser();
  if (!user) return unauthorized();
  try {
    assertSameOrigin(request);
    const { matchId } = await params;
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') throw new Error('INVALID_BODY');
    const row = Number((body as Record<string, unknown>).row);
    const column = Number((body as Record<string, unknown>).column);
    const result = await playCaroMove(user.id, matchId, row, column);
    return privateJson(result, 201);
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.message === 'INVALID_BODY')
    )
      return Response.json(
        { ok: false, error: 'Dữ liệu JSON không hợp lệ.', code: 'INVALID_BODY' },
        { status: 400 },
      );
    return gameApiError(error);
  }
}
