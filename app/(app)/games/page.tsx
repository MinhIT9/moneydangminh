import Image from 'next/image';
import Link from 'next/link';
import {
  GamePageTitle,
  GameProfileStrip,
  GameTopbar,
  OnlineFriends,
  QuickLeaderboard,
  RecentMatches,
} from '@/components/game-ui';
import { requireUser } from '@/lib/auth';

export const metadata = {
  title: 'Trung tâm trò chơi',
};

export default async function GamesPage() {
  const user = await requireUser();
  const playerName = user.displayName || 'Heo Xinh';

  return (
    <>
      <GameTopbar playerName={playerName} />
      <GamePageTitle
        icon="🎮"
        title="Trung tâm trò chơi"
        description="Giải trí mỗi ngày — Rèn luyện tư duy — Kết nối bạn bè"
      />

      <div className="game-layout game-layout--sidebar">
        <main className="game-main-column">
          <GameProfileStrip playerName={playerName} />

          <section className="game-hero-card game-panel">
            <Image
              src="/images/heo-xinh-caro-hero.png"
              alt="Heo Xinh giới thiệu bàn Cờ Caro XO"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 70vw"
            />
            <div className="game-hero-card__content">
              <span className="game-eyebrow">TRÒ CHƠI NỔI BẬT · BÀN 19×19</span>
              <h2>Cờ Caro XO</h2>
              <p>
                Sắp xếp 5 quân liên tiếp để giành chiến thắng. Một ván nhẹ nhàng, một lần luyện trí!
              </p>
              <div className="game-live-count">
                <span>👧🏻</span>
                <span>👦🏻</span>
                <span>🧑🏻</span>
                <b>256 người đang chơi</b>
              </div>
              <div className="game-hero-actions">
                <Link className="game-primary-button" href="/games/caro">
                  ▶ Chơi ngay
                </Link>
                <Link className="game-secondary-button" href="/games/caro/room/AB7K2M">
                  ♙ Tạo bàn
                </Link>
              </div>
            </div>
          </section>

          <section>
            <div className="game-section-head game-section-head--outside">
              <h2>Danh sách trò chơi</h2>
              <span>Thêm nhiều trò chơi mới trong tương lai</span>
            </div>
            <div className="game-catalog">
              <GameCard title="Cờ Caro XO" subtitle="Bàn 19×19" icon="XO" tone="violet" active />
              <GameCard title="Cờ Tướng" subtitle="Đấu trí đỉnh cao" icon="將" tone="orange" />
              <GameCard title="Cờ Vây" subtitle="Chiến thuật & bao vây" icon="●" tone="cream" />
              <GameCard title="Ô Ăn Quan" subtitle="Trò chơi dân gian" icon="◉" tone="peach" />
            </div>
          </section>

          <RecentMatches />
        </main>

        <aside className="game-side-column">
          <section className="game-panel game-rules-card">
            <div className="game-section-head">
              <h2>📖 Luật chơi Cờ Caro XO</h2>
            </div>
            <div className="game-rule">
              <span>🎯</span>
              <p>
                <b>5 quân trở lên</b> vẫn tính là thắng.
              </p>
            </div>
            <div className="game-rule">
              <span>🛡️</span>
              <p>
                Chuỗi không được đối thủ chặn <b>cả hai đầu</b>.
              </p>
            </div>
            <div className="game-rule">
              <span>↗</span>
              <p>Thắng theo hàng ngang, dọc hoặc hai đường chéo.</p>
            </div>
            <Link className="game-text-link" href="/games/caro">
              Xem cách chơi →
            </Link>
          </section>
          <OnlineFriends compact />
          <QuickLeaderboard />
        </aside>
      </div>
    </>
  );
}

function GameCard({
  title,
  subtitle,
  icon,
  tone,
  active = false,
}: {
  title: string;
  subtitle: string;
  icon: string;
  tone: string;
  active?: boolean;
}) {
  return (
    <article className={`game-catalog-card is-${tone}${active ? ' is-active' : ''}`}>
      <div className="game-catalog-card__visual">
        <span>{icon}</span>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {active ? (
        <>
          <span className="game-available">● 256 đang chơi</span>
          <Link href="/games/caro">Chơi ngay</Link>
        </>
      ) : (
        <>
          <span className="game-coming">Sắp ra mắt</span>
          <button type="button">🔔 Nhận thông báo</button>
        </>
      )}
    </article>
  );
}
