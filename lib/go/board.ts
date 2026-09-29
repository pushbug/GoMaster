import { BoardSize, EMPTY, Point, Stone } from './types';

// Standard Go coordinate letters (excluding 'I' to avoid confusion with '1' or 'J')
export const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

/**
 * Creates an empty Go board matrix [y][x] filled with EMPTY (0)
 */
export function createEmptyBoard(size: BoardSize): Stone[][] {
  const board: Stone[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Stone[] = [];
    for (let x = 0; x < size; x++) {
      row.push(EMPTY);
    }
    board.push(row);
  }
  return board;
}

/**
 * Deep clones a board matrix
 */
export function cloneBoard(board: Stone[][]): Stone[][] {
  return board.map(row => [...row]);
}

/**
 * Compares two points for coordinate equality
 */
export function arePointsEqual(p1: Point | null, p2: Point | null): boolean {
  if (!p1 || !p2) return p1 === p2;
  return p1.x === p2.x && p1.y === p2.y;
}

/**
 * Converts a Point {x, y} to standard Go coordinate notation (e.g. Q16, D4)
 * x = 0 -> A, y = 0 -> size (top row), y = size - 1 -> 1 (bottom row)
 */
export function pointToString(point: Point, size: BoardSize): string {
  if (point.x < 0 || point.x >= size || point.y < 0 || point.y >= size) {
    return 'PASS';
  }
  const colLetter = COLUMN_LETTERS[point.x];
  const rowNum = size - point.y;
  return `${colLetter}${rowNum}`;
}

/**
 * Parses standard Go coordinate string (e.g. "Q16", "d4", "pass") to Point {x, y}
 */
export function stringToPoint(coordStr: string, size: BoardSize): Point | null {
  const clean = coordStr.trim().toUpperCase();
  if (clean === 'PASS' || clean === '' || clean === '..') {
    return null;
  }

  const colLetter = clean[0];
  const colIndex = COLUMN_LETTERS.indexOf(colLetter);
  if (colIndex === -1 || colIndex >= size) {
    return null;
  }

  const rowNum = parseInt(clean.slice(1), 10);
  if (isNaN(rowNum) || rowNum < 1 || rowNum > size) {
    return null;
  }

  return {
    x: colIndex,
    y: size - rowNum,
  };
}

/**
 * Gets standard star points (Hoshi) for the specified board size
 */
export function getStarPoints(size: BoardSize): Point[] {
  if (size === 19) {
    const coords = [3, 9, 15];
    const points: Point[] = [];
    for (const y of coords) {
      for (const x of coords) {
        points.push({ x, y });
      }
    }
    return points;
  }

  if (size === 13) {
    return [
      { x: 3, y: 3 },
      { x: 9, y: 3 },
      { x: 6, y: 6 }, // Tengen
      { x: 3, y: 9 },
      { x: 9, y: 9 },
    ];
  }

  if (size === 9) {
    return [
      { x: 2, y: 2 },
      { x: 6, y: 2 },
      { x: 4, y: 4 }, // Tengen
      { x: 2, y: 6 },
      { x: 6, y: 6 },
    ];
  }

  return [];
}

/**
 * Generates a deterministic string hash of the board matrix for Ko / Superko verification
 */
export function boardToHash(board: Stone[][]): string {
  return board.map(row => row.join('')).join('');
}
