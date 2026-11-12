import { playMove } from './rules';
import { boardToHash } from './board';
import { GameState, MoveRecord, ReplaySnapshot } from './types';

export function createReplaySnapshot(state: GameState): ReplaySnapshot {
  return {
    board: state.board,
    boardSize: state.boardSize,
    moveNumber: state.history.length,
    turn: state.turn,
    captures: state.captures,
    koPoint: state.koPoint,
    lastMove: state.lastMove,
    consecutivePasses: state.consecutivePasses,
    isGameOver: state.isGameOver,
    winner: state.winner,
    resignReason: state.resignReason,
  };
}

export function restoreReplaySnapshot(
  snapshot: ReplaySnapshot,
  canonicalHistory: MoveRecord[],
  initialSnapshot: ReplaySnapshot = snapshot
): GameState {
  const history = canonicalHistory.slice(0, snapshot.moveNumber);
  const boardHashes = new Set<string>([
    boardToHash(initialSnapshot.board),
    ...history.map(move => move.boardHash),
  ]);

  return {
    board: snapshot.board,
    boardSize: snapshot.boardSize,
    turn: snapshot.turn,
    captures: snapshot.captures,
    history,
    boardHashes,
    koPoint: snapshot.koPoint,
    lastMove: snapshot.lastMove,
    consecutivePasses: snapshot.consecutivePasses,
    isGameOver: snapshot.isGameOver,
    winner: snapshot.winner,
    resignReason: snapshot.resignReason,
  };
}

export function reconstructReplaySnapshots(
  initialState: GameState,
  history: MoveRecord[]
): ReplaySnapshot[] {
  return reconstructSnapshots(initialState, history).map(createReplaySnapshot);
}

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
  snapshots: Array<ReplaySnapshot | GameState>,
  reviewStep: number | null
): GameState {
  if (reviewStep === null || reviewStep >= gameState.history.length) {
    return gameState;
  }
  const clamped = Math.max(0, Math.min(reviewStep, snapshots.length - 1));
  const snapshot = snapshots[clamped];
  if (snapshot && 'history' in snapshot) {
    return snapshot;
  }
  const initialSnapshot = snapshots[0];
  return snapshot
    ? restoreReplaySnapshot(
        snapshot,
        gameState.history,
        initialSnapshot && !('history' in initialSnapshot)
          ? initialSnapshot
          : createReplaySnapshot(initialSnapshot ?? gameState)
      )
    : gameState;
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
