import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyGameValue } from '@/components/caro-actions';
import { JoinRoomButton, RoomChatForm, RoomControls } from '@/components/caro-room-controls';
import { GameTopbar, OnlineFriends } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';
import { getCaroRank, getFriendCenter, getRoomSnapshot } from '@/lib/game';

export const metadata = { title: 'Phòng riêng Cờ Caro XO' };

export default async function PrivateRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const [user, route] = await Promise.all([requireUser(), params]);
  const playerName = user.displayName || 'Heo Xinh';
  const [room, friendCenter] = await Promise.all([
    getRoomSnapshot(user.id, route.roomCode),
    getFriendCenter(user.id),
  ]);
  if (!room) notFound();
  const roomCode = room.code;
  const inviteLink = `/games/caro/room/${roomCode}`;
  const activeMatch = room.matches.find((match) => match.status === 'ACTIVE');
  const myReady = room.hostId === user.id ? room.hostReady : room.guestReady;
  const canStart = Boolean(
    room.guest && room.hostReady && room.guestReady && room.status === 'READY',
  );
  const statusLabel =
    room.status === 'WAITING'
      ? 'Đang chờ người chơi'
      : room.status === 'READY'
        ? 'Đã đủ người'
        : room.status === 'PLAYING'
          ? 'Đang thi đấu'
          : room.status === 'FINISHED'
            ? 'Đã kết thúc'
            : 'Đã đóng';
  const friendItems = friendCenter.relationships.map((relationship) => {
    const friend =
      relationship.requesterId === user.id ? relationship.addressee : relationship.requester;
    return {
      id: friend.id,
      name: friend.displayName || 'Kỳ thủ',
      avatar: friend.gameProfile?.avatar ?? '🐷',
      status:
        friend.gameProfile?.presence === 'PLAYING'
          ? ('PLAYING' as const)
          : friend.gameProfile?.presence === 'OFFLINE'
            ? ('OFFLINE' as const)
            : ('ONLINE' as const),
      detail:
        friend.gameProfile?.presence === 'PLAYING'
          ? 'Đang trong trận'
          : friend.gameProfile?.presence === 'OFFLINE'
            ? 'Ngoại tuyến'
            : 'Đang online',
      score: friend.gameProfile?.rating ?? 500,
    };
  });

  return (
    <>
      <GameTopbar playerName={playerName} />
      <div className="game-breadcrumb">
        <Link href="/games">Trung tâm trò chơi</Link>
        <span>/</span>
        <Link href="/games/caro">Cờ Caro XO</Link>
        <span>/</span>
        <b>Phòng {roomCode}</b>
      </div>
      <div className="game-page-title game-page-title--compact">
        <span aria-hidden="true">♙</span>
        <div>
          <h1>Phòng riêng Cờ Caro XO</h1>
          <p>Mời bạn bè vào phòng và cùng nhau so tài.</p>
        </div>
      </div>
      <div className="game-layout game-layout--sidebar room-page-layout">
        <main className="game-main-column">
          <section className="room-code-card game-panel">
            <div>
              <small>MÃ PHÒNG</small>
              <strong>{roomCode}</strong>
              <div className="room-code-actions">
                <CopyGameValue value={roomCode} label="Sao chép mã" />
                <CopyGameValue value={inviteLink} label="Chia sẻ phòng" />
              </div>
            </div>
            <div className="room-status-details">
              <span className="room-waiting-pill">{statusLabel}</span>
              <p>
                <small>Chế độ</small>
                <b>Giao hữu · không cộng điểm</b>
              </p>
              <p>
                <small>Chủ phòng</small>
                <b>
                  {room.host.gameProfile?.avatar ?? '🐷'} {room.host.displayName}
                </b>
              </p>
            </div>
          </section>

          {!room.isMember && (
            <section className="game-panel room-join-gate">
              <h2>Bạn được mời vào phòng</h2>
              <p>Tham gia để sẵn sàng và trò chuyện với chủ phòng.</p>
              <JoinRoomButton code={roomCode} />
            </section>
          )}

          <div className="room-stage">
            <section>
              <div className="game-section-head game-section-head--outside">
                <h2>Người chơi trong phòng</h2>
                <span>{room.guest ? '2/2' : '1/2'}</span>
              </div>
              <div className="room-player-grid">
                <RoomPlayer
                  name={room.host.displayName || 'Chủ phòng'}
                  avatar={room.host.gameProfile?.avatar ?? '🐷'}
                  rating={room.host.gameProfile?.rating ?? 500}
                  ready={room.hostReady}
                  owner
                />
                {room.guest ? (
                  <RoomPlayer
                    name={room.guest.displayName || 'Người chơi'}
                    avatar={room.guest.gameProfile?.avatar ?? '👧🏻'}
                    rating={room.guest.gameProfile?.rating ?? 500}
                    ready={room.guestReady}
                  />
                ) : (
                  <article className="room-empty-player game-panel">
                    <span>＋</span>
                    <h3>Đang chờ người chơi</h3>
                    <p>Mời bạn bè hoặc chia sẻ mã phòng.</p>
                    <CopyGameValue value={inviteLink} label="Sao chép lời mời" />
                  </article>
                )}
              </div>
            </section>
            <aside className="room-settings game-panel">
              <div className="game-section-head">
                <h2>⚙ Thiết lập phòng</h2>
              </div>
              <dl>
                <div>
                  <dt>Chế độ</dt>
                  <dd>Giao hữu</dd>
                </div>
                <div>
                  <dt>Bàn cờ</dt>
                  <dd>19 × 19</dd>
                </div>
                <div>
                  <dt>Thời gian</dt>
                  <dd>{room.turnSeconds} giây/lượt</dd>
                </div>
                <div>
                  <dt>Luật chơi</dt>
                  <dd>5+ quân</dd>
                </div>
                <div>
                  <dt>Chặn hai đầu</dt>
                  <dd>{room.blockedEnds ? 'Bật' : 'Tắt'}</dd>
                </div>
              </dl>
              <p className="room-safe-note">
                🛡 Phòng riêng không ảnh hưởng điểm xếp hạng hoặc tim.
              </p>
            </aside>
          </div>

          {room.isMember && (
            <section className="room-start-card game-panel">
              <div>
                <span>🐷</span>
                <p>
                  <strong>{canStart ? 'Cả hai đã sẵn sàng!' : 'Chuẩn bị cho trận đấu'}</strong>
                  <small>Chỉ chủ phòng bắt đầu khi đủ hai người cùng sẵn sàng.</small>
                </p>
              </div>
              <RoomControls
                code={roomCode}
                isHost={room.isHost}
                ready={myReady}
                canStart={canStart}
                activeMatchId={activeMatch?.id}
              />
            </section>
          )}

          <div className="room-share-grid">
            <section className="game-panel">
              <h3>🔗 Link mời phòng</h3>
              <code>{inviteLink}</code>
              <CopyGameValue value={inviteLink} label="Sao chép link" />
            </section>
            <section className="game-panel">
              <h3>📣 Chia sẻ nhanh</h3>
              <p>Gửi mã phòng qua Zalo, Messenger hoặc mạng xã hội.</p>
              <CopyGameValue value={roomCode} label="Sao chép mã phòng" />
            </section>
            <section className="game-panel room-qr">
              <h3>▦ Mời bằng mã QR</h3>
              <div aria-label="Mã QR minh họa">
                HX
                <br />
                {roomCode.slice(0, 4)}
              </div>
              <small>QR sẽ kết nối dịch vụ ở bước sau</small>
            </section>
          </div>
        </main>
        <aside className="game-side-column">
          <OnlineFriends items={friendItems} roomCode={room.isHost ? roomCode : undefined} />
          <section className="game-panel room-chat-preview">
            <div className="game-section-head">
              <h2>Trò chuyện trong phòng</h2>
              <span>{room.messages.length}</span>
            </div>
            <div>
              {room.messages.map((message) => (
                <p className={message.senderId === user.id ? 'is-mine' : ''} key={message.id}>
                  <b>{message.kind === 'SYSTEM' ? 'Hệ thống' : message.sender.displayName}</b>
                  <br />
                  {message.content}
                </p>
              ))}
            </div>
            {room.isMember && <RoomChatForm code={roomCode} />}
          </section>
        </aside>
      </div>
    </>
  );
}

function RoomPlayer({
  name,
  avatar,
  rating,
  ready,
  owner = false,
}: {
  name: string;
  avatar: string;
  rating: number;
  ready: boolean;
  owner?: boolean;
}) {
  return (
    <article className="room-player-card game-panel">
      {owner && <span className="room-owner-pill">♛ Chủ phòng</span>}
      <span className="game-avatar game-avatar--xl">{avatar}</span>
      <h2>{name}</h2>
      <span className="game-rank-pill">✦ {getCaroRank(rating).name}</span>
      <strong>{rating.toLocaleString('vi-VN')} điểm</strong>
      <span className={ready ? 'room-ready' : 'room-waiting-pill'}>
        {ready ? '● Sẵn sàng' : '○ Chưa sẵn sàng'}
      </span>
    </article>
  );
}
