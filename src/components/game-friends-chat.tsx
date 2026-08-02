'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { gameFriends, type GameFriend } from '@/lib/game-mock';

type FriendFilter = 'ALL' | 'ONLINE' | 'PLAYING';
type LocalMessage = { id: number; mine: boolean; text: string };

export function GameFriendsChat({ playerName }: { playerName: string }) {
  const [filter, setFilter] = useState<FriendFilter>('ALL');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(gameFriends[0].id);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState('');
  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      id: 1,
      mine: false,
      text: 'Chào Heo Xinh! Cậu có rảnh không? Mình đánh vài ván Caro nhé! 😊',
    },
    { id: 2, mine: true, text: 'Rất sẵn lòng! Để mình tạo phòng nhé! 🎮' },
    { id: 3, mine: false, text: 'Yeah! 💪' },
  ]);

  const friends = useMemo(
    () =>
      gameFriends.filter((friend) => {
        const matchesFilter =
          filter === 'ALL' ||
          friend.status === filter ||
          (filter === 'ONLINE' && friend.status !== 'OFFLINE');
        return (
          matchesFilter &&
          friend.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))
        );
      }),
    [filter, query],
  );
  const selected = gameFriends.find((friend) => friend.id === selectedId) ?? gameFriends[0];

  function sendMessage() {
    const text = input.trim().slice(0, 180);
    if (!text) return;
    setMessages((items) => [...items, { id: Date.now(), mine: true, text }]);
    setInput('');
  }

  return (
    <div className="friends-chat-layout">
      <aside className="friends-directory game-panel">
        <div className="friends-tabs">
          {(['ALL', 'ONLINE', 'PLAYING'] as const).map((item) => (
            <button
              className={filter === item ? 'is-active' : ''}
              key={item}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item === 'ALL' ? 'Tất cả' : item === 'ONLINE' ? 'Online' : 'Đang chơi'}
            </button>
          ))}
        </div>
        <label className="friends-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm bạn bè…"
          />
        </label>
        <div className="friends-list-title">
          <h2>Bạn bè</h2>
          <span>{friends.length}</span>
        </div>
        <div className="friends-directory-list">
          {friends.map((friend) => (
            <FriendListItem
              key={friend.id}
              friend={friend}
              selected={friend.id === selected.id}
              onSelect={() => setSelectedId(friend.id)}
            />
          ))}
          {!friends.length && <p className="friends-empty">Không tìm thấy người bạn phù hợp.</p>}
        </div>
        <button
          className="game-secondary-button friends-add"
          type="button"
          onClick={() => setNotice('Tính năng tìm bạn sẽ kết nối API ở giai đoạn backend.')}
        >
          ＋ Tìm thêm bạn bè
        </button>
      </aside>

      <main className="friends-conversation game-panel">
        <header>
          <span className="game-avatar game-avatar--large">{selected.avatar}</span>
          <div>
            <h2>
              {selected.name} <i className="presence is-online" />
            </h2>
            <p>{selected.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(`Đã gửi lời thách đấu đến ${selected.name}.`)}
          >
            ⚔ Thách đấu
          </button>
        </header>
        {notice && (
          <div className="game-inline-notice">
            {notice}
            <button type="button" onClick={() => setNotice('')}>
              ×
            </button>
          </div>
        )}
        <div className="conversation-date">Hôm nay</div>
        <div className="conversation-messages">
          {messages.map((message) => (
            <div className={message.mine ? 'is-mine' : ''} key={message.id}>
              <span className="game-avatar">{message.mine ? '🐷' : selected.avatar}</span>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="conversation-tools">
          <button type="button">🐷 Sticker</button>
          <button type="button">▧ Ảnh</button>
          <button type="button">😊 Cảm xúc</button>
          <button type="button">🎁 Gửi quà</button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Nhập tin nhắn…"
            maxLength={180}
          />
          <button type="submit">➤</button>
        </form>
      </main>

      <aside className="friend-profile-column">
        <section className="friend-profile-card game-panel">
          <span className="game-avatar game-avatar--xl">{selected.avatar}</span>
          <h2>{selected.name}</h2>
          <p>🟢 {selected.detail}</p>
          <div>
            <span>
              <small>Hạng</small>
              <b>✦ Kim Cương III</b>
            </span>
            <span>
              <small>Tỷ lệ thắng</small>
              <b>68%</b>
            </span>
            <span>
              <small>Điểm</small>
              <b>{selected.score.toLocaleString('vi-VN')}</b>
            </span>
          </div>
          <Link className="game-primary-button" href="/games/caro/room/AB7K2M">
            🎮 Mời vào phòng riêng
          </Link>
          <button
            type="button"
            onClick={() => setNotice(`Đã gửi lời thách đấu đến ${selected.name}.`)}
          >
            ⚔ Thách đấu
          </button>
        </section>
        <section className="friend-invite-card game-panel">
          <span>🐷</span>
          <div>
            <h2>Tạo phòng & mời bạn</h2>
            <p>Phòng của {playerName}</p>
            <code>XO4721</code>
          </div>
          <Link href="/games/caro/room/XO4721">Gửi lời mời →</Link>
        </section>
      </aside>
    </div>
  );
}

function FriendListItem({
  friend,
  selected,
  onSelect,
}: {
  friend: GameFriend;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={selected ? 'is-selected' : ''} type="button" onClick={onSelect}>
      <span className="game-avatar">{friend.avatar}</span>
      <span>
        <strong>
          {friend.name} <i className={`presence is-${friend.status.toLowerCase()}`} />
        </strong>
        <small>{friend.detail}</small>
      </span>
      <b>⋮</b>
    </button>
  );
}
