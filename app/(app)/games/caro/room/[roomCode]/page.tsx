import Link from 'next/link';
import { CopyGameValue } from '@/components/caro-actions';
import { GameTopbar, OnlineFriends } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Phòng riêng Cờ Caro XO' };

export default async function PrivateRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const [user, route] = await Promise.all([requireUser(), params]);
  const playerName = user.displayName || 'Heo Xinh';
  const roomCode =
    route.roomCode
      .toUpperCase()
      .replace(/[^A-Z2-9]/g, '')
      .slice(0, 8) || 'AB7K2M';
  const inviteLink = `/games/caro/room/${roomCode}`;

  return (
    <>
      <GameTopbar playerName={playerName} />
      <div className="game-breadcrumb">
        <Link href="/games">Trung tâm trò chơi</Link>
        <span>/</span>
        <Link href="/games/caro">Cờ Caro XO</Link>
        <span>/</span>
        <b>Phòng riêng</b>
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
              <span className="room-waiting-pill">Đang chờ người chơi</span>
              <p>
                <small>Chế độ</small>
                <b>Giao hữu · không cộng điểm</b>
              </p>
              <p>
                <small>Người tạo phòng</small>
                <b>🐷 {playerName}</b>
              </p>
            </div>
          </section>

          <div className="room-stage">
            <section>
              <div className="game-section-head game-section-head--outside">
                <h2>Người chơi trong phòng</h2>
                <span>1/2</span>
              </div>
              <div className="room-player-grid">
                <article className="room-player-card game-panel">
                  <span className="room-owner-pill">♛ Chủ phòng</span>
                  <span className="game-avatar game-avatar--xl">🐷</span>
                  <h2>{playerName}</h2>
                  <span className="game-rank-pill">✦ Kim Cương III</span>
                  <strong>1.257 điểm</strong>
                  <span className="room-ready">● Sẵn sàng</span>
                </article>
                <article className="room-empty-player game-panel">
                  <span>＋</span>
                  <h3>Đang chờ người chơi</h3>
                  <p>Mời một người bạn hoặc chia sẻ mã phòng.</p>
                  <CopyGameValue value={inviteLink} label="Mời bạn vào phòng" />
                </article>
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
                  <dd>45 giây/lượt</dd>
                </div>
                <div>
                  <dt>Luật chơi</dt>
                  <dd>Cờ Caro XO</dd>
                </div>
                <div>
                  <dt>Điểm để thắng</dt>
                  <dd>5 quân liên tiếp</dd>
                </div>
                <div>
                  <dt>Chặn hai đầu</dt>
                  <dd>Bật</dd>
                </div>
              </dl>
              <p className="room-safe-note">🛡 Phòng riêng không ảnh hưởng điểm xếp hạng.</p>
            </aside>
          </div>

          <section className="room-start-card game-panel">
            <div>
              <span>🐷</span>
              <p>
                <strong>Sắp sẵn sàng rồi!</strong>
                <small>Cần đủ hai người chơi để bắt đầu trận đấu.</small>
              </p>
            </div>
            <button type="button" disabled>
              ▶ Bắt đầu
            </button>
          </section>

          <div className="room-share-grid">
            <section className="game-panel">
              <h3>🔗 Link mời phòng</h3>
              <code>{inviteLink}</code>
              <CopyGameValue value={inviteLink} label="Sao chép link" />
            </section>
            <section className="game-panel">
              <h3>📣 Chia sẻ nhanh</h3>
              <p>Gửi mã phòng qua Zalo, Messenger hoặc mạng xã hội bạn dùng.</p>
              <CopyGameValue value={roomCode} label="Sao chép mã phòng" />
            </section>
            <section className="game-panel room-qr">
              <h3>▦ Mời bằng mã QR</h3>
              <div aria-label="Mã QR minh họa">
                HX
                <br />
                {roomCode.slice(0, 4)}
              </div>
              <small>Bản FE minh họa</small>
            </section>
          </div>
        </main>

        <aside className="game-side-column">
          <OnlineFriends />
          <section className="game-panel room-chat-preview">
            <div className="game-section-head">
              <h2>Trò chuyện trong phòng</h2>
              <span>1</span>
            </div>
            <div>
              <p>
                Heo Xinh đã tạo phòng.
                <br />
                Mã phòng: <b>{roomCode}</b>
              </p>
              <p className="is-mine">
                Chào mọi người! 👋
                <br />
                Ai vào chơi cùng mình nha!
              </p>
            </div>
            <form>
              <input placeholder="Nhập tin nhắn…" disabled />
              <button type="button" disabled>
                ➤
              </button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
