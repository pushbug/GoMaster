/**
 * GoMaster - Go (Baduk / Weiqi) Engine Types
 */

export const EMPTY = 0 as const;
export const BLACK = 1 as const;
export const WHITE = 2 as const;

export type Stone = typeof EMPTY | typeof BLACK | typeof WHITE;
export type PlayerColor = typeof BLACK | typeof WHITE;
export type BoardSize = 9 | 13 | 19;

export interface Point {
  x: number; // 0 to size - 1 (0 = Column A)
  y: number; // 0 to size - 1 (0 = Row 19 / Top Row)
}

export interface Group {
  color: PlayerColor;
  stones: Point[];
  liberties: Point[];
}

export interface MoveRecord {
  moveNumber: number;
  color: PlayerColor;
  point: Point | null; // null represents PASS
  isPass?: boolean;
  isResign?: boolean;
  capturedStones: Point[];
  boardHash: string;
}

export interface GameState {
  board: Stone[][]; // board[y][x]
  boardSize: BoardSize;
  turn: PlayerColor;
  captures: {
    black: number; // White stones captured by Black
    white: number; // Black stones captured by White
  };
  history: MoveRecord[];
  boardHashes: Set<string>; // Set of all prior board hashes for Superko / Ko validation
  koPoint: Point | null; // Simple Ko restriction point (if applicable)
  lastMove: Point | null;
  consecutivePasses: number;
  isGameOver: boolean;
  winner: PlayerColor | 'DRAW' | null;
  resignReason?: string;
}

export interface MoveValidationResult {
  valid: boolean;
  reason?: 'OCCUPIED' | 'OUT_OF_BOUNDS' | 'SUICIDE' | 'KO_VIOLATION' | 'GAME_OVER';
  capturedStones?: Point[];
}
