'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  joinPrivateRoomAction,
  leavePrivateRoomAction,
  sendRoomMessageAction,
  setRoomReadyAction,
  startPrivateRoomAction,
} from '@/actions/game';

export function RoomControls({
  code,
  isHost,
  ready,
  canStart,
  activeMatchId,
}: {
  code: string;
  isHost: boolean;
  ready: boolean;
  canStart: boolean;
  activeMatchId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function run(
    action: () => Promise<{ ok: boolean; error?: string; data?: { matchId?: string } }>,
  ) {
    setError('');
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? 'Không thể xử lý yêu cầu.');
      else if (result.data?.matchId) router.push(`/games/caro/match/${result.data.matchId}`);
      else router.refresh();
    });
  }

  if (activeMatchId)
    return (
      <a className="game-primary-button" href={`/games/caro/match/${activeMatchId}`}>
        ▶ Vào trận đấu
      </a>
    );
  return (
    <div className="room-live-controls">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setRoomReadyAction(code, !ready))}
      >
        {ready ? 'Hủy sẵn sàng' : '✓ Sẵn sàng'}
      </button>
      {isHost && (
        <button
          className="game-primary-button"
          type="button"
          disabled={pending || !canStart}
          onClick={() => run(() => startPrivateRoomAction(code))}
        >
          ▶ Bắt đầu
        </button>
      )}
      <button
        className="is-danger"
        type="button"
        disabled={pending}
        onClick={() =>
          run(async () => {
            const result = await leavePrivateRoomAction(code);
            if (result.ok) router.push('/games/caro');
            return result;
          })
        }
      >
        Rời phòng
      </button>
      {error && <p className="game-action-error">{error}</p>}
    </div>
  );
}

export function JoinRoomButton({ code }: { code: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="game-action-stack">
      <button
        className="game-primary-button"
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await joinPrivateRoomAction(code);
          setPending(false);
          if (!result.ok) setError(result.error);
          else router.refresh();
        }}
      >
        {pending ? 'Đang tham gia…' : 'Tham gia phòng'}
      </button>
      {error && <p className="game-action-error">{error}</p>}
    </div>
  );
}

export function RoomChatForm({ code }: { code: string }) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!input.trim()) return;
        startTransition(async () => {
          const result = await sendRoomMessageAction(code, input);
          if (!result.ok) setError(result.error);
          else {
            setInput('');
            setError('');
            router.refresh();
          }
        });
      }}
    >
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Nhập tin nhắn…"
        maxLength={500}
      />
      <button type="submit" disabled={pending}>
        ➤
      </button>
      {error && <small className="game-action-error">{error}</small>}
    </form>
  );
}
