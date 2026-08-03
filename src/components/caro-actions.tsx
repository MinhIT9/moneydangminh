'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  cancelRankedMatchAction,
  createPrivateRoomAction,
  joinPrivateRoomAction,
  pollRankedMatchAction,
  queueRankedMatchAction,
} from '@/actions/game';

export function MatchmakingButton() {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [allowedRanks, setAllowedRanks] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searching) return;

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      const result = await pollRankedMatchAction();
      if (cancelled) return;
      if (!result.ok) {
        if (result.code === 'QUEUE_CONFLICT') {
          timer = window.setTimeout(poll, 800);
          return;
        }
        setError(result.error);
        setSearching(false);
      } else if (result.data.status === 'MATCHED') {
        setSearching(false);
        router.push(`/games/caro/match/${result.data.matchId}`);
      } else if (result.data.status === 'IDLE') {
        setSearching(false);
      } else {
        setSeconds(result.data.waitedSeconds);
        setAllowedRanks(result.data.allowedRanks);
        timer = window.setTimeout(poll, 1000);
      }
    };

    timer = window.setTimeout(poll, 500);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [router, searching]);

  async function startSearching() {
    if (starting || searching) return;
    setStarting(true);
    setError('');
    const result = await queueRankedMatchAction();
    setStarting(false);
    if (!result.ok) return setError(result.error);
    if (result.data.status === 'MATCHED') {
      router.push(`/games/caro/match/${result.data.matchId}`);
      return;
    }
    setSearching(true);
    setSeconds(result.data.waitedSeconds);
    setAllowedRanks(result.data.allowedRanks);
  }

  async function cancelSearching() {
    await cancelRankedMatchAction();
    setSearching(false);
    setSeconds(0);
  }

  if (searching) {
    return (
      <div className="matchmaking-state" aria-live="polite">
        <span className="matchmaking-spinner" />
        <div>
          <strong>Đang tìm đối thủ phù hợp…</strong>
          <small>
            {seconds} giây · Ghép hạng {allowedRanks.join(', ')}
          </small>
        </div>
        <button type="button" onClick={cancelSearching}>
          Hủy tìm
        </button>
      </div>
    );
  }

  return (
    <div className="game-action-stack">
      <button
        className="game-primary-button game-primary-button--wide"
        type="button"
        disabled={starting}
        onClick={startSearching}
      >
        {starting ? 'Đang vào hàng chờ…' : '🎮 Tìm đối thủ'}
      </button>
      {error && <p className="game-action-error">{error}</p>}
    </div>
  );
}

export function CreateRoomButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function createRoom() {
    setPending(true);
    setError('');
    const result = await createPrivateRoomAction();
    setPending(false);
    if (!result.ok) return setError(result.error);
    router.push(`/games/caro/room/${result.data.code}`);
  }

  return (
    <div className="game-action-stack">
      <button className="game-green-button" type="button" disabled={pending} onClick={createRoom}>
        {pending ? 'Đang tạo…' : '▣ Tạo phòng'}
      </button>
      {error && <p className="game-action-error">{error}</p>}
    </div>
  );
}

export function RoomJoinForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function normalizeRoomCode(value: string) {
    return value
      .toUpperCase()
      .replace(/[01OI\W_]/g, '')
      .slice(0, 6);
  }

  return (
    <form
      className="room-join-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (code.length !== 6) return;
        setPending(true);
        setError('');
        const result = await joinPrivateRoomAction(code);
        setPending(false);
        if (!result.ok) return setError(result.error);
        router.push(`/games/caro/room/${result.data.code}`);
      }}
    >
      <label htmlFor="room-code">Tham gia bằng ID phòng</label>
      <div>
        <input
          id="room-code"
          value={code}
          onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
          placeholder="VD: AB7K2M"
          autoComplete="off"
        />
        <button type="submit" disabled={code.length !== 6 || pending}>
          {pending ? 'Đang vào…' : 'Tham gia'}
        </button>
      </div>
      {error && <p className="game-action-error">{error}</p>}
    </form>
  );
}

export function CopyGameValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy}>
      {copied ? '✓ Đã sao chép' : label}
    </button>
  );
}
