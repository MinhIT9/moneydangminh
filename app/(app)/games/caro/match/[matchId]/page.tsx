import { CaroMatch } from '@/components/caro-match';
import { GameTopbar } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';
import { getMatchSnapshot } from '@/lib/game';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Trận đấu Cờ Caro XO' };

export default async function CaroMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const user = await requireUser();
  const { matchId } = await params;
  const playerName = user.displayName || 'Heo Xinh';
  const match = await getMatchSnapshot(user.id, matchId);
  if (!match) notFound();

  const initialState = {
    id: match.id,
    status: match.status,
    mode: match.mode,
    resultReason: match.resultReason,
    currentTurn: match.currentTurn,
    turnStartedAt: match.turnStartedAt.toISOString(),
    serverNow: new Date().toISOString(),
    turnSeconds: match.turnSeconds,
    roomCode: match.room?.code ?? null,
    playerXChange: match.playerXChange,
    playerOChange: match.playerOChange,
    drawOfferedById: match.drawOfferedById,
    currentUserId: user.id,
    playerX: {
      id: match.playerX.id,
      name: match.playerX.displayName || 'Kỳ thủ X',
      avatar: match.playerX.gameProfile?.avatar ?? '👦🏻',
      rating: match.playerX.gameProfile?.caroRating ?? match.playerXRating,
      hearts: match.playerX.gameProfile?.hearts ?? 5,
    },
    playerO: {
      id: match.playerO.id,
      name: match.playerO.displayName || 'Kỳ thủ O',
      avatar: match.playerO.gameProfile?.avatar ?? '👧🏻',
      rating: match.playerO.gameProfile?.caroRating ?? match.playerORating,
      hearts: match.playerO.gameProfile?.hearts ?? 5,
    },
    moves: match.moves.map((move) => ({
      id: move.id,
      moveNumber: move.moveNumber,
      mark: move.mark,
      row: move.row,
      column: move.column,
    })),
    messages: match.messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.displayName,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  };

  return (
    <>
      <GameTopbar playerName={playerName} />
      <div className="match-breadcrumb">Trung tâm trò chơi / Cờ Caro XO / Trận {matchId}</div>
      <CaroMatch initialState={initialState} />
    </>
  );
}
