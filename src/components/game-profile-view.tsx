import Link from 'next/link';
import type { getPublicGameProfile } from '@/lib/game';
import { getCaroRank } from '@/lib/game';

type ProfileData = Awaited<ReturnType<typeof getPublicGameProfile>>;

const tiers = [
  ['Nhập Môn', '0 – 199', '⬡'],
  ['Tập Sự', '200 – 399', '⬢'],
  ['Kỳ Thủ', '400 – 799', '✦'],
  ['Cao Thủ', '800 – 1.199', '◆'],
  ['Danh Thủ', '1.200 – 1.599', '♛'],
  ['Đại Sư', '1.600 – 1.999', '✺'],
  ['Kỳ Vương', '2.000+', '♕'],
];

export function GameProfileView({ data, isOwner }: { data: ProfileData; isOwner: boolean }) {
  const { profile, matches } = data;
  const ranked = profile.rankedWins + profile.rankedLosses + profile.rankedDraws;
  const friendly = profile.friendlyWins + profile.friendlyLosses + profile.friendlyDraws;
  const total = ranked + friendly;
  const wins = profile.rankedWins + profile.friendlyWins;
  const losses = profile.rankedLosses + profile.friendlyLosses;
  const draws = profile.rankedDraws + profile.friendlyDraws;
  const winRate = total ? Math.round((wins / total) * 1000) / 10 : 0;
  const rank = getCaroRank(profile.rating);

  return (
    <>
      <div className="profile-hero game-panel">
        <div className="game-player-identity">
          <span className="game-avatar game-avatar--xl">{profile.avatar}</span>
          <div>
            <h1>{profile.user.displayName || profile.playerCode}</h1>
            <span className="game-rank-pill">{rank.name}</span>
            <small>ID: {profile.playerCode}</small>
          </div>
        </div>
        <div className="profile-hero__metrics">
          <div>
            <small>Hạng hiện tại</small>
            <strong>✦</strong>
            <span>{rank.short}</span>
          </div>
          <div>
            <small>Điểm hiện tại</small>
            <strong>{profile.rating.toLocaleString('vi-VN')}</strong>
            <span>{profile.presence}</span>
          </div>
          <div>
            <small>Điểm cao nhất</small>
            <strong>{profile.peakRating.toLocaleString('vi-VN')}</strong>
            <span>Kỷ lục cá nhân</span>
          </div>
          <div>
            <small>Trái tim</small>
            <strong>{'❤️'.repeat(profile.hearts)}</strong>
            <span>{profile.hearts}/5</span>
          </div>
        </div>
        <div className="profile-progress">
          <span>✦</span>
          <div>
            <p>
              <span>
                {rank.nextAt
                  ? `Tiến độ lên mốc ${rank.nextAt.toLocaleString('vi-VN')}`
                  : 'Đã đạt hạng cao nhất'}
              </span>
              <b>{profile.rating.toLocaleString('vi-VN')} điểm</b>
            </p>
            <i>
              <em
                style={{
                  width: rank.nextAt
                    ? `${Math.min(100, (profile.rating / rank.nextAt) * 100)}%`
                    : '100%',
                }}
              />
            </i>
          </div>
          <span>🐷</span>
        </div>
      </div>
      <section className="rank-system-section">
        <div className="game-section-head game-section-head--outside">
          <h2>◉ Hệ thống hạng</h2>
        </div>
        <div className="rank-tier-grid">
          {tiers.map((tier) => (
            <article className={tier[0] === rank.name ? 'is-current' : ''} key={tier[0]}>
              <strong>{tier[2]}</strong>
              <b>{tier[0]}</b>
              <span>{tier[1]}</span>
            </article>
          ))}
        </div>
      </section>
      <section>
        <div className="game-section-head game-section-head--outside">
          <h2>◉ Thống kê tổng quan</h2>
          {!isOwner && data.friendship?.status === 'ACCEPTED' && <span>✓ Bạn bè</span>}
        </div>
        <div className="profile-stat-grid">
          <Stat label="Tổng trận" value={total} tone="violet" />
          <Stat label="Thắng" value={wins} detail={`${winRate}%`} tone="green" />
          <Stat label="Thua" value={losses} tone="red" />
          <Stat label="Hòa" value={draws} tone="orange" />
          <Stat label="Chuỗi hiện tại" value={profile.currentWinStreak} tone="violet" />
          <Stat label="Chuỗi cao nhất" value={profile.longestWinStreak} tone="violet" />
        </div>
      </section>
      <div className="profile-mode-grid">
        <section className="game-panel">
          <div className="game-section-head">
            <h2>✦ Đấu hạng</h2>
            <span>{ranked} trận</span>
          </div>
          <div>
            <Stat label="Thắng" value={profile.rankedWins} tone="violet" />
            <Stat label="Thua" value={profile.rankedLosses} tone="red" />
            <Stat label="Hòa" value={profile.rankedDraws} tone="orange" />
          </div>
        </section>
        <section className="game-panel">
          <div className="game-section-head">
            <h2>♣ Giao hữu</h2>
            <span>{friendly} trận</span>
          </div>
          <div>
            <Stat label="Thắng" value={profile.friendlyWins} tone="green" />
            <Stat label="Thua" value={profile.friendlyLosses} tone="red" />
            <Stat label="Hòa" value={profile.friendlyDraws} tone="orange" />
          </div>
        </section>
      </div>
      <section className="game-panel game-match-history">
        <div className="game-section-head">
          <h2>◷ Lịch sử thi đấu</h2>
          <span>{matches.length} trận gần nhất</span>
        </div>
        <div>
          {matches.map((match) => {
            const opponent = match.playerXId === profile.userId ? match.playerO : match.playerX;
            const won = match.winnerId === profile.userId;
            return (
              <div className="game-match-row" key={match.id}>
                <span
                  className={`match-result ${match.status === 'DRAW' ? 'is-draw' : won ? 'is-win' : 'is-loss'}`}
                >
                  {match.status === 'DRAW' ? 'Hòa' : won ? 'Thắng' : 'Thua'}
                </span>
                <span className="game-avatar">
                  {match.playerXId === profile.userId ? '👧🏻' : '👦🏻'}
                </span>
                <div>
                  <strong>{opponent.displayName || 'Kỳ thủ'}</strong>
                  <small>{match.mode === 'RANKED' ? 'Đấu hạng' : 'Giao hữu'}</small>
                </div>
                <span>
                  {match.endedAt ? new Intl.DateTimeFormat('vi-VN').format(match.endedAt) : '—'}
                </span>
                <strong>
                  {match.playerXId === profile.userId ? match.playerXChange : match.playerOChange}
                </strong>
                <Link href={`/games/caro/match/${match.id}`}>Xem</Link>
              </div>
            );
          })}
          {!matches.length && <p className="friends-empty">Chưa có trận đấu đã hoàn thành.</p>}
        </div>
      </section>
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
