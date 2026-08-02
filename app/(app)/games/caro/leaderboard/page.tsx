import Link from 'next/link';
import { GamePageTitle, GameTopbar } from '@/components/game-ui';
import { formatGameScore, leaderboard } from '@/lib/game-mock';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Bảng xếp hạng Cờ Caro XO' };

const extraPlayers = [
  ['Gia Hân', '👧🏻', 'Kim Cương I', 1530],
  ['Đức Anh', '👦🏻', 'Kim Cương II', 1468],
  ['Mai Chi', '👩🏻', 'Kim Cương II', 1412],
  ['Hoàng Nam', '🧑🏻', 'Kim Cương III', 1365],
  ['Lan Anh', '👩🏻‍🎓', 'Kim Cương III', 1298],
  ['Tuấn Kiệt', '👨🏻', 'Kim Cương III', 1270],
] as const;

export default async function CaroLeaderboardPage() {
  const user = await requireUser();
  const playerName = user.displayName || 'Heo Xinh';
  const players = [
    ...leaderboard.filter((player) => player.rank <= 5),
    ...extraPlayers.map((player, index) => ({
      rank: index + 6,
      name: player[0],
      avatar: player[1],
      tier: player[2],
      score: player[3],
    })),
    leaderboard.at(-1)!,
  ];

  return (
    <>
      <GameTopbar playerName={playerName} />
      <GamePageTitle
        icon="🏆"
        title="Bảng xếp hạng"
        description="Tôn vinh những kỳ thủ xuất sắc nhất Cờ Caro XO."
      />
      <div className="leaderboard-page-layout">
        <main className="leaderboard-main game-panel">
          <div className="leaderboard-tabs">
            <button className="is-active" type="button">
              Toàn hệ thống
            </button>
            <button type="button">Bạn bè</button>
            <button type="button">Tháng này</button>
            <span>Cập nhật ít phút trước</span>
          </div>
          <div className="leaderboard-podium">
            {players.slice(0, 3).map((player) => (
              <article className={`is-rank-${player.rank}`} key={player.rank}>
                <b>{player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}</b>
                <span className="game-avatar game-avatar--xl">{player.avatar}</span>
                <h2>{player.name}</h2>
                <p>{player.tier}</p>
                <strong>{formatGameScore(player.score)}</strong>
              </article>
            ))}
          </div>
          <div className="leaderboard-table" role="table">
            <div className="leaderboard-table__head" role="row">
              <span>Hạng</span>
              <span>Kỳ thủ</span>
              <span>Cấp bậc</span>
              <span>Điểm</span>
              <span>Trạng thái</span>
            </div>
            {players.slice(3).map((player) => (
              <div
                className={player.name === 'Heo Xinh' ? 'is-current' : ''}
                role="row"
                key={`${player.rank}-${player.name}`}
              >
                <b>#{player.rank}</b>
                <span>
                  <i className="game-avatar">{player.avatar}</i>
                  <strong>{player.name}</strong>
                </span>
                <span>{player.tier}</span>
                <strong>{formatGameScore(player.score)}</strong>
                <span className="is-positive">↑ Đang tăng</span>
              </div>
            ))}
          </div>
        </main>
        <aside className="leaderboard-side">
          <section className="game-panel leaderboard-me">
            <span className="game-avatar game-avatar--xl">🐷</span>
            <h2>Hạng của bạn</h2>
            <strong>#12</strong>
            <p>Heo Xinh · Kim Cương III</p>
            <b>1.257 điểm</b>
            <small>Còn 18 điểm để vượt hạng 11</small>
            <Link className="game-primary-button" href="/games/caro">
              Chơi để tăng hạng
            </Link>
          </section>
          <section className="game-panel leaderboard-rules">
            <h2>Điểm xếp hạng</h2>
            <p>
              <b className="is-positive">+24</b> khi thắng
            </p>
            <p>
              <b>+6</b> khi hòa
            </p>
            <p>
              <b className="is-negative">−18</b> khi thua
            </p>
            <small>Điểm có thể thay đổi theo chênh lệch trình độ hai người chơi.</small>
          </section>
        </aside>
      </div>
    </>
  );
}
