import 'server-only';

import { createHash, randomInt } from 'node:crypto';
import type { CaroMark, GameProfile, Prisma } from '@/generated/prisma/client';
import { CARO_BOARD_SIZE, findCaroWinningLine, type CaroCell } from '@/lib/caro';
import { db } from '@/lib/db';

const HEART_MAX = 5;
const HEART_RECOVERY_MS = 5 * 60 * 1000;
const ROOM_LIFETIME_MS = 6 * 60 * 60 * 1000;
const INVITE_LIFETIME_MS = 10 * 60 * 1000;
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RANKED_TURN_SECONDS = 15;
const MATCHMAKING_STALE_MS = 10_000;

const CARO_RANKS = [
  { name: 'Nhập Môn', short: 'Nhập Môn', min: 0 },
  { name: 'Tập Sự', short: 'Tập Sự', min: 200 },
  { name: 'Kỳ Thủ', short: 'Kỳ Thủ', min: 400 },
  { name: 'Cao Thủ', short: 'Cao Thủ', min: 800 },
  { name: 'Danh Thủ', short: 'Danh Thủ', min: 1200 },
  { name: 'Đại Sư', short: 'Đại Sư', min: 1600 },
  { name: 'Kỳ Vương', short: 'Kỳ Vương', min: 2000 },
] as const;

type DatabaseClient = Prisma.TransactionClient | typeof db;

export class GameError extends Error {
  constructor(
    message: string,
    readonly code = 'GAME_ERROR',
  ) {
    super(message);
  }
}

function playerCode(userId: string) {
  return `HX${createHash('sha256').update(userId).digest('hex').slice(0, 8).toUpperCase()}`;
}

function roomCode() {
  return Array.from({ length: 6 }, () => ROOM_ALPHABET[randomInt(ROOM_ALPHABET.length)]).join('');
}

export function getCaroRank(rating: number) {
  let level = 0;
  for (let index = 1; index < CARO_RANKS.length; index += 1) {
    if (rating < CARO_RANKS[index].min) break;
    level = index;
  }
  const current = CARO_RANKS[level];
  return {
    ...current,
    level,
    nextAt: CARO_RANKS[level + 1]?.min ?? null,
  };
}

export function getCaroMatchmakingRange(rating: number) {
  const current = getCaroRank(rating);
  const lowestLevel = Math.max(0, current.level - 1);
  const highestLevel = Math.min(CARO_RANKS.length - 1, current.level + 1);
  const nextRank = CARO_RANKS[highestLevel + 1];

  return {
    minRating: CARO_RANKS[lowestLevel].min,
    maxRating: nextRank ? nextRank.min - 1 : Number.MAX_SAFE_INTEGER,
    allowedRanks: CARO_RANKS.slice(lowestLevel, highestLevel + 1).map((rank) => rank.name),
  };
}

export async function ensureGameProfile(userId: string, client: DatabaseClient = db) {
  const existing = await client.gameProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  return client.gameProfile.create({
    data: { userId, playerCode: playerCode(userId) },
  });
}

export function calculateRecoveredHearts(profile: GameProfile, now = new Date()) {
  if (profile.hearts >= HEART_MAX) {
    return {
      hearts: HEART_MAX,
      recoveryStartedAt: null,
      changed: profile.heartRecoveryStartedAt !== null,
    };
  }

  const startedAt = profile.heartRecoveryStartedAt ?? now;
  const elapsed = Math.max(0, now.getTime() - startedAt.getTime());
  const recovered = Math.floor(elapsed / HEART_RECOVERY_MS);
  const hearts = Math.min(HEART_MAX, profile.hearts + recovered);
  const recoveryStartedAt =
    hearts >= HEART_MAX ? null : new Date(startedAt.getTime() + recovered * HEART_RECOVERY_MS);

  return {
    hearts,
    recoveryStartedAt,
    changed:
      hearts !== profile.hearts ||
      recoveryStartedAt?.getTime() !== profile.heartRecoveryStartedAt?.getTime(),
  };
}

export async function syncGameProfile(userId: string, client: DatabaseClient = db) {
  const profile = await ensureGameProfile(userId, client);
  const recovered = calculateRecoveredHearts(profile);
  if (!recovered.changed) return profile;

  return client.gameProfile.update({
    where: { userId },
    data: { hearts: recovered.hearts, heartRecoveryStartedAt: recovered.recoveryStartedAt },
  });
}

export function getNextHeartAt(profile: Pick<GameProfile, 'hearts' | 'heartRecoveryStartedAt'>) {
  if (profile.hearts >= HEART_MAX || !profile.heartRecoveryStartedAt) return null;
  return new Date(profile.heartRecoveryStartedAt.getTime() + HEART_RECOVERY_MS);
}

export async function touchGamePresence(
  userId: string,
  presence: GameProfile['presence'] = 'ONLINE',
) {
  await syncGameProfile(userId);
  return db.gameProfile.update({ where: { userId }, data: { presence, lastSeenAt: new Date() } });
}

