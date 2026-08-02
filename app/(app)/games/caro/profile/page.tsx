import { GameTopbar, OnlineFriends, RecentMatches } from '@/components/game-ui';
import { gameProfile, rankTiers } from '@/lib/game-mock';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Hồ sơ Cờ Caro XO' };

export default async function CaroProfilePage() {
  const user = await requireUser();
  const playerName = user.displayName || 'Heo Xinh';

  return (
    <>
      <GameTopbar playerName={playerName} />
      <div className="profile-hero game-panel">
        <div className="game-player-identity">
          <span className="game-avatar game-avatar--xl">🐷</span>
          <div>
            <h1>{playerName}</h1>
            <span className="game-rank-pill">{gameProfile.rank}</span>
            <small>ID: {gameProfile.playerId}</small>
          </div>
        </div>
        <div className="profile-hero__metrics">
          <div>
            <small>Hạng hiện tại</small>
            <strong>✦</strong>
            <span>{gameProfile.rankShort}</span>
          </div>
          <div>
            <small>Điểm hiện tại</small>
            <strong>{gameProfile.score.toLocaleString('vi-VN')}</strong>
            <span className="is-positive">+24 hôm nay</span>
          </div>
          <div>
            <small>Điểm cao nhất</small>
            <strong>{gameProfile.peakScore.toLocaleString('vi-VN')}</strong>
            <span>Kỷ lục cá nhân</span>
          </div>
          <div>
            <small>Trái tim</small>
            <strong>❤️❤️❤️❤️❤️</strong>
            <span>5/5</span>
          </div>
        </div>
        <div className="profile-progress">
          <span>✦</span>
          <div>
            <p>
              <span>Tiến độ lên hạng Cao Thủ</span>
              <b>243 / 500 điểm</b>
            </p>
            <i>
              <em />
            </i>
          </div>
          <span>🐷</span>
        </div>
      </div>

      <div className="profile-page-layout">
        <main>
          <section className="rank-system-section">
            <div className="game-section-head game-section-head--outside">
              <h2>◉ Hệ thống hạng</h2>
            </div>
            <div className="rank-tier-grid">
              {rankTiers.map((tier) => (
                <article className={tier.name === 'Kỳ Thủ' ? 'is-current' : ''} key={tier.name}>
                  <strong>{tier.icon}</strong>
                  <b>{tier.name}</b>
                  <span>{tier.range}</span>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="game-section-head game-section-head--outside">
              <h2>◉ Thống kê tổng quan</h2>
            </div>
            <div className="profile-stat-grid">
              <Stat label="Tổng trận" value={gameProfile.totalMatches} tone="violet" />
              <Stat
                label="Thắng"
                value={gameProfile.wins}
                detail={`${gameProfile.winRate}%`}
                tone="green"
              />
              <Stat label="Thua" value={gameProfile.losses} detail="33,1%" tone="red" />
              <Stat label="Hòa" value={gameProfile.draws} detail="8,9%" tone="orange" />
              <Stat label="Chuỗi thắng hiện tại" value={gameProfile.currentStreak} tone="violet" />
              <Stat label="Chuỗi thắng cao nhất" value={gameProfile.longestStreak} tone="violet" />
            </div>
          </section>

          <div className="profile-mode-grid">
            <section className="game-panel">
              <div className="game-section-head">
                <h2>✦ Đấu hạng</h2>
                <span>{gameProfile.rankedMatches} trận</span>
              </div>
              <div>
                <Stat label="Tỷ lệ thắng" value="61,0%" tone="violet" />
                <Stat label="Điểm cao nhất" value="1.487" tone="violet" />
                <Stat label="Chuỗi thắng" value={gameProfile.longestStreak} tone="violet" />
              </div>
              <div className="profile-sparkline">⌁⌁╱╲⌁╱╲╱⌁╱</div>
            </section>
            <section className="game-panel">
              <div className="game-section-head">
                <h2>♣ Đấu thường</h2>
                <span>{gameProfile.friendlyMatches} trận</span>
              </div>
              <div>
                <Stat label="Tỷ lệ thắng" value="54,1%" tone="green" />
                <Stat label="Thắng lớn nhất" value="9 chuỗi" tone="green" />
                <Stat label="Hòa nhiều nhất" value="4 trận" tone="green" />
              </div>
              <div className="profile-sparkline is-green">⌁╱⌁⌁╱⌁╱╲⌁╱</div>
            </section>
          </div>
          <RecentMatches limit={4} />
        </main>

        <aside className="profile-side-column">
          <OnlineFriends compact />
          <section className="game-panel achievement-card">
            <div className="game-section-head">
              <h2>Thành tích nổi bật</h2>
            </div>
            <div>
              <span>
                <b>✚</b>
                <small>Chiến thắng đầu tiên</small>
              </span>
              <span>
                <b>◉</b>
                <small>Chuỗi thắng 10</small>
              </span>
              <span>
                <b>✦</b>
                <small>Kỳ Thủ tài năng</small>
              </span>
              <span>
                <b>♛</b>
                <small>Bách chiến bách thắng</small>
              </span>
              <span>
                <b>♨</b>
                <small>Cao thủ tương lai</small>
              </span>
              <span>
                <b>♕</b>
                <small>Thách đấu bất bại</small>
              </span>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone: string;
}) {
  return (
    <div className={`profile-stat is-${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}
