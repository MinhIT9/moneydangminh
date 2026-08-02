import { notFound } from 'next/navigation';
import { GameProfileView } from '@/components/game-profile-view';
import { GameTopbar } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';
import { getPublicGameProfile } from '@/lib/game';

export const metadata = { title: 'Hồ sơ kỳ thủ' };

export default async function PublicCaroProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [viewer, route] = await Promise.all([requireUser(), params]);
  const data = await getPublicGameProfile(viewer.id, route.userId).catch(() => null);
  if (!data) notFound();
  return (
    <>
      <GameTopbar playerName={viewer.displayName || 'Heo Xinh'} />
      <GameProfileView data={data} isOwner={viewer.id === route.userId} />
    </>
  );
}
