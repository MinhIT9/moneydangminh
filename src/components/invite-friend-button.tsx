'use client';

import { useState } from 'react';
import { inviteFriendToRoomAction } from '@/actions/game';

export function InviteFriendButton({
  friendId,
  roomCode,
  disabled = false,
}: {
  friendId: string;
  roomCode: string;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle');
  return (
    <button
      type="button"
      disabled={disabled || status === 'pending' || status === 'sent'}
      onClick={async () => {
        setStatus('pending');
        const result = await inviteFriendToRoomAction(friendId, roomCode);
        setStatus(result.ok ? 'sent' : 'error');
      }}
      title={status === 'error' ? 'Không thể gửi lời mời lúc này' : undefined}
    >
      {status === 'pending'
        ? 'Đang gửi'
        : status === 'sent'
          ? 'Đã mời'
          : status === 'error'
            ? 'Thử lại'
            : disabled
              ? 'Đang bận'
              : 'Mời chơi'}
    </button>
  );
}
