'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  offerCaroDrawAction,
  playCaroMoveAction,
  readyForPrivateRoomRematchAction,
  respondCaroDrawAction,
  sendMatchMessageAction,
  surrenderCaroMatchAction,
} from '@/actions/game';
import {
  CARO_BOARD_SIZE,
  caroCoordinate,
  findCaroWinningLine,
  type CaroCell,
  type CaroMark,
} from '@/lib/caro';
import { MatchmakingButton } from '@/components/caro-actions';

export type CaroMatchState = {
  id: string;
  status: 'ACTIVE' | 'X_WON' | 'O_WON' | 'DRAW' | 'CANCELLED';
  mode: 'RANKED' | 'FRIENDLY';
  resultReason: string | null;
  currentTurn: CaroMark;
  turnStartedAt: string;
  serverNow: string;
  turnSeconds: number;
  roomCode: string | null;
  playerXChange: number | null;
  playerOChange: number | null;
  drawOfferedById: string | null;
  currentUserId: string;
  playerX: MatchPlayer;
  playerO: MatchPlayer;
  moves: Array<{ id: string; moveNumber: number; mark: CaroMark; row: number; column: number }>;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
  }>;
};

type MatchPlayer = { id: string; name: string; avatar: string; rating: number; hearts: number };

export function CaroMatch({ initialState }: { initialState: CaroMatchState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seconds, setSeconds] = useState(initialState.turnSeconds);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const active = initialState.status === 'ACTIVE';
  const [dismissedResultId, setDismissedResultId] = useState<string | null>(null);
  const resultModalOpen = !active && dismissedResultId !== initialState.id;
  const myMark: CaroMark = initialState.playerX.id === initialState.currentUserId ? 'X' : 'O';
  const myTurn = active && initialState.currentTurn === myMark;
  const won = initialState.status === `${myMark}_WON`;
  const myRatingChange =
    (myMark === 'X' ? initialState.playerXChange : initialState.playerOChange) ?? 0;

  useEffect(() => {
    if (!resultModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDismissedResultId(initialState.id);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [initialState.id, resultModalOpen]);

  useEffect(() => {
    const serverOffset = new Date(initialState.serverNow).getTime() - Date.now();
    const updateClock = () =>
      setSeconds(
        Math.max(
          0,
          initialState.turnSeconds -
            Math.floor(
              (Date.now() + serverOffset - new Date(initialState.turnStartedAt).getTime()) / 1000,
            ),
        ),
      );
    updateClock();
    const clock = window.setInterval(updateClock, 1000);
    const polling = active ? window.setInterval(() => router.refresh(), 1000) : undefined;
    return () => {
      window.clearInterval(clock);
      if (polling) window.clearInterval(polling);
    };
  }, [
    active,
    initialState.serverNow,
    initialState.turnSeconds,
    initialState.turnStartedAt,
    router,
  ]);

  const board = useMemo(() => {
    const cells: CaroCell[] = Array.from({ length: CARO_BOARD_SIZE ** 2 }, () => null);
    for (const move of initialState.moves)
      cells[move.row * CARO_BOARD_SIZE + move.column] = move.mark;
    return cells;
  }, [initialState.moves]);
  const latestMove = initialState.moves.at(-1);
  const latestIndex = latestMove ? latestMove.row * CARO_BOARD_SIZE + latestMove.column : null;
  const winningSet = useMemo(
    () =>
      new Set(
        latestIndex !== null && initialState.resultReason === 'FIVE_IN_ROW'
          ? findCaroWinningLine(board, latestIndex)
          : [],
      ),
    [board, initialState.resultReason, latestIndex],
  );

  function play(index: number) {
    if (!myTurn || board[index] || pending) return;
    const row = Math.floor(index / CARO_BOARD_SIZE);
    const column = index % CARO_BOARD_SIZE;
    setError('');
    startTransition(async () => {
      const result = await playCaroMoveAction(initialState.id, row, column);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function surrender() {
    if (!active || !window.confirm('Bạn chắc chắn muốn đầu hàng trận này?')) return;
    startTransition(async () => {
      const result = await surrenderCaroMatchAction(initialState.id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function drawAction(action: 'offer' | 'accept' | 'decline') {
    startTransition(async () => {
      const result =
        action === 'offer'
          ? await offerCaroDrawAction(initialState.id)
          : await respondCaroDrawAction(initialState.id, action === 'accept');
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function sendMessage(text = chatInput, quick = false) {
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await sendMatchMessageAction(initialState.id, text, quick);
      if (!result.ok) setError(result.error);
      else setChatInput('');
      router.refresh();
    });
  }

  function readyForNextRound() {
    if (!initialState.roomCode) return;
    setError('');
    startTransition(async () => {
      const result = await readyForPrivateRoomRematchAction(initialState.roomCode!);
      if (!result.ok) setError(result.error);
      else router.push(`/games/caro/room/${result.data.code}`);
    });
  }

  const statusText = active
    ? myTurn
      ? `Đến lượt bạn đặt quân ${myMark}`
      : `Đang chờ đối thủ đặt quân ${initialState.currentTurn}`
    : initialState.status === 'DRAW'
      ? 'Trận đấu hòa'
      : initialState.status === `${myMark}_WON`
        ? 'Bạn đã chiến thắng!'
        : 'Bạn đã thua trận';

  function continueAfterResult() {
    setDismissedResultId(initialState.id);
    window.setTimeout(() => {
      document.getElementById('caro-next-actions')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 50);
  }

  return (
    <>
      {resultModalOpen && !active && (
        <div
          className="caro-result-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDismissedResultId(initialState.id);
          }}
        >
          <section
            className={`caro-result-dialog${won ? ' is-win' : initialState.status === 'DRAW' ? ' is-draw' : ' is-loss'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="caro-result-title"
          >
            {won && (
              <div className="caro-result-confetti" aria-hidden="true">
                {Array.from({ length: 14 }, (_, index) => (
                  <i key={index} />
                ))}
              </div>
            )}
            <button
              className="caro-result-dialog__close"
              type="button"
              aria-label="Đóng thông báo kết quả"
              onClick={() => setDismissedResultId(initialState.id)}
            >
              ×
            </button>
            <span className="caro-result-dialog__mascot" aria-hidden="true">
              {initialState.status === 'DRAW' ? '🤝' : won ? '🐷🏆' : '🐷💪'}
            </span>
            <small>
              {won
                ? 'TUYỆT VỜI!'
                : initialState.status === 'DRAW'
                  ? 'BẤT PHÂN THẮNG BẠI'
                  : 'CỐ LÊN NHÉ!'}
            </small>
            <h1 id="caro-result-title">
              {won
                ? 'Chúc mừng bạn chiến thắng!'
                : initialState.status === 'DRAW'
                  ? 'Hai kỳ thủ đã hòa nhau'
                  : 'Bạn đã thi đấu rất tốt'}
            </h1>
            <p>
              {won
                ? 'Một ván đấu xuất sắc! Hãy giữ vững phong độ và tiếp tục chuỗi chiến thắng.'
                : initialState.status === 'DRAW'
                  ? 'Ván đấu cân tài cân sức. Hãy thử thêm một hiệp để tìm ra người chiến thắng.'
                  : 'Mỗi ván cờ đều giúp bạn tiến bộ. Sẵn sàng trở lại mạnh mẽ hơn nhé!'}
            </p>
            {initialState.mode === 'RANKED' && (
              <strong className="caro-result-dialog__rating">
                Điểm Caro {myRatingChange >= 0 ? '+' : ''}
                {myRatingChange}
              </strong>
            )}
            <div className="caro-result-dialog__actions">
              <button
                className="game-primary-button"
                type="button"
                autoFocus
                onClick={continueAfterResult}
              >
                {initialState.roomCode ? '🎮 Chuẩn bị hiệp mới' : '🎮 Chơi trận tiếp theo'}
              </button>
              <button
                className="game-secondary-button"
                type="button"
                onClick={() => setDismissedResultId(initialState.id)}
              >
                👀 Xem lại bàn cờ
              </button>
              <Link className="caro-result-dialog__lobby" href="/games/caro">
                Thoát về sảnh
              </Link>
            </div>
          </section>
        </div>
      )}
      <div className="match-status game-panel" aria-live="polite">
        <span>✦ {initialState.mode === 'RANKED' ? 'Đấu xếp hạng' : 'Giao hữu'}</span>
        <strong>{statusText}</strong>
        <span>
          {error ||
            (active ? `Còn ${seconds} giây` : `Kết thúc: ${initialState.resultReason ?? '—'}`)}
        </span>
      </div>
      {!active && (
        <section
          id="caro-next-actions"
          className={`match-result-panel game-panel${won ? ' is-win' : ''}`}
        >
          <span className="match-result-panel__icon" aria-hidden="true">
            {initialState.status === 'DRAW' ? '🤝' : won ? '🏆' : '🌱'}
          </span>
          <div>
            <small>TRẬN ĐẤU ĐÃ KẾT THÚC</small>
            <h1>{statusText}</h1>
            <p>
              {initialState.mode === 'RANKED'
                ? `Điểm thay đổi: ${myMark === 'X' ? initialState.playerXChange : initialState.playerOChange}`
                : 'Phòng riêng không ảnh hưởng điểm xếp hạng Caro.'}
            </p>
          </div>
          <div className="match-result-panel__actions">
            {initialState.mode === 'RANKED' ? (
              <MatchmakingButton />
            ) : (
              initialState.roomCode && (
                <button
                  className="game-primary-button"
                  type="button"
                  disabled={pending}
                  onClick={readyForNextRound}
                >
                  {pending ? 'Đang chuẩn bị…' : '✓ Sẵn sàng hiệp mới'}
                </button>
              )
            )}
            <Link className="game-secondary-button" href="/games/caro">
              ← Thoát về sảnh Caro
            </Link>
          </div>
        </section>
      )}
      <div className="caro-match-layout">
        <PlayerCard
          player={initialState.playerX}
          mark="X"
          active={active && initialState.currentTurn === 'X'}
          seconds={seconds}
          change={initialState.playerXChange}
        />
        <main className="caro-board-column">
          <div className="caro-board-wrap game-panel">
            <div className="caro-board" role="grid" aria-label="Bàn Cờ Caro XO 19 nhân 19">
              {board.map((cell, index) => (
                <button
                  className={`${cell ? `is-${cell.toLowerCase()}` : ''}${latestIndex === index ? ' is-latest' : ''}${winningSet.has(index) ? ' is-winning' : ''}`}
                  key={index}
                  type="button"
                  role="gridcell"
                  aria-label={`${caroCoordinate(index)}${cell ? `: quân ${cell}` : ': ô trống'}`}
                  disabled={Boolean(cell || !myTurn || pending)}
                  onClick={() => play(index)}
                >
                  {cell}
                </button>
              ))}
            </div>
          </div>
          <div className="caro-board-legend">
            <span>
              <b>{myMark}</b> quân của bạn
            </span>
            <span>
              <b>{myMark === 'X' ? 'O' : 'X'}</b> đối thủ
            </span>
            <span>
              <i /> nước mới nhất
            </span>
            <span>
              <em /> chuỗi chiến thắng
            </span>
          </div>
          {active && (
            <div className="match-actions game-panel">
              <button
                className="is-danger"
                type="button"
                disabled={!active || pending}
                onClick={surrender}
              >
                ⚑ Đầu hàng
              </button>
              {initialState.drawOfferedById &&
              initialState.drawOfferedById !== initialState.currentUserId ? (
                <>
                  <button
                    className="is-draw"
                    type="button"
                    disabled={pending}
                    onClick={() => drawAction('accept')}
                  >
                    ✓ Đồng ý hòa
                  </button>
                  <button type="button" disabled={pending} onClick={() => drawAction('decline')}>
                    × Từ chối
                  </button>
                </>
              ) : (
                <button
                  className="is-draw"
                  type="button"
                  disabled={
                    !active ||
                    pending ||
                    initialState.drawOfferedById === initialState.currentUserId
                  }
                  onClick={() => drawAction('offer')}
                >
                  {initialState.drawOfferedById ? 'Đang chờ phản hồi' : '🤝 Xin hòa'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setError('Báo lỗi đã được ghi nhận ở giao diện.')}
              >
                ⚠ Báo lỗi
              </button>
              <button type="button" onClick={() => router.refresh()}>
                ↻ Đồng bộ
              </button>
            </div>
          )}
        </main>
        <div className="match-opponent-column">
          <PlayerCard
            player={initialState.playerO}
            mark="O"
            active={active && initialState.currentTurn === 'O'}
            seconds={seconds}
            change={initialState.playerOChange}
          />
          <section className="match-chat game-panel">
            <div className="game-section-head">
              <h2>Trò chuyện</h2>
              <span>{initialState.messages.length}</span>
            </div>
            <div className="match-chat__messages">
              {initialState.messages.map((message) => (
                <div
                  className={message.senderId === initialState.currentUserId ? 'is-mine' : ''}
                  key={message.id}
                >
                  <p>{message.content}</p>
                  <time>
                    {new Intl.DateTimeFormat('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(message.createdAt))}
                  </time>
                </div>
              ))}
            </div>
            <div className="quick-chat">
              <button type="button" onClick={() => sendMessage('Nước này hay đấy! 🔥', true)}>
                🔥
              </button>
              <button type="button" onClick={() => sendMessage('Cảm ơn bạn! 😊', true)}>
                😊
              </button>
              <button type="button" onClick={() => sendMessage('Xin tái đấu nhé!', true)}>
                👋
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                maxLength={500}
                placeholder="Nhập tin nhắn…"
              />
              <button type="submit" disabled={pending}>
                ➤
              </button>
            </form>
          </section>
          <section className="move-history game-panel">
            <div className="game-section-head">
              <h2>Lịch sử nước đi</h2>
              <span>{initialState.moves.length}</span>
            </div>
            <ol>
              {initialState.moves.slice(-12).map((move) => (
                <li key={move.id}>
                  <span>{move.moveNumber}</span>
                  <b>{move.mark}</b>
                  <span>{caroCoordinate(move.row * CARO_BOARD_SIZE + move.column)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

function PlayerCard({
  player,
  mark,
  active,
  seconds,
  change,
}: {
  player: MatchPlayer;
  mark: CaroMark;
  active: boolean;
  seconds: number;
  change: number | null;
}) {
  return (
    <aside className={`match-player game-panel${active ? ' is-active' : ''}`}>
      <span className="turn-pill">{active ? `Đến lượt ${mark}` : `Quân ${mark}`}</span>
      <span className="game-avatar game-avatar--xl">{player.avatar}</span>
      <div className="match-player__identity">
        <h2>{player.name}</h2>
        <span className="game-rank-pill">✦ {player.rating.toLocaleString('vi-VN')} điểm</span>
      </div>
      <div className="match-player__score">
        <strong>
          {change === null
            ? player.rating.toLocaleString('vi-VN')
            : `${change >= 0 ? '+' : ''}${change}`}
        </strong>
        <span className="player-hearts">{'❤️'.repeat(player.hearts)}</span>
      </div>
      <div className="turn-clock">
        ◷ <b>00:{String(seconds).padStart(2, '0')}</b>
      </div>
    </aside>
  );
}
