import { CaroMatch } from '@/components/caro-match';
import { GameTopbar } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Trận đấu Cờ Caro XO' };

export default async function CaroMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const user = await requireUser();
  const { matchId } = await params;
  const playerName = user.displayName || 'Heo Xinh';

  return (
    <>
      <GameTopbar playerName={playerName} />
      <div className="match-breadcrumb">Trung tâm trò chơi / Cờ Caro XO / Trận {matchId}</div>
      <CaroMatch playerName={playerName} />
    </>
  );
}
