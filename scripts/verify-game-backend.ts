import 'dotenv/config';

import { randomBytes } from 'node:crypto';
import { db } from '../src/lib/db';
import {
  calculateElo,
  createPrivateRoom,
  joinPrivateRoom,
  offerCaroDraw,
  playCaroMove,
  respondCaroDraw,
  setRoomReady,
  startPrivateRoom,
} from '../src/lib/game';

const suffix = randomBytes(5).toString('hex');
const users: string[] = [];

function verify(condition: boolean, message: string) {
  if (!condition) throw new Error(`Game backend failed: ${message}`);
  console.info(`PASS: ${message}`);
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