export async function getGameOverview(userId: string) {
  const profile = await syncGameProfile(userId);
  const [recentMatches, leaderboard, friendships, unreadNotifications] = await Promise.all([
    db.caroMatch.findMany({
      where: { OR: [{ playerXId: userId }, { playerOId: userId }], status: { not: 'ACTIVE' } },
      orderBy: { endedAt: 'desc' },
      take: 5,
      include: {
        playerX: { select: { id: true, displayName: true, gameProfile: true } },
        playerO: { select: { id: true, displayName: true, gameProfile: true } },
      },
    }),
    db.gameProfile.findMany({
      orderBy: [{ caroRating: 'desc' }, { rankedWins: 'desc' }],
      take: 10,
      include: { user: { select: { displayName: true } } },
    }),
    db.gameFriendship.findMany({
      where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: {
        requester: { select: { id: true, displayName: true, gameProfile: true } },
        addressee: { select: { id: true, displayName: true, gameProfile: true } },
      },
      take: 20,
    }),
    db.gameNotification.count({ where: { userId, readAt: null } }),
  ]);

  return { profile, recentMatches, leaderboard, friendships, unreadNotifications };
}

export async function createPrivateRoom(userId: string) {
  return db.$transaction(async (tx) => {
    await syncGameProfile(userId, tx);
    const activeMatch = await tx.caroMatch.findFirst({
      where: { status: 'ACTIVE', OR: [{ playerXId: userId }, { playerOId: userId }] },
      select: { id: true },
    });
    if (activeMatch) throw new GameError('Bạn đang có một trận đấu chưa kết thúc.', 'ACTIVE_MATCH');

    await tx.caroRoom.updateMany({
      where: { hostId: userId, status: { in: ['WAITING', 'READY'] } },
      data: { status: 'CLOSED' },
    });

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const room = await tx.caroRoom.create({
          data: {
            code: roomCode(),
            hostId: userId,
            expiresAt: new Date(Date.now() + ROOM_LIFETIME_MS),
          },
        });
        await tx.gameProfile.update({
          where: { userId },
          data: { presence: 'IN_ROOM', lastSeenAt: new Date() },
        });
        return room;
      } catch (error) {
        if (attempt === 7) throw error;
      }
    }
    throw new GameError('Không thể tạo mã phòng. Vui lòng thử lại.', 'ROOM_CODE_FAILED');
  });
}

function normalizeRoomCode(code: string) {
  const normalized = code
    .toUpperCase()
    .replace(/[^A-HJ-NP-Z2-9]/g, '')
    .slice(0, 6);
  if (normalized.length !== 6)
    throw new GameError('Mã phòng phải có đúng 6 ký tự.', 'INVALID_ROOM_CODE');
  return normalized;
}

export async function joinPrivateRoom(userId: string, rawCode: string) {
  const code = normalizeRoomCode(rawCode);
  return db.$transaction(async (tx) => {
    await syncGameProfile(userId, tx);
    const room = await tx.caroRoom.findUnique({ where: { code } });
    if (!room || room.status === 'CLOSED' || room.expiresAt <= new Date()) {
      throw new GameError('Phòng không tồn tại hoặc đã hết hạn.', 'ROOM_NOT_FOUND');
    }
    if (room.hostId === userId || room.guestId === userId) return room;
    if (room.guestId || !['WAITING', 'READY'].includes(room.status)) {
      throw new GameError('Phòng đã đủ người hoặc trận đã bắt đầu.', 'ROOM_FULL');
    }
    const activeMatch = await tx.caroMatch.findFirst({
      where: { status: 'ACTIVE', OR: [{ playerXId: userId }, { playerOId: userId }] },
      select: { id: true },
    });
    if (activeMatch) throw new GameError('Bạn đang có một trận đấu chưa kết thúc.', 'ACTIVE_MATCH');

    const blocked = await tx.gameFriendship.findFirst({
      where: {
        status: 'BLOCKED',
        OR: [
          { requesterId: userId, addresseeId: room.hostId },
          { requesterId: room.hostId, addresseeId: userId },
        ],
      },
    });
    if (blocked) throw new GameError('Bạn không thể tham gia phòng này.', 'RELATIONSHIP_BLOCKED');

    const claimed = await tx.caroRoom.updateMany({
      where: {
        id: room.id,
        guestId: null,
        status: { in: ['WAITING', 'READY'] },
        expiresAt: { gt: new Date() },
      },
      data: { guestId: userId, guestReady: false, status: 'READY' },
    });
    if (claimed.count !== 1)
      throw new GameError('Phòng vừa có người tham gia trước bạn.', 'ROOM_FULL');

    await Promise.all([
      tx.gameProfile.update({
        where: { userId },
        data: { presence: 'IN_ROOM', lastSeenAt: new Date() },
      }),
      tx.gameNotification.create({
        data: {
          userId: room.hostId,
          type: 'ROOM_JOINED',
          title: 'Có người đã vào phòng',
          body: 'Người chơi thứ hai đã tham gia phòng Caro.',
          href: `/games/caro/room/${code}`,
        },
      }),
      tx.gameMessage.create({
        data: {
          senderId: userId,
          roomId: room.id,
          scope: 'ROOM',
          kind: 'SYSTEM',
          content: 'Người chơi đã vào phòng.',
        },
      }),
    ]);

    return tx.caroRoom.findUniqueOrThrow({ where: { id: room.id } });
  });
}

export async function getRoomSnapshot(userId: string, rawCode: string) {
  const code = normalizeRoomCode(rawCode);
  const room = await db.caroRoom.findUnique({
    where: { code },
    include: {
      host: { select: { id: true, displayName: true, gameProfile: true } },
      guest: { select: { id: true, displayName: true, gameProfile: true } },
      matches: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, status: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { sender: { select: { id: true, displayName: true } } },
      },
    },
  });
  if (!room) return null;
  const isMember = room.hostId === userId || room.guestId === userId;
  if (room.expiresAt <= new Date() && ['WAITING', 'READY'].includes(room.status)) {
    await db.caroRoom.update({ where: { id: room.id }, data: { status: 'CLOSED' } });
    room.status = 'CLOSED';
  }
  return {
    ...room,
    isMember,
    isHost: room.hostId === userId,
    messages: isMember ? room.messages.reverse() : [],
  };
}

