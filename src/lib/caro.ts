export type CaroMark = 'X' | 'O';
export type CaroCell = CaroMark | null;

export const CARO_BOARD_SIZE = 19;

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function inside(row: number, column: number, size: number) {
  return row >= 0 && row < size && column >= 0 && column < size;
}

function cellIndex(row: number, column: number, size: number) {
  return row * size + column;
}

/**
 * Returns the winning contiguous line. Five or more pieces win unless an
 * opponent piece blocks both ends. A board edge never counts as a blocker.
 */
export function findCaroWinningLine(board: CaroCell[], lastIndex: number, size = CARO_BOARD_SIZE) {
  const mark = board[lastIndex];
  if (!mark) return [];

  const opponent: CaroMark = mark === 'X' ? 'O' : 'X';
  const originRow = Math.floor(lastIndex / size);
  const originColumn = lastIndex % size;

  for (const [rowStep, columnStep] of directions) {
    const backward: number[] = [];
    let row = originRow - rowStep;
    let column = originColumn - columnStep;

    while (inside(row, column, size) && board[cellIndex(row, column, size)] === mark) {
      backward.unshift(cellIndex(row, column, size));
      row -= rowStep;
      column -= columnStep;
    }
    const blockedBefore =
      inside(row, column, size) && board[cellIndex(row, column, size)] === opponent;

    const forward: number[] = [];
    row = originRow + rowStep;
    column = originColumn + columnStep;
    while (inside(row, column, size) && board[cellIndex(row, column, size)] === mark) {
      forward.push(cellIndex(row, column, size));
      row += rowStep;
      column += columnStep;
    }
    const blockedAfter =
      inside(row, column, size) && board[cellIndex(row, column, size)] === opponent;
    const line = [...backward, lastIndex, ...forward];

    if (line.length >= 5 && !(blockedBefore && blockedAfter)) return line;
  }

  return [];
}

export function caroCoordinate(index: number, size = CARO_BOARD_SIZE) {
  const row = Math.floor(index / size) + 1;
  const column = index % size;
  const columnLabel = String.fromCharCode(65 + column);
  return `${columnLabel}${row}`;
}
