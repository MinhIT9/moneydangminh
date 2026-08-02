import Image from 'next/image';
import Link from 'next/link';
import { MatchmakingButton, RoomJoinForm } from '@/components/caro-actions';
import {
  GameProfileStrip,
  GameTopbar,
  OnlineFriends,
  QuickLeaderboard,
  RecentMatches,
} from '@/components/game-ui';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Cờ Caro XO' };

export default async function CaroLobbyPage() {
  const user = await requireUser();
  const playerName = user.displayName || 'Heo Xinh';

  return (
    <>
      <GameTopbar playerName={playerName} />
      <section className="caro-banner game-panel">
        <Image
          src="/images/heo-xinh-caro-hero.png"
          alt="Bàn Cờ Caro XO cùng mascot Heo Xinh"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 75vw"
        />
        <div>
          <span className="game-eyebrow">TRÒ CHƠI TRÍ TUỆ · BÀN 19×19</span>
          <h1>Cờ Caro XO</h1>
          <p>Cờ trí tuệ — Tư duy chiến lược, kết nối bạn bè!</p>
        </div>
      </section>

      <div className="game-layout game-layout--sidebar">
        <main className="game-main-column">
          <GameProfileStrip playerName={playerName} />

          <section className="caro-mode-grid">
            <article className="caro-mode-card is-ranked game-panel">
              <div>
                <span className="caro-mode-icon">🤝</span>
                <h2>Ghép ngẫu nhiên</h2>
                <p>Hệ thống tìm đối thủ có trình độ phù hợp để thi đấu xếp hạng.</p>
              </div>
              <ul>
                <li>💔 Thua: tốn 1 tim</li>
                <li>💚 Thắng: hồi 1 tim</li>
                <li>◷ 5 phút hồi 1 tim</li>
                <li>▦ Bàn cờ 19×19</li>
              </ul>
              <MatchmakingButton />
            </article>

            <article className="caro-mode-card is-private game-panel">
              <div>
                <span className="caro-mode-icon">🏠</span>
                <h2>Tạo phòng riêng</h2>
                <p>Tạo phòng để chơi cùng bạn bè hoặc người thân, hoàn toàn giao hữu.</p>
              </div>
              <ul>
                <li>🎟️ Không tốn tim</li>
                <li>✦ Không ảnh hưởng điểm hạng</li>
                <li>⚙ Tùy chỉnh luật chơi</li>
                <li>💬 Có chat trong phòng</li>
              </ul>
              <Link className="game-green-button" href="/games/caro/room/AB7K2M">
                ▣ Tạo phòng
              </Link>
              <RoomJoinForm />
            </article>
          </section>

          <RecentMatches />
        </main>

        <aside className="game-side-column">
          <section className="game-panel game-rules-card">
            <div className="game-section-head">
              <h2>📖 Luật chơi nhanh</h2>
            </div>
            <div className="game-rule">
              <span>🏆</span>
              <p>
                <b>5 quân liên tiếp trở lên</b> theo hàng ngang, dọc hoặc chéo để thắng.
              </p>
            </div>
            <div className="game-rule">
              <span>🛡️</span>
              <p>
                Chuỗi bị đối thủ chặn cả hai đầu <b>chưa tính thắng</b>.
              </p>
            </div>
            <div className="game-rule">
              <span>○</span>
              <p>Mép bàn không được xem là quân chặn của đối phương.</p>
            </div>
          </section>
          <OnlineFriends compact />
          <QuickLeaderboard />
        </aside>
      </div>
    </>
  );
}
