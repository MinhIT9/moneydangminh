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
import { CreateRoomButton } from '@/components/caro-actions';
import { requireUser } from '@/lib/auth';
import { getCaroRank, getGameOverview } from '@/lib/game';

export const metadata = {
  title: 'Trung tâm trò chơi',
};

export default async function GamesPage() {
  const user = await requireUser();
  const playerName = user.displayName || 'Heo Xinh';
  const overview = await getGameOverview(user.id);
  const rankedMatches =
    overview.profile.rankedWins + overview.profile.rankedLosses + overview.profile.rankedDraws;
  const friendlyMatches =
    overview.profile.friendlyWins +
    overview.profile.friendlyLosses +
    overview.profile.friendlyDraws;
  const totalMatches = rankedMatches + friendlyMatches;
  const wins = overview.profile.rankedWins + overview.profile.friendlyWins;
  const profileView = {
    playerId: overview.profile.playerCode,
    score: overview.profile.rating,
    peakScore: overview.profile.peakRating,
    rank: getCaroRank(overview.profile.rating).name,
    rankShort: getCaroRank(overview.profile.rating).short,
    hearts: overview.profile.hearts,
    totalMatches,
    wins,
    losses: overview.profile.rankedLosses + overview.profile.friendlyLosses,
    draws: overview.profile.rankedDraws + overview.profile.friendlyDraws,
    winRate: totalMatches ? Math.round((wins / totalMatches) * 100) : 0,
    currentStreak: overview.profile.currentWinStreak,
    longestStreak: overview.profile.longestWinStreak,
    rankedMatches,
    friendlyMatches,
  };
  const friendItems = overview.friendships.map((relationship) => {
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
          ? 'Đang chơi Cờ Caro'
          : friend.gameProfile?.presence === 'OFFLINE'
            ? 'Ngoại tuyến'
            : 'Đang online',
      score: friend.gameProfile?.rating ?? 500,
    };
  });
  const matchItems = overview.recentMatches.map((match) => {
    const opponent = match.playerXId === user.id ? match.playerO : match.playerX;
    const won = match.winnerId === user.id;
    return {
      id: match.id,
      opponent: opponent.displayName || 'Kỳ thủ',
      avatar: opponent.gameProfile?.avatar ?? '🐷',
      result:
        match.status === 'DRAW' ? ('DRAW' as const) : won ? ('WIN' as const) : ('LOSS' as const),
      score: match.status === 'DRAW' ? '½ - ½' : won ? '1 - 0' : '0 - 1',
      ratingChange:
        match.playerXId === user.id ? (match.playerXChange ?? 0) : (match.playerOChange ?? 0),
      playedAt: match.endedAt
        ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
            match.endedAt,
          )
        : '—',
      mode: match.mode,
    };
  });
  const leaderboardItems = overview.leaderboard.slice(0, 6).map((entry, index) => ({
    rank: index + 1,
    name: entry.user.displayName || entry.playerCode,
    avatar: entry.avatar,
    tier: getCaroRank(entry.rating).name,
    score: entry.rating,
  }));

  return (
    <>
      <GameTopbar playerName={playerName} unreadNotifications={overview.unreadNotifications} />
      <GamePageTitle
        icon="🎮"
        title="Trung tâm trò chơi"
        description="Giải trí mỗi ngày — Rèn luyện tư duy — Kết nối bạn bè"
      />

      <div className="game-layout game-layout--sidebar">
        <main className="game-main-column">
          <GameProfileStrip playerName={playerName} profile={profileView} />

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
                <CreateRoomButton />
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

          <RecentMatches items={matchItems} />
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
          <OnlineFriends compact items={friendItems} />
          <QuickLeaderboard items={leaderboardItems} />
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