export async function setRoomReady(userId: string, rawCode: string, ready: boolean) {
  const code = normalizeRoomCode(rawCode);
  const room = await db.caroRoom.findUnique({ where: { code } });
  if (!room || (room.hostId !== userId && room.guestId !== userId))
    throw new GameError('Bạn không thuộc phòng này.', 'NOT_ROOM_MEMBER');
  if (!['WAITING', 'READY'].includes(room.status))
    throw new GameError('Không thể đổi trạng thái lúc này.', 'ROOM_STATE');

  await db.$transaction([
    db.caroRoom.update({
      where: { id: room.id },
      data: room.hostId === userId ? { hostReady: ready } : { guestReady: ready },
    }),
    db.gameMessage.create({
      data: {
        senderId: userId,
        roomId: room.id,
        scope: 'ROOM',
        kind: 'SYSTEM',
        content: ready ? 'Người chơi đã sẵn sàng.' : 'Người chơi đã hủy sẵn sàng.',
      },
    }),
  ]);
}

export async function readyForPrivateRoomRematch(userId: string, rawCode: string) {
  const code = normalizeRoomCode(rawCode);

  return db.$transaction(async (tx) => {
    const room = await tx.caroRoom.findUnique({ where: { code } });
    if (!room || (room.hostId !== userId && room.guestId !== userId))
      throw new GameError('Bạn không thuộc phòng này.', 'NOT_ROOM_MEMBER');
    if (!room.guestId)
      throw new GameError('Phòng cần đủ hai người để chơi hiệp mới.', 'ROOM_NOT_READY');
    if (!['FINISHED', 'READY'].includes(room.status))
      throw new GameError('Phòng chưa thể bắt đầu hiệp mới.', 'ROOM_STATE');

    if (room.status === 'FINISHED') {
      await tx.caroRoom.updateMany({
        where: { id: room.id, status: 'FINISHED' },
        data: { status: 'READY', hostReady: false, guestReady: false },
      });
    }

    const updated = await tx.caroRoom.update({
      where: { id: room.id },
      data:
        room.hostId === userId
          ? { hostReady: true, status: 'READY' }
          : { guestReady: true, status: 'READY' },
    });
    await tx.gameProfile.update({
      where: { userId },
      data: { presence: 'IN_ROOM', lastSeenAt: new Date() },
    });
    return updated;
  });
}

async function createMatchInTransaction(
  tx: Prisma.TransactionClient,
  playerAId: string,
  playerBId: string,
  mode: 'RANKED' | 'FRIENDLY',
  roomId: string | null = null,
  turnSeconds = mode === 'RANKED' ? RANKED_TURN_SECONDS : 45,
) {
  const [profileA, profileB] = await Promise.all([
    syncGameProfile(playerAId, tx),
    syncGameProfile(playerBId, tx),
  ]);
  if (mode === 'RANKED' && (profileA.hearts <= 0 || profileB.hearts <= 0))
    throw new GameError('Một người chơi không còn tim để đấu hạng.', 'NO_HEARTS');

  const playerXId = randomInt(2) === 0 ? playerAId : playerBId;
  const playerOId = playerXId === playerAId ? playerBId : playerAId;
  const profileX = playerXId === playerAId ? profileA : profileB;
  const profileO = playerOId === playerAId ? profileA : profileB;
  const match = await tx.caroMatch.create({
    data: {
      roomId,
      playerXId,
      playerOId,
      mode,
      turnSeconds,
      playerXRating: profileX.caroRating,
      playerORating: profileO.caroRating,
    },
  });
  await tx.gameProfile.updateMany({
    where: { userId: { in: [playerAId, playerBId] } },
    data: { presence: 'PLAYING', lastSeenAt: new Date() },
  });
  return match;
}

export async function startPrivateRoom(userId: string, rawCode: string) {
  const code = normalizeRoomCode(rawCode);
  return db.$transaction(async (tx) => {
    const room = await tx.caroRoom.findUnique({ where: { code } });
    if (!room || room.hostId !== userId)
      throw new GameError('Chỉ chủ phòng được bắt đầu trận.', 'HOST_ONLY');
    if (!room.guestId || !room.hostReady || !room.guestReady)
      throw new GameError('Cần đủ hai người và cả hai cùng sẵn sàng.', 'NOT_READY');
    const reserved = await tx.caroRoom.updateMany({
      where: { id: room.id, status: 'READY', hostReady: true, guestReady: true },
      data: { status: 'PLAYING' },
    });
    if (reserved.count !== 1)
      throw new GameError('Trạng thái phòng vừa thay đổi.', 'ROOM_CONFLICT');
    const match = await createMatchInTransaction(
      tx,
      room.hostId,
      room.guestId,
      'FRIENDLY',
      room.id,
      room.turnSeconds,
    );
    await tx.gameMessage.create({
      data: {
        senderId: userId,
        roomId: room.id,
        scope: 'ROOM',
        kind: 'SYSTEM',
        content: 'Trận đấu đã bắt đầu.',
      },
    });
    return match;
  });
}

