import 'dotenv/config';

import { randomBytes } from 'node:crypto';
import { db } from '../src/lib/db';
import {
  calculateElo,
  cancelRankedQueue,
  createPrivateRoom,
  getCaroMatchmakingRange,
  joinPrivateRoom,
  offerCaroDraw,
  playCaroMove,
  pollRankedMatch,
  queueForRankedMatch,
  readyForPrivateRoomRematch,
  respondCaroDraw,
  setRoomReady,
  startPrivateRoom,
  surrenderCaroMatch,
} from '../src/lib/game';

const suffix = randomBytes(5).toString('hex');
const users: string[] = [];

function verify(condition: boolean, message: string) {
  if (!condition) throw new Error(`Game backend failed: ${message}`);
  console.info(`PASS: ${message}`);
}

async function matchQueuedPlayers(firstId: string, secondId: string) {
  await queueForRankedMatch(firstId);
  const attempts = [
    await queueForRankedMatch(secondId),
    await pollRankedMatch(firstId),
    await pollRankedMatch(secondId),
  ];
  const matched = attempts.find((result) => result.status === 'MATCHED');
  if (!matched || matched.status !== 'MATCHED') throw new Error('Expected ranked match');
  return matched.matchId;
}

async function main() {
  try {
    const first = await db.user.create({
      data: {
        email: `caro-a-${suffix}@test.local`,
        phone: `09${randomBytes(4).readUInt32BE().toString().slice(0, 8).padStart(8, '0')}`,
        displayName: 'Test Caro A',
        passwordHash: 'integration-test-only',
      },
    });
    users.push(first.id);
    const second = await db.user.create({
      data: {
        email: `caro-b-${suffix}@test.local`,
        phone: `08${randomBytes(4).readUInt32BE().toString().slice(0, 8).padStart(8, '0')}`,
        displayName: 'Test Caro B',
        passwordHash: 'integration-test-only',
      },
    });
    users.push(second.id);

    const room = await createPrivateRoom(first.id);
    verify(room.code.length === 6 && !/[01OI]/.test(room.code), 'private room code is safe');
    await joinPrivateRoom(second.id, room.code);
    await setRoomReady(second.id, room.code, true);
    const match = await startPrivateRoom(first.id, room.code);
    verify(
      match.status === 'ACTIVE' && match.mode === 'FRIENDLY',
      'host starts a ready private match',
    );

    const x = match.playerXId;
    const o = match.playerOId;
    for (let column = 0; column < 4; column += 1) {
      await playCaroMove(x, match.id, 0, column);
      await playCaroMove(o, match.id, 1, column);
    }
    await playCaroMove(x, match.id, 0, 4);
    const completed = await db.caroMatch.findUniqueOrThrow({ where: { id: match.id } });
    verify(
      completed.status === 'X_WON' && completed.winnerId === x,
      'server validates and persists a five-in-row win',
    );

    const drawRoom = await createPrivateRoom(first.id);
    await joinPrivateRoom(second.id, drawRoom.code);
    await setRoomReady(second.id, drawRoom.code, true);
    const drawMatch = await startPrivateRoom(first.id, drawRoom.code);
    await offerCaroDraw(first.id, drawMatch.id);
    await respondCaroDraw(second.id, drawMatch.id, true);
    const agreedDraw = await db.caroMatch.findUniqueOrThrow({ where: { id: drawMatch.id } });
    verify(
      agreedDraw.status === 'DRAW' && agreedDraw.resultReason === 'AGREED_DRAW',
      'draw offer requires and persists opponent acceptance',
    );

    await readyForPrivateRoomRematch(first.id, drawRoom.code);
    await readyForPrivateRoomRematch(second.id, drawRoom.code);
    const rematchRoom = await db.caroRoom.findUniqueOrThrow({ where: { id: drawRoom.id } });
    verify(
      rematchRoom.status === 'READY' && rematchRoom.hostReady && rematchRoom.guestReady,
      'both private-room players can ready for another round',
    );
    const friendlyRematch = await startPrivateRoom(first.id, drawRoom.code);
    await surrenderCaroMatch(first.id, friendlyRematch.id);

    const traineeRange = getCaroMatchmakingRange(250);
    verify(
      traineeRange.minRating === 0 &&
        traineeRange.maxRating === 799 &&
        traineeRange.allowedRanks.join(',') === 'Nhập Môn,Tập Sự,Kỳ Thủ',
      'ranked matching uses the current Caro rank and one adjacent rank each side',
    );

    await db.gameProfile.update({ where: { userId: first.id }, data: { caroRating: 250 } });
    await db.gameProfile.update({ where: { userId: second.id }, data: { caroRating: 750 } });
    const rankedMatchId = await matchQueuedPlayers(first.id, second.id);
    verify(Boolean(rankedMatchId), 'adjacent Caro ranks are matched');
    const rankedMatch = await db.caroMatch.findUniqueOrThrow({
      where: { id: rankedMatchId },
    });
    verify(rankedMatch.turnSeconds === 15, 'ranked matches enforce 15 seconds per turn');
    await surrenderCaroMatch(first.id, rankedMatch.id);

    const repeatMatchId = await matchQueuedPlayers(first.id, second.id);
    verify(Boolean(repeatMatchId), 'players can match again when the online player pool is small');
    await surrenderCaroMatch(first.id, repeatMatchId);
    await Promise.all([cancelRankedQueue(first.id), cancelRankedQueue(second.id)]);

    const elo = calculateElo(500, 700, 1);
    verify(
      elo.changeA > 16 && elo.changeA === -elo.changeB,
      'Elo rewards an upset and remains zero-sum',
    );
  } finally {
    if (users.length) await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
