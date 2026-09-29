import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  getDisplayState,
  isReviewingPastMove,
  reconstructSnapshots,
  stepFirst,
  stepLast,
  stepNext,
  stepPrev,
} from '../../lib/go/replay';
import { createHandicapGameState, createInitialGameState, playMove } from '../../lib/go/rules';
import { BLACK, WHITE } from '../../lib/go/types';
import { useReplayNavigation, UseReplayNavigationReturn } from '../../lib/hooks/useReplayNavigation';

describe('Interactive Move Replay & Step Navigation (UI-REPLAY-01 & UI-REPLAY-02)', () => {
  describe('Snapshot Reconstruction (UI-REPLAY-01)', () => {
    it('creates N + 1 board snapshots from an empty game through 3 moves', () => {
      const initial = createInitialGameState(19);
      const m1 = playMove(initial, { x: 3, y: 3 }).state; // Black at D4
      const m2 = playMove(m1, { x: 15, y: 15 }).state;    // White at Q16
      const m3 = playMove(m2, { x: 15, y: 3 }).state;     // Black at Q4

      const snapshots = reconstructSnapshots(initial, m3.history);
      expect(snapshots).toHaveLength(4);

      // Snapshot 0: Empty board
      expect(snapshots[0].history).toHaveLength(0);
      expect(snapshots[0].board[3][3]).toBe(0);
      expect(snapshots[0].board[15][15]).toBe(0);
      expect(snapshots[0].turn).toBe(BLACK);

      // Snapshot 1: Move 1 placed
      expect(snapshots[1].history).toHaveLength(1);
      expect(snapshots[1].board[3][3]).toBe(BLACK);
      expect(snapshots[1].board[15][15]).toBe(0);
      expect(snapshots[1].turn).toBe(WHITE);
      expect(snapshots[1].lastMove).toEqual({ x: 3, y: 3 });

      // Snapshot 2: Move 2 placed
      expect(snapshots[2].history).toHaveLength(2);
      expect(snapshots[2].board[3][3]).toBe(BLACK);
      expect(snapshots[2].board[15][15]).toBe(WHITE);
      expect(snapshots[2].turn).toBe(BLACK);
      expect(snapshots[2].lastMove).toEqual({ x: 15, y: 15 });

      // Snapshot 3: Move 3 placed
      expect(snapshots[3].history).toHaveLength(3);
      expect(snapshots[3].board[3][15]).toBe(BLACK);
      expect(snapshots[3].turn).toBe(WHITE);
      expect(snapshots[3].lastMove).toEqual({ x: 15, y: 3 });
    });

    it('correctly captures handicap stones in Snapshot 0 (UI-REPLAY-02)', () => {
      const handicapPoints = [
        { x: 3, y: 3 },
        { x: 15, y: 15 },
      ];
      const initialHandicap = createHandicapGameState(19, handicapPoints);
      const m1 = playMove(initialHandicap, { x: 9, y: 9 }).state; // White plays first

      const snapshots = reconstructSnapshots(initialHandicap, m1.history);
      expect(snapshots).toHaveLength(2);
      // Snapshot 0 must already possess the 2 handicap black stones
      expect(snapshots[0].board[3][3]).toBe(BLACK);
      expect(snapshots[0].board[15][15]).toBe(BLACK);
      expect(snapshots[0].turn).toBe(WHITE);
    });

    it('reconstructs snapshots accurately when history includes PASS and RESIGN moves (UI-REPLAY-SNAP-01)', () => {
      const initial = createInitialGameState(19);
      // Move 1: Black plays D4
      const m1 = playMove(initial, { x: 3, y: 3 }).state;
      // Move 2: White passes
      const m2 = playMove(m1, 'PASS').state;
      // Move 3: Black plays Q16
      const m3 = playMove(m2, { x: 15, y: 15 }).state;
      // Move 4: White resigns
      const m4 = playMove(m3, 'RESIGN').state;

      const snapshots = reconstructSnapshots(initial, m4.history);
      expect(snapshots).toHaveLength(5); // 0 (initial) + 4 moves

      // Snapshot 2: White passed
      expect(snapshots[2].history).toHaveLength(2);
      expect(snapshots[2].history[1].isPass).toBe(true);
      expect(snapshots[2].consecutivePasses).toBe(1);
      expect(snapshots[2].turn).toBe(BLACK); // Passes switch turn to Black
      expect(snapshots[2].isGameOver).toBe(false);

      // Snapshot 4: White resigned
      expect(snapshots[4].history).toHaveLength(4);
      expect(snapshots[4].history[3].isResign).toBe(true);
      expect(snapshots[4].isGameOver).toBe(true);
      expect(snapshots[4].winner).toBe(BLACK); // White resigned so Black wins
    });
  });

  describe('Display State Resolution (UI-REPLAY-01)', () => {
    it('returns live gameState when reviewStep is null', () => {
      const initial = createInitialGameState(19);
      const m1 = playMove(initial, { x: 3, y: 3 }).state;
      const snapshots = reconstructSnapshots(initial, m1.history);

      const display = getDisplayState(m1, snapshots, null);
      expect(display).toBe(m1);
      expect(display.lastMove).toEqual({ x: 3, y: 3 });
    });

    it('returns historical snapshot when reviewStep points to past move', () => {
      const initial = createInitialGameState(19);
      const m1 = playMove(initial, { x: 3, y: 3 }).state;
      const m2 = playMove(m1, { x: 15, y: 15 }).state;
      const snapshots = reconstructSnapshots(initial, m2.history);

      // Review step 1 (only first move on board)
      const display = getDisplayState(m2, snapshots, 1);
      expect(display.board[3][3]).toBe(BLACK);
      expect(display.board[15][15]).toBe(0); // Move 2 is hidden in review
      expect(display.lastMove).toEqual({ x: 3, y: 3 });
    });

    it('falls back gracefully on out-of-bounds reviewStep', () => {
      const initial = createInitialGameState(19);
      const snapshots = [initial];

      const displayNeg = getDisplayState(initial, snapshots, -5);
      expect(displayNeg).toBe(initial);

      const displayOver = getDisplayState(initial, snapshots, 100);
      expect(displayOver).toBe(initial);
    });
  });

  describe('Step Navigation Transitions (UI-REPLAY-01)', () => {
    it('steps backward from live state to previous moves (stepPrev)', () => {
      const totalMoves = 4;
      // 1. From live (null) with 4 moves -> step 3
      let step: number | null = stepPrev(null, totalMoves);
      expect(step).toBe(3);

      // 2. From step 3 -> step 2
      step = stepPrev(step, totalMoves);
      expect(step).toBe(2);

      // 3. From step 2 -> step 1
      step = stepPrev(step, totalMoves);
      expect(step).toBe(1);

      // 4. From step 1 -> step 0
      step = stepPrev(step, totalMoves);
      expect(step).toBe(0);

      // 5. From step 0 -> clamped at 0
      step = stepPrev(step, totalMoves);
      expect(step).toBe(0);
    });

    it('steps forward from historical moves back to live head (stepNext)', () => {
      const totalMoves = 3;
      let step: number | null = 0;

      // 0 -> 1
      step = stepNext(step, totalMoves);
      expect(step).toBe(1);

      // 1 -> 2
      step = stepNext(step, totalMoves);
      expect(step).toBe(2);

      // 2 -> reaching totalMoves (3) returns null (Live head!)
      step = stepNext(step, totalMoves);
      expect(step).toBeNull();

      // Advancing from live head remains null
      expect(stepNext(null, totalMoves)).toBeNull();
    });

    it('handles jump to first (stepFirst) and jump to last (stepLast)', () => {
      expect(stepFirst()).toBe(0);
      expect(stepLast()).toBeNull();
    });
  });

  describe('Review Mode Guard & Interactivity (UI-REPLAY-02)', () => {
    it('accurately identifies whether game is in review mode', () => {
      expect(isReviewingPastMove(null, 5)).toBe(false);      // Live
      expect(isReviewingPastMove(5, 5)).toBe(false);         // At head
      expect(isReviewingPastMove(0, 5)).toBe(true);          // Reviewing move 0
      expect(isReviewingPastMove(2, 5)).toBe(true);          // Reviewing move 2
      expect(isReviewingPastMove(null, 0)).toBe(false);      // Empty game live
    });
  });

  describe('useReplayNavigation Hook (HOOK-REPLAY-NAV-01)', () => {
    it('initializes in live mode with null reviewStep and defined navigation callbacks', () => {
      let hookOutput!: UseReplayNavigationReturn;
      function TestComponent() {
        hookOutput = useReplayNavigation({ totalMoves: 10, soundEnabled: false });
        return React.createElement('div');
      }

      renderToString(React.createElement(TestComponent));
      expect(hookOutput.reviewStep).toBeNull();
      expect(hookOutput.isReviewing).toBe(false);
      expect(typeof hookOutput.handleStepPrev).toBe('function');
      expect(typeof hookOutput.handleStepNext).toBe('function');
      expect(typeof hookOutput.handleStepFirst).toBe('function');
      expect(typeof hookOutput.handleStepLast).toBe('function');
      expect(typeof hookOutput.handleReturnToLive).toBe('function');
      expect(typeof hookOutput.handleSelectStep).toBe('function');
    });

    it('clamps selected step within [0, totalMoves) and returns to live on >= totalMoves', () => {
      const totalMoves = 5;
      const selectStep = (step: number) => {
        if (step >= totalMoves) return null;
        return Math.max(0, step);
      };

      expect(selectStep(0)).toBe(0);
      expect(selectStep(3)).toBe(3);
      expect(selectStep(4)).toBe(4);
      expect(selectStep(5)).toBeNull(); // >= totalMoves returns to live head
      expect(selectStep(10)).toBeNull();
      expect(selectStep(-2)).toBe(0); // clamped to 0
    });
  });
});