export async function leavePrivateRoom(userId: string, rawCode: string) {
  const code = normalizeRoomCode(rawCode);
  await db.$transaction(async (tx) => {
    const room = await tx.caroRoom.findUnique({ where: { code } });
    if (!room || (room.hostId !== userId && room.guestId !== userId)) return;
    if (room.status === 'PLAYING')
      throw new GameError(
        'Hãy kết thúc hoặc đầu hàng trận đấu trước khi rời phòng.',
        'MATCH_ACTIVE',
      );
    if (room.hostId === userId) {
      await tx.caroRoom.update({ where: { id: room.id }, data: { status: 'CLOSED' } });
    } else {
      await tx.caroRoom.update({
        where: { id: room.id },
        data: { guestId: null, guestReady: false, status: 'WAITING' },
      });
    }
    await tx.gameProfile.update({
      where: { userId },
      data: { presence: 'ONLINE', lastSeenAt: new Date() },
    });
  });
}

function expectedScore(rating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function calculateElo(ratingA: number, ratingB: number, scoreA: 0 | 0.5 | 1) {
  const changeA = Math.round(32 * (scoreA - expectedScore(ratingA, ratingB)));
  return { changeA, changeB: -changeA };
}

async function finalizeMatch(
  tx: Prisma.TransactionClient,
  match: Awaited<ReturnType<typeof tx.caroMatch.findUniqueOrThrow>>,
  winnerId: string | null,
  status: 'X_WON' | 'O_WON' | 'DRAW',
  reason: 'FIVE_IN_ROW' | 'SURRENDER' | 'TIMEOUT' | 'AGREED_DRAW' | 'BOARD_FULL',
) {
  const isDraw = status === 'DRAW';
  const xWon = winnerId === match.playerXId;
  const scoreX: 0 | 0.5 | 1 = isDraw ? 0.5 : xWon ? 1 : 0;
  const elo =
    match.mode === 'RANKED'
      ? calculateElo(match.playerXRating, match.playerORating, scoreX)
      : { changeA: 0, changeB: 0 };
  const endedAt = new Date();

  await tx.caroMatch.update({
    where: { id: match.id },
    data: {
      status,
      resultReason: reason,
      winnerId,
      endedAt,
      playerXChange: elo.changeA,
      playerOChange: elo.changeB,
      drawOfferedById: null,
      version: { increment: 1 },
    },
  });
  if (match.roomId)
    await tx.caroRoom.update({ where: { id: match.roomId }, data: { status: 'FINISHED' } });

  const players = [
    { id: match.playerXId, won: xWon, lost: !isDraw && !xWon, ratingChange: elo.changeA },
    {
      id: match.playerOId,
      won: !isDraw && !xWon,
      lost: !isDraw && xWon,
      ratingChange: elo.changeB,
    },
  ];
  for (const player of players) {
    const profile = await syncGameProfile(player.id, tx);
    const prefix = match.mode === 'RANKED' ? 'ranked' : 'friendly';
    const nextRating = Math.max(0, profile.caroRating + player.ratingChange);
    const nextHearts =
      match.mode === 'RANKED'
        ? Math.min(HEART_MAX, Math.max(0, profile.hearts + (player.won ? 1 : player.lost ? -1 : 0)))
        : profile.hearts;
    const recoveryStartedAt =
      nextHearts >= HEART_MAX ? null : (profile.heartRecoveryStartedAt ?? endedAt);
    await tx.gameProfile.update({
      where: { userId: player.id },
      data: {
        caroRating: nextRating,
        caroPeakRating: Math.max(profile.caroPeakRating, nextRating),
        hearts: nextHearts,
        heartRecoveryStartedAt: recoveryStartedAt,
        presence: 'ONLINE',
        lastSeenAt: endedAt,
        ...(player.won
          ? {
              [`${prefix}Wins`]: { increment: 1 },
              currentWinStreak: { increment: 1 },
              longestWinStreak: Math.max(profile.longestWinStreak, profile.currentWinStreak + 1),
            }
          : player.lost
            ? { [`${prefix}Losses`]: { increment: 1 }, currentWinStreak: 0 }
            : { [`${prefix}Draws`]: { increment: 1 } }),
      },
    });
  }
}

export async function getMatchSnapshot(userId: string, matchId: string) {
  let match = await db.caroMatch.findFirst({
    where: { id: matchId, OR: [{ playerXId: userId }, { playerOId: userId }] },
    include: {
      room: { select: { code: true } },
      playerX: { select: { id: true, displayName: true, gameProfile: true } },
      playerO: { select: { id: true, displayName: true, gameProfile: true } },
      moves: { orderBy: { moveNumber: 'asc' } },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 100,
        include: { sender: { select: { id: true, displayName: true } } },
      },
    },
  });
  if (!match) return null;

  if (
    match.status === 'ACTIVE' &&
    Date.now() - match.turnStartedAt.getTime() >= match.turnSeconds * 1000
  ) {
    await resolveMatchTimeout(match.id);
    match = await db.caroMatch.findFirst({
      where: { id: matchId, OR: [{ playerXId: userId }, { playerOId: userId }] },
      include: {
        room: { select: { code: true } },
        playerX: { select: { id: true, displayName: true, gameProfile: true } },
        playerO: { select: { id: true, displayName: true, gameProfile: true } },
        moves: { orderBy: { moveNumber: 'asc' } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: { sender: { select: { id: true, displayName: true } } },
        },
      },
    });
  }
  return match;
}

