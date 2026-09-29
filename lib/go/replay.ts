import { playMove } from './rules';
import { GameState, MoveRecord } from './types';

/**
 * Reconstructs or maintains an array of GameState snapshots indexed from 0 (initial) to N (move N).
 */
export function reconstructSnapshots(
  initialState: GameState,
  history: MoveRecord[]
): GameState[] {
  const snapshots: GameState[] = [initialState];
  let current = initialState;

  for (const record of history) {
    if (record.isResign) {
      current = playMove(current, 'RESIGN').state;
    } else if (record.isPass || record.point === null) {
      current = playMove(current, 'PASS').state;
    } else {
      current = playMove(current, record.point).state;
    }
    snapshots.push(current);
  }

  return snapshots;
}

/**
 * Determines the active GameState to display on the board.
 * When reviewStep is null or equals history.length, returns the live game state.
 * Otherwise returns the snapshot corresponding to reviewStep.
 */
export function getDisplayState(
  gameState: GameState,
  snapshots: GameState[],
  reviewStep: number | null
): GameState {
  if (reviewStep === null || reviewStep >= gameState.history.length) {
    return gameState;
  }
  const clamped = Math.max(0, Math.min(reviewStep, snapshots.length - 1));
  return snapshots[clamped] ?? gameState;
}

/**
 * Steps backward by 1 move.
 * If currently live (reviewStep === null), enters review mode at totalMoves - 1.
 * Clamps to step 0.
 */
export function stepPrev(
  currentStep: number | null,
  totalMoves: number
): number {
  if (totalMoves === 0) return 0;
  if (currentStep === null) {
    return Math.max(0, totalMoves - 1);
  }
  return Math.max(0, currentStep - 1);
}

/**
 * Steps forward by 1 move.
 * If currently at or advancing to totalMoves, returns null to resume live state.
 */
export function stepNext(
  currentStep: number | null,
  totalMoves: number
): number | null {
  if (currentStep === null) return null;
  const next = currentStep + 1;
  if (next >= totalMoves) {
    return null; // Return to live head
  }
  return next;
}

/**
 * Jumps directly to move 0 (initial board).
 */
export function stepFirst(): number {
  return 0;
}

/**
 * Jumps to the latest move / resumes live mode (null).
 */
export function stepLast(): null {
  return null;
}

/**
 * Checks whether an active review session is currently detached from the live game head.
 */
export function isReviewingPastMove(
  reviewStep: number | null,
  totalMoves: number
): boolean {
  return reviewStep !== null && reviewStep < totalMoves;
}
