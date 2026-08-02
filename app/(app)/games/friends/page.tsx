import { GameFriendsChat } from '@/components/game-friends-chat';
import { GamePageTitle, GameTopbar } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Bạn bè và trò chuyện' };

export default async function GameFriendsPage() {
  const user = await requireUser();
  const playerName = user.displayName || 'Heo Xinh';

  return (
    <>
      <GameTopbar playerName={playerName} />
      <GamePageTitle
        icon="💬"
        title="Bạn bè & trò chuyện"
        description="Kết nối bạn bè và gửi lời mời so tài Cờ Caro XO."
      />
      <GameFriendsChat playerName={playerName} />
    </>
  );
}
