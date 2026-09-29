import { BoardSize, Point } from '../go/types';

/**
 * Standard KataGo Move tuple: [Color, Coordinate]
 * e.g. ["B", "Q16"] or ["W", "pass"]
 */
export type KataGoColor = 'B' | 'W';
export type KataGoMove = [KataGoColor, string];

/**
 * Native KataGo JSON Analysis Protocol Query Schema
 */
export interface KataGoAnalysisQuery {
  id: string;
  moves: KataGoMove[];
  rules: 'japanese' | 'chinese' | 'korean' | 'tromp-taylor';
  komi: number;
  boardXSize: number;
  boardYSize: number;
  maxVisits?: number;
  includeOwnership?: boolean;
  includePolicy?: boolean;
}

/**
 * Move candidate details returned by KataGo
 */
export interface KataGoMoveInfo {
  move: string;
  visits: number;
  winrate: number; // 0.0 to 1.0
  scoreLead: number;
  scoreSelfplay?: number;
  scoreLoss?: number;
  pv: string[]; // Principle variation continuation moves
  order: number; // 0 is best
}

/**
 * Raw response line from KataGo analysis engine
 */
export interface KataGoRawResponse {
  id: string;
  isBase?: boolean;
  turnNumber?: number;
  moveInfos: KataGoMoveInfo[];
  rootInfo: {
    winrate: number;
    scoreLead: number;
    visits: number;
    currentPlayer: KataGoColor;
  };
  ownership?: number[]; // 1D array length X * Y (-1.0 to 1.0)
}

/**
 * Clean, structured analysis result used by GoMaster UI and AI Sensei
 */
export interface CandidateMoveEvaluation {
  point: Point | null;
  coord: string;
  winrate: number; // 0 to 100%
  scoreLead: number; // Points ahead for current player
  scoreLoss: number; // Points lost compared to best move
  pv: string[];
  visits: number;
  rank: number; // 1 = best
}

export interface EngineAnalysisResult {
  id: string;
  boardSize: BoardSize;
  currentPlayer: KataGoColor;
  winrate: number; // 0 to 100% (Black's win probability)
  scoreLead: number; // Points lead for Black (+ Black leads, - White leads)
  scoreLoss: number; // Score loss of the last move played (0 for opening or best move)
  ownershipGrid: number[][]; // 2D [y][x] array, -1.0 (White) to 1.0 (Black)
  suggestedMoves: CandidateMoveEvaluation[];
  isMock: boolean;
  timestamp: number;
}

export interface AnalyzeApiRequest {
  boardSize?: BoardSize;
  moves: Array<{
    color: 'B' | 'W';
    point: Point | null; // null for pass
  }>;
  rules?: 'japanese' | 'chinese';
  komi?: number;
  maxVisits?: number;
}
