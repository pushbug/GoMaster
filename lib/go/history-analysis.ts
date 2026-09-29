import { BLACK, MoveRecord, Stone, WHITE } from './types';

export type HeatmapMode = 'none' | 'both' | 'black' | 'white';

export interface ScoreDeltaInfo {
  delta: number;
  formatted: string;
  isGain: boolean;
  isLoss: boolean;
}

export interface MovePair {
  pairNumber: number;
  black: MoveRecord | null;
  white: MoveRecord | null;
}

/**
 * Cycles through the 4 heatmap display modes
 */
export function getNextHeatmapMode(current: HeatmapMode): HeatmapMode {
  switch (current) {
    case 'none':
      return 'both';
    case 'both':
      return 'black';
    case 'black':
      return 'white';
    case 'white':
      return 'none';
    default:
      return 'both';
  }
}

/**
 * Filters KataGo ownership grid according to the selected HeatmapMode
 * Positive values = Black territory, Negative values = White territory
 */
export function filterOwnershipGridByMode(
  grid: number[][] | null | undefined,
  mode: HeatmapMode
): number[][] {
  if (!grid || grid.length === 0 || mode === 'none') {
    if (!grid || grid.length === 0) return [];
    return grid.map(row => row.map(() => 0));
  }

  const threshold = 0.05;

  return grid.map(row =>
    row.map(val => {
      if (Math.abs(val) <= threshold) return 0;

      if (mode === 'both') {
        return val;
      }
      if (mode === 'black') {
        return val > threshold ? val : 0;
      }
      if (mode === 'white') {
        return val < -threshold ? val : 0;
      }
      return 0;
    })
  );
}

/**
 * Calculates score delta for a given move number based on scoreLeadHistory.
 * In KataGo, scoreLead is positive for Black and negative for White.
 * - For Black move at index N: delta = scoreLead[N] - scoreLead[N-1]
 * - For White move at index N: delta = -(scoreLead[N] - scoreLead[N-1]) = scoreLead[N-1] - scoreLead[N]
 */
export function calculateMoveScoreDelta(
  moveNumber: number,
  color: Stone,
  scoreLeadHistory: number[]
): ScoreDeltaInfo | null {
  if (!scoreLeadHistory || scoreLeadHistory.length <= moveNumber || moveNumber < 1) {
    return null;
  }

  const currentLead = scoreLeadHistory[moveNumber];
  const prevLead = scoreLeadHistory[moveNumber - 1];

  if (typeof currentLead !== 'number' || typeof prevLead !== 'number') {
    return null;
  }

  // Calculate raw delta for the active player who played this move
  const rawDelta =
    color === BLACK ? currentLead - prevLead : prevLead - currentLead;

  // Round to 1 decimal place
  const delta = Math.round(rawDelta * 10) / 10;
  const isGain = delta > 0.05;
  const isLoss = delta < -0.05;
  const formatted = delta > 0 ? `+${delta.toFixed(1)}` : `${delta.toFixed(1)}`;

  return {
    delta,
    formatted,
    isGain,
    isLoss,
  };
}

/**
 * Groups a linear list of MoveRecords into 2-column move pairs (Black on left, White on right)
 */
export function groupMovesIntoPairs(history: MoveRecord[]): MovePair[] {
  const pairs: MovePair[] = [];

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const isBlack = move.color === BLACK;

    if (isBlack) {
      pairs.push({
        pairNumber: pairs.length + 1,
        black: move,
        white: null,
      });
    } else {
      if (pairs.length > 0 && pairs[pairs.length - 1].white === null) {
        pairs[pairs.length - 1].white = move;
      } else {
        // If White plays first (e.g. handicap game where Black places handicap stones first)
        pairs.push({
          pairNumber: pairs.length + 1,
          black: null,
          white: move,
        });
      }
    }
  }

  return pairs;
}
