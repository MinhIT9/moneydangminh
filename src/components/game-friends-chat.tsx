'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  respondFriendRequestAction,
  searchGamePlayersAction,
  sendDirectMessageAction,
  sendFriendRequestAction,
} from '@/actions/game';

export type FriendCenterState = {
  currentUserId: string;
  friends: FriendView[];
  requests: Array<{ id: string; user: FriendView }>;
  messages: Array<{
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    createdAt: string;
  }>;
};

type FriendView = {
  id: string;
  name: string;
  playerCode: string;
  avatar: string;
  rating: number;
  presence: string;
  detail: string;
};
type SearchPlayer = {
  id: string;
  displayName: string;
  playerCode: string;
  avatar: string;
  rating: number;
  presence: string;
};

export function GameFriendsChat({
  playerName,
  initialState,
}: {
  playerName: string;
  initialState: FriendCenterState;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialState.friends[0]?.id ?? '');
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [searchResults, setSearchResults] = useState<SearchPlayer[]>([]);
  const selected = initialState.friends.find((friend) => friend.id === selectedId);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await searchGamePlayersAction(query);
      if (result.ok)
        setSearchResults(
          result.data.filter(
            (player) => !initialState.friends.some((friend) => friend.id === player.id),
          ),
        );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [initialState.friends, query]);

  const conversation = useMemo(
    () =>
      selected
        ? initialState.messages.filter(
            (message) =>
              (message.senderId === initialState.currentUserId &&
                message.recipientId === selected.id) ||
              (message.senderId === selected.id &&
                message.recipientId === initialState.currentUserId),
          )
        : [],
    [initialState.currentUserId, initialState.messages, selected],
  );

  function submitMessage() {
    if (!selected || !input.trim()) return;
    startTransition(async () => {
      const result = await sendDirectMessageAction(selected.id, input);
      if (!result.ok) setNotice(result.error);
      else {
        setInput('');
        setNotice('');
        router.refresh();
      }
    });
  }

  function addFriend(targetId: string) {
    startTransition(async () => {
      const result = await sendFriendRequestAction(targetId);
      setNotice(result.ok ? 'Đã gửi lời mời kết bạn.' : result.error);
      if (result.ok) setSearchResults((items) => items.filter((item) => item.id !== targetId));
    });
  }

  return (
    <div className="friends-chat-layout">
      <aside className="friends-directory game-panel">
        <label className="friends-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.trim().length < 2) setSearchResults([]);
            }}
            placeholder="Tìm theo tên hoặc ID…"
          />
        </label>
        {searchResults.length > 0 && (
          <div className="friend-search-results">
            {searchResults.map((player) => (
              <div key={player.id}>
                <span className="game-avatar">{player.avatar}</span>
                <span>
                  <strong>{player.displayName || player.playerCode}</strong>
                  <small>
                    {player.playerCode} · {player.rating} điểm
                  </small>
                </span>
                <button type="button" disabled={pending} onClick={() => addFriend(player.id)}>
                  Kết bạn
                </button>
              </div>
            ))}
          </div>
        )}
        {initialState.requests.length > 0 && (
          <section className="friend-requests">
            <div className="friends-list-title">
              <h2>Lời mời kết bạn</h2>
              <span>{initialState.requests.length}</span>
            </div>
            {initialState.requests.map((request) => (
              <div key={request.id}>
                <span className="game-avatar">{request.user.avatar}</span>
                <b>{request.user.name}</b>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      await respondFriendRequestAction(request.id, true);
                      router.refresh();
                    })
                  }
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      await respondFriendRequestAction(request.id, false);
                      router.refresh();
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </section>
        )}
        <div className="friends-list-title">
          <h2>Bạn bè</h2>
          <span>{initialState.friends.length}</span>
        </div>
        <div className="friends-directory-list">
          {initialState.friends.map((friend) => (
            <button
              className={friend.id === selectedId ? 'is-selected' : ''}
              type="button"
              key={friend.id}
              onClick={() => setSelectedId(friend.id)}
            >
              <span className="game-avatar">{friend.avatar}</span>
              <span>
                <strong>
                  {friend.name} <i className={`presence is-${friend.presence.toLowerCase()}`} />
                </strong>
                <small>{friend.detail}</small>
              </span>
              <b>›</b>
            </button>
          ))}
          {!initialState.friends.length && (
            <p className="friends-empty">Chưa có bạn bè. Hãy tìm theo tên hoặc ID người chơi.</p>
          )}
        </div>
      </aside>

      <main className="friends-conversation game-panel">
        {selected ? (
          <>
            <header>
              <span className="game-avatar game-avatar--large">{selected.avatar}</span>
              <div>
                <h2>
                  {selected.name} <i className={`presence is-${selected.presence.toLowerCase()}`} />
                </h2>
                <p>
                  {selected.detail} · {selected.playerCode}
                </p>
              </div>
              <Link href={`/games/caro/profile/${selected.id}`}>Xem hồ sơ</Link>
            </header>
            {notice && (
              <div className="game-inline-notice">
                {notice}
                <button type="button" onClick={() => setNotice('')}>
                  ×
                </button>
              </div>
            )}
            <div className="conversation-date">Cuộc trò chuyện được lưu an toàn</div>
            <div className="conversation-messages">
              {conversation.map((message) => (
                <div
                  className={message.senderId === initialState.currentUserId ? 'is-mine' : ''}
                  key={message.id}
                >
                  <span className="game-avatar">
                    {message.senderId === initialState.currentUserId ? '🐷' : selected.avatar}
                  </span>
                  <p>{message.content}</p>
                </div>
              ))}
              {!conversation.length && <p className="friends-empty">Hãy gửi lời chào đầu tiên.</p>}
            </div>
            <div className="conversation-tools">
              <button type="button" onClick={() => setInput('Chúc bạn một ngày vui vẻ! 😊')}>
                😊 Câu chào nhanh
              </button>
              <Link href="/games/caro">🎮 Tạo phòng mời bạn</Link>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage();
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
            </form>
          </>
        ) : (
          <div className="friends-conversation-empty">
            <span>💬</span>
            <h2>Bạn bè & trò chuyện</h2>
            <p>Tìm một người chơi và gửi lời mời kết bạn để bắt đầu trò chuyện.</p>
          </div>
        )}
      </main>

      <aside className="friend-profile-column">
        {selected && (
          <section className="friend-profile-card game-panel">
            <span className="game-avatar game-avatar--xl">{selected.avatar}</span>
            <h2>{selected.name}</h2>
            <p>{selected.detail}</p>
            <div>
              <span>
                <small>ID</small>
                <b>{selected.playerCode}</b>
              </span>
              <span>
                <small>Điểm</small>
                <b>{selected.rating}</b>
              </span>
              <span>
                <small>Trạng thái</small>
                <b>{selected.presence}</b>
              </span>
            </div>
            <Link className="game-primary-button" href="/games/caro">
              🎮 Tạo phòng riêng
            </Link>
          </section>
        )}
        <section className="friend-invite-card game-panel">
          <span>🐷</span>
          <div>
            <h2>Xin chào, {playerName}</h2>
            <p>Tin nhắn được kiểm tra quyền bạn bè và giới hạn tốc độ phía server.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