export async function playCaroMove(userId: string, matchId: string, row: number, column: number) {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(column) ||
    row < 0 ||
    column < 0 ||
    row >= CARO_BOARD_SIZE ||
    column >= CARO_BOARD_SIZE
  )
    throw new GameError('Ô cờ không hợp lệ.', 'INVALID_CELL');

  return db.$transaction(async (tx) => {
    const match = await tx.caroMatch.findUnique({
      where: { id: matchId },
      include: { moves: { orderBy: { moveNumber: 'asc' } } },
    });
    if (!match || (match.playerXId !== userId && match.playerOId !== userId))
      throw new GameError('Bạn không thuộc trận đấu này.', 'NOT_MATCH_PLAYER');
    if (match.status !== 'ACTIVE') throw new GameError('Trận đấu đã kết thúc.', 'MATCH_FINISHED');
    const playerMark: CaroMark = match.playerXId === userId ? 'X' : 'O';
    if (match.currentTurn !== playerMark)
      throw new GameError('Chưa đến lượt của bạn.', 'NOT_YOUR_TURN');
    if (Date.now() - match.turnStartedAt.getTime() >= match.turnSeconds * 1000) {
      const winnerId = playerMark === 'X' ? match.playerOId : match.playerXId;
      await finalizeMatch(tx, match, winnerId, playerMark === 'X' ? 'O_WON' : 'X_WON', 'TIMEOUT');
      return { move: null, winningLine: [] as number[], timedOut: true };
    }
    if (match.moves.some((move) => move.row === row && move.column === column))
      throw new GameError('Ô này đã có quân.', 'CELL_OCCUPIED');

    const reserved = await tx.caroMatch.updateMany({
      where: { id: match.id, status: 'ACTIVE', currentTurn: playerMark, version: match.version },
      data: {
        currentTurn: playerMark === 'X' ? 'O' : 'X',
        turnStartedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (reserved.count !== 1)
      throw new GameError('Trận vừa có thay đổi. Hãy tải trạng thái mới.', 'MATCH_CONFLICT');
    const move = await tx.caroMove.create({
      data: {
        matchId,
        playerId: userId,
        moveNumber: match.moves.length + 1,
        mark: playerMark,
        row,
        column,
      },
    });
    const board: CaroCell[] = Array.from({ length: CARO_BOARD_SIZE ** 2 }, () => null);
    for (const item of [...match.moves, move])
      board[item.row * CARO_BOARD_SIZE + item.column] = item.mark;
    const winningLine = findCaroWinningLine(board, row * CARO_BOARD_SIZE + column);
    if (winningLine.length)
      await finalizeMatch(tx, match, userId, playerMark === 'X' ? 'X_WON' : 'O_WON', 'FIVE_IN_ROW');
    else if (match.moves.length + 1 === CARO_BOARD_SIZE ** 2)
      await finalizeMatch(tx, match, null, 'DRAW', 'BOARD_FULL');
    return { move, winningLine, timedOut: false };
  });
}

export async function surrenderCaroMatch(userId: string, matchId: string) {
  await db.$transaction(async (tx) => {
    const match = await tx.caroMatch.findUnique({ where: { id: matchId } });
    if (!match || (match.playerXId !== userId && match.playerOId !== userId))
      throw new GameError('Bạn không thuộc trận đấu này.', 'NOT_MATCH_PLAYER');
    if (match.status !== 'ACTIVE') throw new GameError('Trận đấu đã kết thúc.', 'MATCH_FINISHED');
    const winnerId = match.playerXId === userId ? match.playerOId : match.playerXId;
    await finalizeMatch(
      tx,
      match,
      winnerId,
      winnerId === match.playerXId ? 'X_WON' : 'O_WON',
      'SURRENDER',
    );
  });
}

export async function offerCaroDraw(userId: string, matchId: string) {
  await db.$transaction(async (tx) => {
    const match = await tx.caroMatch.findUnique({ where: { id: matchId } });
    if (!match || (match.playerXId !== userId && match.playerOId !== userId)) {
      throw new GameError('Bạn không thuộc trận đấu này.', 'NOT_MATCH_PLAYER');
    }
    if (match.status !== 'ACTIVE') throw new GameError('Trận đấu đã kết thúc.', 'MATCH_FINISHED');
    if (match.drawOfferedById)
      throw new GameError('Đang có một đề nghị hòa chờ phản hồi.', 'DRAW_PENDING');
    if (match.drawOfferedAt && Date.now() - match.drawOfferedAt.getTime() < 60_000) {
      throw new GameError('Vui lòng chờ 60 giây giữa hai lần đề nghị hòa.', 'DRAW_COOLDOWN');
    }
    const updated = await tx.caroMatch.updateMany({
      where: { id: match.id, status: 'ACTIVE', version: match.version, drawOfferedById: null },
      data: { drawOfferedById: userId, drawOfferedAt: new Date(), version: { increment: 1 } },
    });
    if (updated.count !== 1) throw new GameError('Trạng thái trận vừa thay đổi.', 'MATCH_CONFLICT');
    await tx.gameMessage.create({
      data: {
        senderId: userId,
        matchId,
        scope: 'MATCH',
        kind: 'SYSTEM',
        content: 'Người chơi đề nghị hòa.',
      },
    });
  });
}

export async function respondCaroDraw(userId: string, matchId: string, accept: boolean) {
  await db.$transaction(async (tx) => {
    const match = await tx.caroMatch.findUnique({ where: { id: matchId } });
    if (!match || (match.playerXId !== userId && match.playerOId !== userId)) {
      throw new GameError('Bạn không thuộc trận đấu này.', 'NOT_MATCH_PLAYER');
    }
    if (match.status !== 'ACTIVE') throw new GameError('Trận đấu đã kết thúc.', 'MATCH_FINISHED');
    if (!match.drawOfferedById || match.drawOfferedById === userId) {
      throw new GameError('Không có đề nghị hòa hợp lệ để phản hồi.', 'DRAW_NOT_FOUND');
    }
    if (accept) {
      await finalizeMatch(tx, match, null, 'DRAW', 'AGREED_DRAW');
    } else {
      await tx.caroMatch.update({
        where: { id: match.id },
        data: { drawOfferedById: null, version: { increment: 1 } },
      });
      await tx.gameMessage.create({
        data: {
          senderId: userId,
          matchId,
          scope: 'MATCH',
          kind: 'SYSTEM',
          content: 'Đề nghị hòa đã bị từ chối.',
        },
      });
    }
  });
}

export async function resolveMatchTimeout(matchId: string) {
  await db.$transaction(async (tx) => {
    const match = await tx.caroMatch.findUnique({ where: { id: matchId } });
    if (
      !match ||
      match.status !== 'ACTIVE' ||
      Date.now() - match.turnStartedAt.getTime() < match.turnSeconds * 1000
    )
      return;
    const winnerId = match.currentTurn === 'X' ? match.playerOId : match.playerXId;
    await finalizeMatch(
      tx,
      match,
      winnerId,
      match.currentTurn === 'X' ? 'O_WON' : 'X_WON',
      'TIMEOUT',
    );
  });
}

export async function queueForRankedMatch(userId: string) {
  return db.$transaction(async (tx) => {
    const profile = await syncGameProfile(userId, tx);
    if (profile.hearts <= 0)
      throw new GameError('Bạn đã hết tim. Hãy chờ tim hồi hoặc chơi phòng riêng.', 'NO_HEARTS');
    const activeMatch = await tx.caroMatch.findFirst({
      where: { status: 'ACTIVE', OR: [{ playerXId: userId }, { playerOId: userId }] },
    });
    if (activeMatch) return { status: 'MATCHED' as const, matchId: activeMatch.id };
    const entry = await tx.matchmakingEntry.upsert({
      where: { userId },
      create: { userId, caroRating: profile.caroRating },
      update: { caroRating: profile.caroRating, enqueuedAt: new Date() },
    });
    await tx.gameProfile.update({
      where: { userId },
      data: { presence: 'MATCHMAKING', lastSeenAt: new Date() },
    });
    return tryMatchmake(tx, userId, entry.caroRating, entry.enqueuedAt);
  });
}

async function tryMatchmake(
  tx: Prisma.TransactionClient,
  userId: string,
  rating: number,
  enqueuedAt: Date,
) {
  const now = new Date();
  const waitedSeconds = Math.floor((Date.now() - enqueuedAt.getTime()) / 1000);
  const matchmakingRange = getCaroMatchmakingRange(rating);

  await tx.matchmakingEntry.deleteMany({
    where: { updatedAt: { lt: new Date(now.getTime() - MATCHMAKING_STALE_MS) } },
  });

  const blocked = await tx.gameFriendship.findMany({
    where: { status: 'BLOCKED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  const excluded = new Set([
    userId,
    ...blocked.map((item) => (item.requesterId === userId ? item.addresseeId : item.requesterId)),
  ]);
  const candidates = await tx.matchmakingEntry.findMany({
    where: {
      userId: { not: userId },
      caroRating: {
        gte: matchmakingRange.minRating,
        lte: matchmakingRange.maxRating,
      },
      updatedAt: { gte: new Date(now.getTime() - MATCHMAKING_STALE_MS) },
      OR: [{ enqueuedAt: { lt: enqueuedAt } }, { enqueuedAt, userId: { lt: userId } }],
    },
    orderBy: { enqueuedAt: 'asc' },
    take: 20,
  });
  const candidate = candidates.find((item) => !excluded.has(item.userId));
  if (!candidate)
    return {
      status: 'QUEUED' as const,
      waitedSeconds,
      allowedRanks: matchmakingRange.allowedRanks,
    };
  const claimed = await tx.matchmakingEntry.deleteMany({
    where: { userId: candidate.userId, updatedAt: candidate.updatedAt },
  });
  if (claimed.count !== 1)
    return {
      status: 'QUEUED' as const,
      waitedSeconds,
      allowedRanks: matchmakingRange.allowedRanks,
    };
  const selfClaimed = await tx.matchmakingEntry.deleteMany({ where: { userId } });
  if (selfClaimed.count !== 1)
    throw new GameError('Hàng chờ vừa thay đổi, hệ thống đang thử ghép lại.', 'QUEUE_CONFLICT');
  const match = await createMatchInTransaction(tx, userId, candidate.userId, 'RANKED');
  return { status: 'MATCHED' as const, matchId: match.id };
}

export async function pollRankedMatch(userId: string) {
  return db.$transaction(async (tx) => {
    const activeMatch = await tx.caroMatch.findFirst({
      where: { status: 'ACTIVE', OR: [{ playerXId: userId }, { playerOId: userId }] },
      orderBy: { startedAt: 'desc' },
    });
    if (activeMatch) return { status: 'MATCHED' as const, matchId: activeMatch.id };
    const entry = await tx.matchmakingEntry.findUnique({ where: { userId } });
    if (!entry) return { status: 'IDLE' as const };
    const refreshed = await tx.matchmakingEntry.update({
      where: { userId },
      data: { updatedAt: new Date() },
    });
    return tryMatchmake(tx, userId, refreshed.caroRating, refreshed.enqueuedAt);
  });
}

export async function cancelRankedQueue(userId: string) {
  await db.$transaction([
    db.matchmakingEntry.deleteMany({ where: { userId } }),
    db.gameProfile.updateMany({
      where: { userId, presence: 'MATCHMAKING' },
      data: { presence: 'ONLINE', lastSeenAt: new Date() },
    }),
  ]);
}

function cleanMessage(content: string) {
  const text = content.trim().replace(/\s+/g, ' ').slice(0, 500);
  if (!text) throw new GameError('Tin nhắn không được để trống.', 'EMPTY_MESSAGE');
  return text;
}

async function enforceMessageRateLimit(client: DatabaseClient, senderId: string) {
  const latest = await client.gameMessage.findFirst({
    where: { senderId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < 800)
    throw new GameError('Bạn đang gửi tin nhắn quá nhanh.', 'RATE_LIMITED');
}

export async function sendMatchMessage(
  userId: string,
  matchId: string,
  content: string,
  kind: 'TEXT' | 'QUICK' = 'TEXT',
) {
  const text = cleanMessage(content);
  return db.$transaction(async (tx) => {
    const match = await tx.caroMatch.findUnique({
      where: { id: matchId },
      select: { playerXId: true, playerOId: true },
    });
    if (!match || (match.playerXId !== userId && match.playerOId !== userId))
      throw new GameError('Bạn không thuộc trận này.', 'NOT_MATCH_PLAYER');
    await enforceMessageRateLimit(tx, userId);
    return tx.gameMessage.create({
      data: { senderId: userId, matchId, scope: 'MATCH', kind, content: text },
    });
  });
}

export async function sendRoomMessage(userId: string, rawCode: string, content: string) {
  const code = normalizeRoomCode(rawCode);
  const text = cleanMessage(content);
  return db.$transaction(async (tx) => {
    const room = await tx.caroRoom.findUnique({ where: { code } });
    if (!room || (room.hostId !== userId && room.guestId !== userId))
      throw new GameError('Bạn không thuộc phòng này.', 'NOT_ROOM_MEMBER');
    await enforceMessageRateLimit(tx, userId);
    return tx.gameMessage.create({
      data: { senderId: userId, roomId: room.id, scope: 'ROOM', content: text },
    });
  });
}

export async function getLeaderboard() {
  return db.gameProfile.findMany({
    orderBy: [{ caroRating: 'desc' }, { rankedWins: 'desc' }],
    take: 100,
    include: { user: { select: { displayName: true } } },
  });
}

export async function getPublicGameProfile(viewerId: string, targetId = viewerId) {
  await ensureGameProfile(targetId);
  const [profile, matches, friendship] = await Promise.all([
    db.gameProfile.findUniqueOrThrow({
      where: { userId: targetId },
      include: { user: { select: { id: true, displayName: true } } },
    }),
    db.caroMatch.findMany({
      where: { OR: [{ playerXId: targetId }, { playerOId: targetId }], status: { not: 'ACTIVE' } },
      orderBy: { endedAt: 'desc' },
      take: 20,
      include: {
        playerX: { select: { id: true, displayName: true } },
        playerO: { select: { id: true, displayName: true } },
      },
    }),
    viewerId === targetId
      ? null
      : db.gameFriendship.findFirst({
          where: {
            OR: [
              { requesterId: viewerId, addresseeId: targetId },
              { requesterId: targetId, addresseeId: viewerId },
            ],
          },
        }),
  ]);
  return { profile, matches, friendship };
}

export async function searchGamePlayers(userId: string, query: string) {
  const text = query.trim().slice(0, 100);
  if (text.length < 2) return [];
  return db.gameProfile.findMany({
    where: {
      userId: { not: userId },
      OR: [
        { playerCode: { contains: text.toUpperCase() } },
        { user: { displayName: { contains: text } } },
      ],
    },
    take: 20,
    include: { user: { select: { displayName: true } } },
  });
}

export async function getFriendCenter(userId: string) {
  await ensureGameProfile(userId);
  const [relationships, messages, requests] = await Promise.all([
    db.gameFriendship.findMany({
      where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: {
        requester: { select: { id: true, displayName: true, gameProfile: true } },
        addressee: { select: { id: true, displayName: true, gameProfile: true } },
      },
    }),
    db.gameMessage.findMany({
      where: { scope: 'DIRECT', OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: { select: { id: true, displayName: true } },
        recipient: { select: { id: true, displayName: true } },
      },
    }),
    db.gameFriendship.findMany({
      where: { addresseeId: userId, status: 'PENDING' },
      include: { requester: { select: { id: true, displayName: true, gameProfile: true } } },
    }),
  ]);
  return { relationships, messages: messages.reverse(), requests };
}

async function findRelationship(client: DatabaseClient, firstId: string, secondId: string) {
  return client.gameFriendship.findFirst({
    where: {
      OR: [
        { requesterId: firstId, addresseeId: secondId },
        { requesterId: secondId, addresseeId: firstId },
      ],
    },
  });
}

export async function sendFriendRequest(userId: string, targetId: string) {
  if (userId === targetId)
    throw new GameError('Bạn không thể tự kết bạn với chính mình.', 'SELF_FRIEND');
  return db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: targetId },
      select: { id: true, displayName: true },
    });
    if (!target) throw new GameError('Không tìm thấy người chơi.', 'PLAYER_NOT_FOUND');
    const existing = await findRelationship(tx, userId, targetId);
    if (existing?.status === 'BLOCKED')
      throw new GameError('Không thể gửi lời mời cho người chơi này.', 'RELATIONSHIP_BLOCKED');
    if (existing?.status === 'ACCEPTED')
      throw new GameError('Hai bạn đã là bạn bè.', 'ALREADY_FRIENDS');
    if (existing?.status === 'PENDING')
      throw new GameError('Lời mời kết bạn đang chờ phản hồi.', 'REQUEST_PENDING');
    const friendship = existing
      ? await tx.gameFriendship.update({
          where: { id: existing.id },
          data: {
            requesterId: userId,
            addresseeId: targetId,
            status: 'PENDING',
            blockedById: null,
          },
        })
      : await tx.gameFriendship.create({ data: { requesterId: userId, addresseeId: targetId } });
    await tx.gameNotification.create({
      data: {
        userId: targetId,
        type: 'FRIEND_REQUEST',
        title: 'Lời mời kết bạn mới',
        body: 'Một người chơi muốn kết bạn với bạn.',
        href: '/games/friends',
      },
    });
    return friendship;
  });
}

