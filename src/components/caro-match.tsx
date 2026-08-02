'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CARO_BOARD_SIZE,
  caroCoordinate,
  findCaroWinningLine,
  type CaroCell,
  type CaroMark,
} from '@/lib/caro';

type Move = { index: number; mark: CaroMark };
type ChatMessage = { id: number; mine: boolean; text: string; time: string };

const initialMoves: Move[] = [
  { index: 9 * CARO_BOARD_SIZE + 9, mark: 'X' },
  { index: 9 * CARO_BOARD_SIZE + 10, mark: 'O' },
  { index: 8 * CARO_BOARD_SIZE + 10, mark: 'X' },
  { index: 10 * CARO_BOARD_SIZE + 9, mark: 'O' },
  { index: 8 * CARO_BOARD_SIZE + 9, mark: 'X' },
  { index: 10 * CARO_BOARD_SIZE + 10, mark: 'O' },
];

function createInitialBoard() {
  const board: CaroCell[] = Array.from({ length: CARO_BOARD_SIZE ** 2 }, () => null);
  initialMoves.forEach((move) => (board[move.index] = move.mark));
  return board;
}

export function CaroMatch({ playerName }: { playerName: string }) {
  const [board, setBoard] = useState<CaroCell[]>(createInitialBoard);
  const [moves, setMoves] = useState<Move[]>(initialMoves);
  const [turn, setTurn] = useState<CaroMark>('X');
  const [winner, setWinner] = useState<CaroMark | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [draw, setDraw] = useState(false);
  const [turnSeconds, setTurnSeconds] = useState(45);
  const [notice, setNotice] = useState('Đến lượt bạn đặt quân X');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, mine: true, text: 'Chúc bạn may mắn! 🍀', time: '14:32' },
    { id: 2, mine: false, text: 'Cảm ơn bạn, cùng cố gắng nhé! 💪', time: '14:33' },
  ]);

  useEffect(() => {
    if (winner || draw) return;

    const timer = window.setInterval(() => {
      setTurnSeconds((seconds) => {
        if (seconds > 1) return seconds - 1;
        const nextTurn = turn === 'X' ? 'O' : 'X';
        setTurn(nextTurn);
        setNotice(`Hết giờ, chuyển lượt cho quân ${nextTurn}`);
        return 45;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [draw, turn, winner]);

  const latestIndex = moves.at(-1)?.index ?? null;
  const winningSet = useMemo(() => new Set(winningLine), [winningLine]);

  function play(index: number) {
    if (board[index] || winner || draw) return;

    const nextBoard = [...board];
    nextBoard[index] = turn;
    const nextMoves = [...moves, { index, mark: turn }];
    const line = findCaroWinningLine(nextBoard, index);

    setBoard(nextBoard);
    setMoves(nextMoves);
    setTurnSeconds(45);

    if (line.length) {
      setWinner(turn);
      setWinningLine(line);
      setNotice(
        `${turn === 'X' ? playerName : 'Nam Anh'} thắng với ${line.length} quân liên tiếp!`,
      );
      return;
    }

    if (nextMoves.length === CARO_BOARD_SIZE ** 2) {
      setDraw(true);
      setNotice('Bàn cờ đã đầy — trận đấu hòa.');
      return;
    }

    const nextTurn = turn === 'X' ? 'O' : 'X';
    setTurn(nextTurn);
    setNotice(nextTurn === 'X' ? 'Đến lượt bạn đặt quân X' : 'Đến lượt Nam Anh đặt quân O');
  }

  function resetMatch() {
    setBoard(createInitialBoard());
    setMoves(initialMoves);
    setTurn('X');
    setWinner(null);
    setWinningLine([]);
    setDraw(false);
    setTurnSeconds(45);
    setNotice('Ván mới đã sẵn sàng — đến lượt bạn đặt quân X');
  }

  function sendMessage(text = chatInput) {
    const message = text.trim().slice(0, 180);
    if (!message) return;

    setMessages((items) => [
      ...items,
      {
        id: Date.now(),
        mine: true,
        text: message,
        time: new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(
          new Date(),
        ),
      },
    ]);
    setChatInput('');
  }

  return (
    <>
      <div className="match-status game-panel" aria-live="polite">
        <span>✦ Xếp hạng · Kim Cương III</span>
        <strong>{notice}</strong>
        <span>Thắng +24 · Hòa +6 · Thua −18</span>
      </div>

      <div className="caro-match-layout">
        <PlayerCard
          name={playerName}
          avatar="🐷"
          mark="X"
          score="1.257"
          hearts={5}
          active={turn === 'X' && !winner && !draw}
          seconds={turnSeconds}
        />

        <main className="caro-board-column">
          <div className="caro-board-wrap game-panel">
            <div className="caro-board" role="grid" aria-label="Bàn Cờ Caro XO 19 nhân 19">
              {board.map((cell, index) => (
                <button
                  className={`${cell ? `is-${cell.toLowerCase()}` : ''}${
                    latestIndex === index ? ' is-latest' : ''
                  }${winningSet.has(index) ? ' is-winning' : ''}`}
                  key={index}
                  type="button"
                  role="gridcell"
                  aria-label={`${caroCoordinate(index)}${cell ? `: quân ${cell}` : ': ô trống'}`}
                  disabled={Boolean(cell || winner || draw)}
                  onClick={() => play(index)}
                >
                  {cell}
                </button>
              ))}
            </div>
          </div>
          <div className="caro-board-legend">
            <span>
              <b>X</b> quân của bạn
            </span>
            <span>
              <b>O</b> đối thủ
            </span>
            <span>
              <i /> nước mới nhất
            </span>
            <span>
              <em /> chuỗi chiến thắng
            </span>
          </div>
          <div className="match-actions game-panel">
            <button
              className="is-danger"
              type="button"
              onClick={() => {
                setWinner('O');
                setNotice('Bạn đã đầu hàng. Nam Anh thắng trận.');
              }}
            >
              ⚑ Đầu hàng
            </button>
            <button
              className="is-draw"
              type="button"
              onClick={() => {
                setDraw(true);
                setNotice('Hai người chơi đồng ý hòa.');
              }}
            >
              🤝 Xin hòa
            </button>
            <button
              type="button"
              onClick={() => setNotice('Đã ghi nhận báo lỗi giao diện. Cảm ơn bạn!')}
            >
              ⚠ Báo lỗi
            </button>
            <button type="button" onClick={resetMatch}>
              ↻ Ván mới
            </button>
          </div>
        </main>

        <div className="match-opponent-column">
          <PlayerCard
            name="Nam Anh"
            avatar="👨🏻‍💻"
            mark="O"
            score="1.231"
            hearts={4}
            active={turn === 'O' && !winner && !draw}
            seconds={turnSeconds}
          />
          <section className="match-chat game-panel">
            <div className="game-section-head">
              <h2>Trò chuyện</h2>
              <button type="button">•••</button>
            </div>
            <div className="match-chat__messages">
              {messages.map((message) => (
                <div className={message.mine ? 'is-mine' : ''} key={message.id}>
                  <p>{message.text}</p>
                  <time>{message.time}</time>
                </div>
              ))}
            </div>
            <div className="quick-chat">
              <button type="button" onClick={() => sendMessage('Nước này hay đấy! 🔥')}>
                🔥
              </button>
              <button type="button" onClick={() => sendMessage('Cảm ơn bạn! 😊')}>
                😊
              </button>
              <button type="button" onClick={() => sendMessage('Xin tái đấu nhé!')}>
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
                maxLength={180}
                placeholder="Nhập tin nhắn…"
              />
              <button type="submit" aria-label="Gửi tin nhắn">
                ➤
              </button>
            </form>
          </section>
          <section className="move-history game-panel">
            <div className="game-section-head">
              <h2>Lịch sử nước đi</h2>
              <span>{moves.length}</span>
            </div>
            <ol>
              {moves.slice(-12).map((move, index) => (
                <li key={`${move.index}-${index}`}>
                  <span>{moves.length - Math.min(12, moves.length) + index + 1}</span>
                  <b>{move.mark}</b>
                  <span>{caroCoordinate(move.index)}</span>
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
  name,
  avatar,
  mark,
  score,
  hearts,
  active,
  seconds,
}: {
  name: string;
  avatar: string;
  mark: CaroMark;
  score: string;
  hearts: number;
  active: boolean;
  seconds: number;
}) {
  return (
    <aside className={`match-player game-panel${active ? ' is-active' : ''}`}>
      <span className="turn-pill">{active ? `Đến lượt ${mark}` : `Quân ${mark}`}</span>
      <span className="game-avatar game-avatar--xl">{avatar}</span>
      <h2>{name}</h2>
      <span className="game-rank-pill">✦ Kim Cương III</span>
      <strong>{score}</strong>
      <span className="player-hearts">{'❤️'.repeat(hearts)}</span>
      <div className="turn-clock">
        ◷ <b>00:{String(seconds).padStart(2, '0')}</b>
      </div>
      <div className="player-links">
        <button type="button">＋ Kết bạn</button>
        <button type="button">♙ Hồ sơ</button>
      </div>
    </aside>
  );
}
