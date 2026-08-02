import { GameProfileView } from '@/components/game-profile-view';
import { GameTopbar } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';
import { getPublicGameProfile } from '@/lib/game';

export const metadata = { title: 'Hồ sơ Cờ Caro XO' };

export default async function CaroProfilePage() {
  const user = await requireUser();
  const data = await getPublicGameProfile(user.id);
  return (
    <>
      <GameTopbar playerName={user.displayName || 'Heo Xinh'} />
      <GameProfileView data={data} isOwner />
    </>
  );
}