export async function respondFriendRequest(userId: string, friendshipId: string, accept: boolean) {
  return db.$transaction(async (tx) => {
    const friendship = await tx.gameFriendship.findFirst({
      where: { id: friendshipId, addresseeId: userId, status: 'PENDING' },
    });
    if (!friendship) throw new GameError('Lời mời không còn hiệu lực.', 'REQUEST_NOT_FOUND');
    const updated = await tx.gameFriendship.update({
      where: { id: friendship.id },
      data: { status: accept ? 'ACCEPTED' : 'DECLINED' },
    });
    if (accept)
      await tx.gameNotification.create({
        data: {
          userId: friendship.requesterId,
          type: 'FRIEND_ACCEPTED',
          title: 'Lời mời đã được chấp nhận',
          href: '/games/friends',
        },
      });
    return updated;
  });
}

export async function removeFriend(userId: string, targetId: string) {
  const friendship = await findRelationship(db, userId, targetId);
  if (!friendship || friendship.status !== 'ACCEPTED')
    throw new GameError('Hai người không còn là bạn bè.', 'NOT_FRIENDS');
  await db.gameFriendship.delete({ where: { id: friendship.id } });
}

export async function blockGamePlayer(userId: string, targetId: string) {
  if (userId === targetId) throw new GameError('Bạn không thể tự chặn mình.', 'SELF_BLOCK');
  const existing = await findRelationship(db, userId, targetId);
  if (existing)
    await db.gameFriendship.update({
      where: { id: existing.id },
      data: { status: 'BLOCKED', blockedById: userId },
    });
  else
    await db.gameFriendship.create({
      data: { requesterId: userId, addresseeId: targetId, status: 'BLOCKED', blockedById: userId },
    });
}

