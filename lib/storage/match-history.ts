import { Rank } from '../engine/difficulty';
import { BoardSize } from '../go/types';

export type MoveQuality = 'Best' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';

export interface MoveEvaluationRecord {
  moveNumber: number;
  coord: string;
  color: 'B' | 'W';
  scoreLoss: number;
  quality: MoveQuality;
}

export interface MatchRecord {
  id: string;
  date: string;
  boardSize: BoardSize;
  playerColor: 'B' | 'W';
  botRank: Rank;
  result: string;
  winner: 'Player' | 'AI' | 'Draw';
  totalMoves: number;
  accuracyScore: number; // 0 to 100%
  sgf: string;
  winrateHistory: number[];
  scoreLeadHistory: number[];
}

const STORAGE_KEY = 'gomaster_match_history';
const MAX_SAVED_MATCHES = 50;

/**
 * Classifies a move based on points lost compared to KataGo's best recommendation
 */
export function classifyMoveQuality(scoreLoss: number): MoveQuality {
  if (scoreLoss <= 0.3) return 'Best';
  if (scoreLoss <= 1.0) return 'Good';
  if (scoreLoss <= 3.0) return 'Inaccuracy';
  if (scoreLoss <= 6.0) return 'Mistake';
  return 'Blunder';
}

/**
 * Calculates game accuracy percentage (0-100%) for player's moves
 */
export function calculateAccuracy(playerLosses: number[]): number {
  if (playerLosses.length === 0) return 100;

  const totalLoss = playerLosses.reduce((acc, loss) => acc + Math.max(0, loss), 0);
  const avgLoss = totalLoss / playerLosses.length;

  // Chess/Go exponential dampening formula: 100 * exp(-0.15 * avgLoss)
  const accuracy = Math.round(100 * Math.exp(-0.16 * avgLoss) * 10) / 10;
  return Math.max(10, Math.min(100, accuracy));
}

/**
 * Saves a completed match record into localStorage with FIFO 50-game cap
 */
export function saveMatchRecord(record: MatchRecord): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getMatchHistory();
    const updated = [record, ...existing].slice(0, MAX_SAVED_MATCHES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Graceful fallback if localStorage is disabled or full
  }
}

/**
 * Retrieves all stored match records from localStorage
 */
export function getMatchHistory(): MatchRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchRecord[];
  } catch {
    return [];
  }
}

/**
 * Clears all stored match records
 */
export function clearMatchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
