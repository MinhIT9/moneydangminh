import Image from 'next/image';
import { CreateRoomButton, MatchmakingButton, RoomJoinForm } from '@/components/caro-actions';
import {
  GameProfileStrip,
  GameTopbar,
  OnlineFriends,
  QuickLeaderboard,
  RecentMatches,
} from '@/components/game-ui';
import { requireUser } from '@/lib/auth';
import { getCaroRank, getGameOverview } from '@/lib/game';

export const metadata = { title: 'Cờ Caro XO' };

export default async function CaroLobbyPage() {
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
          <GameProfileStrip playerName={playerName} profile={profileView} />

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
              <CreateRoomButton />
              <RoomJoinForm />
            </article>
          </section>

          <RecentMatches items={matchItems} />
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
          <OnlineFriends compact items={friendItems} />
          <QuickLeaderboard items={leaderboardItems} />
        </aside>
      </div>
    </>
  );
}
