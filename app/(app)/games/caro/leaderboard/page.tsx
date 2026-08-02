import Link from 'next/link';
import { GamePageTitle, GameTopbar } from '@/components/game-ui';
import { requireUser } from '@/lib/auth';
import { ensureGameProfile, getCaroRank, getLeaderboard } from '@/lib/game';

export const metadata = { title: 'Bảng xếp hạng Cờ Caro XO' };

export default async function CaroLeaderboardPage() {
  const user = await requireUser();
  const [players, ownProfile] = await Promise.all([getLeaderboard(), ensureGameProfile(user.id)]);
  const ownPosition = players.findIndex((player) => player.userId === user.id) + 1;
  const podium = players.slice(0, 3);

  return (
    <>
      <GameTopbar playerName={user.displayName || 'Heo Xinh'} />
      <GamePageTitle
        icon="🏆"
        title="Bảng xếp hạng"
        description="Dữ liệu điểm hạng chính thức được xác nhận từ máy chủ."
      />
      <div className="leaderboard-page-layout">
        <main className="leaderboard-main game-panel">
          <div className="leaderboard-tabs">
            <button className="is-active" type="button">
              Top điểm Elo
            </button>
            <span>Tối đa 100 kỳ thủ</span>
          </div>
          <div className="leaderboard-podium">
            {podium.map((player) => (
              <article className={`is-rank-${players.indexOf(player) + 1}`} key={player.userId}>
                <b>
                  {players.indexOf(player) === 0
                    ? '🥇'
                    : players.indexOf(player) === 1
                      ? '🥈'
                      : '🥉'}
                </b>
                <span className="game-avatar game-avatar--xl">{player.avatar}</span>
                <h2>{player.user.displayName || player.playerCode}</h2>
                <p>{getCaroRank(player.rating).name}</p>
                <strong>{player.rating.toLocaleString('vi-VN')}</strong>
              </article>
            ))}
          </div>
          <div className="leaderboard-table" role="table">
            <div className="leaderboard-table__head" role="row">
              <span>Hạng</span>
              <span>Kỳ thủ</span>
              <span>Cấp bậc</span>
              <span>Điểm</span>
              <span>Trận hạng</span>
            </div>
            {players.slice(3).map((player, index) => (
              <div
                className={player.userId === user.id ? 'is-current' : ''}
                role="row"
                key={player.userId}
              >
                <b>#{index + 4}</b>
                <span>
                  <i className="game-avatar">{player.avatar}</i>
                  <strong>{player.user.displayName || player.playerCode}</strong>
                </span>
                <span>{getCaroRank(player.rating).name}</span>
                <strong>{player.rating.toLocaleString('vi-VN')}</strong>
                <span>{player.rankedWins + player.rankedLosses + player.rankedDraws}</span>
              </div>
            ))}
          </div>
          {!players.length && <p className="friends-empty">Chưa có dữ liệu xếp hạng.</p>}
        </main>
        <aside className="leaderboard-side">
          <section className="game-panel leaderboard-me">
            <span className="game-avatar game-avatar--xl">{ownProfile.avatar}</span>
            <h2>Hạng của bạn</h2>
            <strong>{ownPosition ? `#${ownPosition}` : 'Ngoài top 100'}</strong>
            <p>
              {user.displayName} · {getCaroRank(ownProfile.rating).name}
            </p>
            <b>{ownProfile.rating.toLocaleString('vi-VN')} điểm</b>
            <Link className="game-primary-button" href="/games/caro">
              Chơi để tăng hạng
            </Link>
          </section>
          <section className="game-panel leaderboard-rules">
            <h2>Elo phía máy chủ</h2>
            <p>Thắng người mạnh được nhiều điểm hơn.</p>
            <p>Hòa vẫn thay đổi nhẹ theo chênh lệch.</p>
            <p>Phòng riêng không ảnh hưởng điểm.</p>
            <small>Mức K hiện tại là 32; điểm không bao giờ thấp hơn 0.</small>
          </section>
        </aside>
      </div>
    </>
  );
}