export async function sendDirectMessage(userId: string, recipientId: string, content: string) {
  const text = cleanMessage(content);
  return db.$transaction(async (tx) => {
    const friendship = await findRelationship(tx, userId, recipientId);
    if (!friendship || friendship.status !== 'ACCEPTED')
      throw new GameError('Bạn chỉ có thể nhắn tin cho bạn bè.', 'NOT_FRIENDS');
    await enforceMessageRateLimit(tx, userId);
    const message = await tx.gameMessage.create({
      data: { senderId: userId, recipientId, scope: 'DIRECT', content: text },
    });
    await tx.gameNotification.create({
      data: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'Bạn có tin nhắn mới',
        body: text.slice(0, 120),
        href: '/games/friends',
      },
    });
    return message;
  });
}

export async function inviteFriendToRoom(userId: string, recipientId: string, rawCode: string) {
  const code = normalizeRoomCode(rawCode);
  return db.$transaction(async (tx) => {
    const room = await tx.caroRoom.findUnique({ where: { code } });
    if (
      !room ||
      room.hostId !== userId ||
      room.guestId ||
      !['WAITING', 'READY'].includes(room.status)
    )
      throw new GameError('Phòng không còn sẵn sàng để mời.', 'ROOM_UNAVAILABLE');
    const friendship = await findRelationship(tx, userId, recipientId);
    if (!friendship || friendship.status !== 'ACCEPTED')
      throw new GameError('Bạn chỉ có thể mời bạn bè.', 'NOT_FRIENDS');
    await tx.gameInvite.updateMany({
      where: { roomId: room.id, recipientId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    const invite = await tx.gameInvite.create({
      data: {
        senderId: userId,
        recipientId,
        roomId: room.id,
        expiresAt: new Date(Date.now() + INVITE_LIFETIME_MS),
      },
    });
    await tx.gameNotification.create({
      data: {
        userId: recipientId,
        type: 'ROOM_INVITE',
        title: 'Lời mời chơi Cờ Caro XO',
        body: `Mã phòng: ${code}`,
        href: `/games/caro/room/${code}`,
      },
    });
    return invite;
  });
}

export async function markGameNotificationsRead(userId: string) {
  await db.gameNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
