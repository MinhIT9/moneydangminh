import { GameFriendsChat } from '@/components/game-friends-chat';
import { GamePageTitle, GameTopbar } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';
import { getFriendCenter, getCaroRank } from '@/lib/game';

export const metadata = { title: 'Bạn bè và trò chuyện' };

export default async function GameFriendsPage() {
  const user = await requireUser();
  const playerName = user.displayName || 'Heo Xinh';
  const center = await getFriendCenter(user.id);
  const toFriend = (friend: (typeof center.relationships)[number]['requester']) => ({
    id: friend.id,
    name: friend.displayName || friend.gameProfile?.playerCode || 'Người chơi',
    playerCode: friend.gameProfile?.playerCode ?? '—',
    avatar: friend.gameProfile?.avatar ?? '🐷',
    rating: friend.gameProfile?.caroRating ?? 500,
    presence: friend.gameProfile?.presence ?? 'OFFLINE',
    detail:
      friend.gameProfile?.presence === 'PLAYING'
        ? 'Đang trong trận'
        : friend.gameProfile?.presence === 'IN_ROOM'
          ? 'Đang trong phòng'
          : friend.gameProfile?.presence === 'MATCHMAKING'
            ? 'Đang tìm trận'
            : friend.gameProfile?.presence === 'ONLINE'
              ? 'Đang online'
              : `${getCaroRank(friend.gameProfile?.caroRating ?? 500).name}`,
  });
  const initialState = {
    currentUserId: user.id,
    friends: center.relationships.map((relationship) =>
      toFriend(
        relationship.requesterId === user.id ? relationship.addressee : relationship.requester,
      ),
    ),
    requests: center.requests.map((request) => ({
      id: request.id,
      user: toFriend(request.requester),
    })),
    messages: center.messages
      .filter((message) => message.recipientId)
      .map((message) => ({
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId!,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
  };

  return (
    <>
      <GameTopbar playerName={playerName} />
      <GamePageTitle
        icon="💬"
        title="Bạn bè & trò chuyện"
        description="Kết nối bạn bè và gửi lời mời so tài Cờ Caro XO."
      />
      <GameFriendsChat playerName={playerName} initialState={initialState} />
    </>
  );
}
