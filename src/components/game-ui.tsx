import Link from 'next/link';
import {
  formatGameScore,
  gameFriends,
  gameProfile,
  leaderboard,
  recentMatches,
} from '@/lib/game-mock';
import { InviteFriendButton } from '@/components/invite-friend-button';

export function GameTopbar({
  playerName,
  unreadNotifications = 0,
}: {
  playerName: string;
  unreadNotifications?: number;
}) {
  return (
    <header className="game-topbar">
      <nav aria-label="Điều hướng nhanh khu trò chơi">
        <Link href="/games">Trung tâm trò chơi</Link>
        <span>/</span>
        <Link href="/games/caro">Cờ Caro XO</Link>
      </nav>
      <div className="game-topbar__actions">
        <button type="button">
          🎁 <span>Điểm danh</span>
        </button>
        <button className="game-notification" type="button" aria-label="Thông báo">
          🔔{unreadNotifications > 0 && <b>{Math.min(99, unreadNotifications)}</b>}
        </button>
        <Link className="game-user-chip" href="/games/caro/profile">
          <span>🐷</span>
          <strong>Chào, {playerName}</strong>
        </Link>
      </div>
    </header>
  );
}

export function GamePageTitle({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="game-page-title">
      <span aria-hidden="true">{icon}</span>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function GameProfileStrip({
  playerName,
  profile = gameProfile,
}: {
  playerName: string;
  profile?: typeof gameProfile;
}) {
  return (
    <section className="game-profile-strip game-panel">
      <div className="game-player-identity">
        <span className="game-avatar game-avatar--large">🐷</span>
        <div>
          <strong>{playerName}</strong>
          <span className="game-rank-pill">{profile.rank}</span>
          <small>ID: {profile.playerId}</small>
        </div>
      </div>
      <GameMetric
        label="Sinh lực"
        value={'❤️'.repeat(profile.hearts)}
        detail={`${profile.hearts}/5`}
      />
      <GameMetric label="Hạng" value="✦" detail={profile.rankShort} accent />
      <GameMetric
        label="Điểm xếp hạng"
        value={formatGameScore(profile.score)}
        detail={`Cao nhất ${formatGameScore(profile.peakScore)}`}
        accent
      />
      <GameMetric
        label="Tỷ lệ thắng"
        value={`${profile.winRate}%`}
        detail={`${profile.wins ?? 0} thắng`}
      />
      <GameMetric label="Tổng trận" value={String(profile.totalMatches)} detail="Đã tham gia" />
      <div className="game-profile-strip__message">
        <span>🐷</span>
        <p>Cố lên! Mỗi ván cờ là một bước tiến đến đỉnh cao! ✨</p>
      </div>
    </section>
  );
}

function GameMetric({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className={`game-metric${accent ? ' is-accent' : ''}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function OnlineFriends({
  compact = false,
  items = gameFriends,
  roomCode,
}: {
  compact?: boolean;
  items?: typeof gameFriends;
  roomCode?: string;
}) {
  const friends = compact ? items.slice(0, 4) : items;

  return (
    <section className="game-panel game-side-card">
      <div className="game-section-head">
        <h2>Bạn bè đang online</h2>
        <span className="game-count">12</span>
      </div>
      <div className="game-friend-list">
        {friends.map((friend) => (
          <div className="game-friend" key={friend.id}>
            <span className="game-avatar">{friend.avatar}</span>
            <div>
              <strong>
                {friend.name} <i className={`presence is-${friend.status.toLowerCase()}`} />
              </strong>
              <small>{friend.detail}</small>
            </div>
            {roomCode ? (
              <InviteFriendButton
                friendId={friend.id}
                roomCode={roomCode}
                disabled={friend.status === 'PLAYING' || friend.status === 'OFFLINE'}
              />
            ) : (
              <button
                type="button"
                disabled={friend.status === 'PLAYING' || friend.status === 'OFFLINE'}
              >
                {friend.status === 'PLAYING' ? 'Đang chơi' : 'Mời chơi'}
              </button>
            )}
          </div>
        ))}
      </div>
      <Link className="game-text-link" href="/games/friends">
        Xem tất cả bạn bè →
      </Link>
    </section>
  );
}

export function RecentMatches({
  limit = 4,
  items = recentMatches,
}: {
  limit?: number;
  items?: typeof recentMatches;
}) {
  return (
    <section className="game-panel game-match-history">
      <div className="game-section-head">
        <h2>◷ Lịch sử thi đấu gần đây</h2>
        <Link href="/games/caro/profile">Xem hồ sơ →</Link>
      </div>
      <div>
        {items.slice(0, limit).map((match) => (
          <div className="game-match-row" key={match.id}>
            <span className={`match-result is-${match.result.toLowerCase()}`}>
              {match.result === 'WIN' ? 'Thắng' : match.result === 'LOSS' ? 'Thua' : 'Hòa'}
            </span>
            <span className="game-avatar">{match.avatar}</span>
            <div>
              <strong>{match.opponent}</strong>
              <small>{match.mode === 'RANKED' ? 'Đấu hạng' : 'Giao hữu'}</small>
            </div>
            <span>{match.playedAt}</span>
            <strong>{match.score}</strong>
            <Link href={`/games/caro/match/${match.id}`}>Xem lại</Link>
          </div>
        ))}
      </div>
      {!items.length && <p className="friends-empty">Chưa có trận đấu đã hoàn thành.</p>}
    </section>
  );
}

export function QuickLeaderboard({ items = leaderboard }: { items?: typeof leaderboard }) {
  return (
    <section className="game-panel game-side-card game-leaderboard">
      <div className="game-section-head">
        <h2>🏆 Bảng xếp hạng</h2>
        <Link href="/games/caro/leaderboard">Đầy đủ →</Link>
      </div>
      <div>
        {items.map((player) => (
          <div className={player.name === 'Heo Xinh' ? 'is-current' : ''} key={player.rank}>
            <b>{player.rank}</b>
            <span className="game-avatar">{player.avatar}</span>
            <span>
              <strong>{player.name}</strong>
              <small>{player.tier}</small>
            </span>
            <strong>{formatGameScore(player.score)}</strong>
          </div>
        ))}
      </div>
      {!items.length && <p className="friends-empty">Chưa có dữ liệu xếp hạng.</p>}
    </section>
  );
}
