import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EngineAnalysisResult } from '../../lib/engine/types';
import { createInitialGameState } from '../../lib/go/rules';
import { BLACK, WHITE } from '../../lib/go/types';
import { useBotTurn } from '../../lib/hooks/useBotTurn';
import { useDeadStonesDetection } from '../../lib/hooks/useDeadStonesDetection';
import { useGameAnalysis } from '../../lib/hooks/useGameAnalysis';

function makeMockAnalysis(overrides: Partial<EngineAnalysisResult> = {}): EngineAnalysisResult {
  return {
    id: 'eval_mock_1',
    boardSize: 9,
    currentPlayer: 'B',
    isMock: true,
    timestamp: Date.now(),
    winrate: 98,
    scoreLead: 25,
    suggestedMoves: [],
    scoreLoss: 0,
    ownershipGrid: [],
    ...overrides,
  };
}

describe('Hook Decomposition & Sub-hooks (HOOK-DEAD-01, HOOK-ANALYSIS-01, HOOK-BOT-01)', () => {
  describe('useDeadStonesDetection (HOOK-DEAD-01)', () => {
    it('initializes with default states for ongoing game', () => {
      let capturedState: ReturnType<typeof useDeadStonesDetection> | null = null;
      function TestHarness() {
        const state = createInitialGameState(19);
        capturedState = useDeadStonesDetection({
          gameState: state,
          analysis: null,
          isReviewing: false,
          reviewStep: null,
          historyLength: 1,
        });
        return React.createElement('div', null, 'harness');
      }

      renderToString(React.createElement(TestHarness));
      expect(capturedState).not.toBeNull();
      expect(capturedState!.showDeadStones).toBe(true);
      expect(capturedState!.isVictoryModalOpen).toBe(false);
      expect(capturedState!.deadStonesSummary).toBeNull();
      expect(capturedState!.effectiveDeadStoneKeys).toBeNull();
    });

    it('computes dead stones summary and effective keys when game is over with ownership grid', () => {
      let capturedState: ReturnType<typeof useDeadStonesDetection> | null = null;
      function TestHarness() {
        const state = {
          ...createInitialGameState(9),
          isGameOver: true,
          winner: BLACK,
        };
        // Place a single white stone at 0,0
        state.board[0][0] = WHITE;

        // Black completely dominates the board (ownership = 1.0)
        const ownershipGrid = Array(9).fill(null).map(() => Array(9).fill(1.0));

        capturedState = useDeadStonesDetection({
          gameState: state,
          analysis: makeMockAnalysis({ ownershipGrid }),
          isReviewing: false,
          reviewStep: null,
          historyLength: 10,
        });
        return React.createElement('div', null, 'harness');
      }

      renderToString(React.createElement(TestHarness));
      expect(capturedState).not.toBeNull();
      expect(capturedState!.deadStonesSummary).not.toBeNull();
      expect(capturedState!.deadStonesSummary!.whiteDeadCount).toBe(1);
      expect(capturedState!.effectiveDeadStoneKeys).not.toBeNull();
      expect(capturedState!.effectiveDeadStoneKeys!.has('0,0')).toBe(true);
    });

    it('suppresses effective dead stone keys during historical move review', () => {
      let capturedState: ReturnType<typeof useDeadStonesDetection> | null = null;
      function TestHarness() {
        const state = {
          ...createInitialGameState(9),
          isGameOver: true,
          winner: BLACK,
        };
        state.board[0][0] = WHITE;
        const ownershipGrid = Array(9).fill(null).map(() => Array(9).fill(1.0));

        capturedState = useDeadStonesDetection({
          gameState: state,
          analysis: makeMockAnalysis({ ownershipGrid }),
          isReviewing: true,
          reviewStep: 2, // Reviewing past move #2 out of 10
          historyLength: 10,
        });
        return React.createElement('div', null, 'harness');
      }

      renderToString(React.createElement(TestHarness));
      expect(capturedState).not.toBeNull();
      // Summary is still computed for the autopsy modal
      expect(capturedState!.deadStonesSummary).not.toBeNull();
      // But canvas keys are suppressed during historical move replay
      expect(capturedState!.effectiveDeadStoneKeys).toBeNull();
    });
  });

  describe('useGameAnalysis (HOOK-ANALYSIS-01)', () => {
    it('initializes with default evaluation histories and neutral states', () => {
      let capturedState: ReturnType<typeof useGameAnalysis> | null = null;
      function TestHarness() {
        capturedState = useGameAnalysis({
          playerColor: 'B',
          selectedRank: '1D',
        });
        return React.createElement('div', null, 'harness');
      }

      renderToString(React.createElement(TestHarness));
      expect(capturedState).not.toBeNull();
      expect(capturedState!.analysis).toBeNull();
      expect(capturedState!.coachAdvice).toBeNull();
      expect(capturedState!.isCoachLoading).toBe(false);
      expect(capturedState!.winrateHistory).toEqual([50]);
      expect(capturedState!.scoreLeadHistory).toEqual([0]);
      expect(capturedState!.previewCandidateCoord).toBeNull();
      expect(capturedState!.previewPvCoords).toBeNull();
    });

    it('invalidates inflight analysis sequence counter', () => {
      let capturedState: ReturnType<typeof useGameAnalysis> | null = null;
      function TestHarness() {
        capturedState = useGameAnalysis({
          playerColor: 'B',
          selectedRank: '1D',
        });
        return React.createElement('div', null, 'harness');
      }

      renderToString(React.createElement(TestHarness));
      expect(capturedState).not.toBeNull();
      const initialSeq = capturedState!.analysisSeqRef.current;
      capturedState!.invalidateInflightAnalysis();
      expect(capturedState!.analysisSeqRef.current).toBe(initialSeq + 1);
    });
  });

  describe('useBotTurn (HOOK-BOT-01)', () => {
    it('initializes with idle thinking state and resets cleanly', () => {
      let capturedState: ReturnType<typeof useBotTurn> | null = null;
      function TestHarness() {
        const state = createInitialGameState(19);
        capturedState = useBotTurn({
          gameMode: 'vs-ai',
          gameState: state,
          playerColor: 'B',
          selectedRank: '1D',
          soundEnabled: false,
          requestAnalysis: vi.fn(),
          requestCoachAdvice: vi.fn(),
          onBotMove: vi.fn(),
        });
        return React.createElement('div', null, 'harness');
      }

      renderToString(React.createElement(TestHarness));
      expect(capturedState).not.toBeNull();
      expect(capturedState!.isAiThinking).toBe(false);
      expect(capturedState!.isAiThinkingRef.current).toBe(false);

      // Verify resetBotTurn increments sequence counter and clears thinking
      const initialSeq = capturedState!.botTurnSeqRef.current;
      capturedState!.resetBotTurn();
      expect(capturedState!.botTurnSeqRef.current).toBe(initialSeq + 1);
      expect(capturedState!.isAiThinkingRef.current).toBe(false);
    });
  });
});
