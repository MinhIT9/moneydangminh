'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function MatchmakingButton() {
  const [searching, setSearching] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!searching) return;

    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [searching]);

  if (searching) {
    return (
      <div className="matchmaking-state" aria-live="polite">
        <span className="matchmaking-spinner" />
        <div>
          <strong>Đang tìm đối thủ phù hợp…</strong>
          <small>
            {seconds} giây · Phạm vi ±{seconds < 10 ? 100 : seconds < 20 ? 200 : 300} điểm
          </small>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearching(false);
            setSeconds(0);
          }}
        >
          Hủy tìm
        </button>
      </div>
    );
  }

  return (
    <button
      className="game-primary-button game-primary-button--wide"
      type="button"
      onClick={() => setSearching(true)}
    >
      🎮 Tìm đối thủ
    </button>
  );
}

export function RoomJoinForm() {
  const router = useRouter();
  const [code, setCode] = useState('');

  function normalizeRoomCode(value: string) {
    return value
      .toUpperCase()
      .replace(/[01OI\W_]/g, '')
      .slice(0, 6);
  }

  return (
    <form
      className="room-join-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (code.length === 6) router.push(`/games/caro/room/${code}`);
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
        <button type="submit" disabled={code.length !== 6}>
          Tham gia
        </button>
      </div>
    </form>
  );
}

export function CopyGameValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" onClick={copy}>
      {copied ? '✓ Đã sao chép' : label}
    </button>
  );
}
