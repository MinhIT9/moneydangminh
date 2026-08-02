import { CARO_BOARD_SIZE, findCaroWinningLine, type CaroCell } from '../src/lib/caro';

const at = (row: number, column: number) => row * CARO_BOARD_SIZE + column;
const emptyBoard = (): CaroCell[] => Array.from({ length: CARO_BOARD_SIZE ** 2 }, () => null);

function verify(condition: boolean, rule: string) {
  if (!condition) throw new Error(`Caro rule failed: ${rule}`);
  console.info(`PASS: ${rule}`);
}

let board = emptyBoard();
for (let column = 4; column <= 8; column += 1) board[at(8, column)] = 'X';
verify(findCaroWinningLine(board, at(8, 6)).length === 5, 'open five wins');

board = emptyBoard();
for (let column = 4; column <= 9; column += 1) board[at(8, column)] = 'X';
board[at(8, 3)] = 'O';
board[at(8, 10)] = 'O';
verify(findCaroWinningLine(board, at(8, 7)).length === 0, 'two blocked ends do not win');

board = emptyBoard();
for (let column = 0; column <= 4; column += 1) board[at(3, column)] = 'X';
board[at(3, 5)] = 'O';
verify(findCaroWinningLine(board, at(3, 2)).length === 5, 'board edge is not a blocker');

board = emptyBoard();
for (let offset = 0; offset < 5; offset += 1) board[at(4 + offset, 4 + offset)] = 'O';
verify(findCaroWinningLine(board, at(6, 6)).length === 5, 'diagonal five wins');
