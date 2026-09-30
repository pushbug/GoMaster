import { describe, expect, it } from 'vitest';
import {
  evaluateBotPass,
  evaluateBotResignation,
  isPositionHopeless,
} from '../../lib/engine/bot-policy';
import { CandidateMoveEvaluation } from '../../lib/engine/types';
import { createInitialGameState, playMove } from '../../lib/go/rules';
import { BLACK, WHITE } from '../../lib/go/types';

describe('Bot Policy: Resignation & Smart Pass (BOT-RESIGN-01, BOT-RESIGN-02, BOT-PASS-01)', () => {
  describe('BOT-RESIGN-01: Resignation Thresholds & Polarity', () => {
    it('evaluates resignation when White bot is trailing with <= 3% winrate and >= 30 deficit after move 40', () => {
      // KataGo returns analysis from Black's perspective:
      // Black winrate: 98.0%, Black lead: +35.5 (Bot White has 2.0% winrate, -35.5 lead)
      const result = evaluateBotResignation({
        botColor: WHITE,
        analysisWinrate: 98.0,
        analysisScoreLead: 35.5,
        moveNumber: 65,
        boardSize: 19,
        hopelessTurnsCount: 2,
      });

      expect(result.shouldResign).toBe(true);
      expect(result.reason).toContain('บอทยอมแพ้');
      expect(result.reason).toContain('35.5 แต้ม');
      expect(result.botWinrate).toBeCloseTo(2.0);
      expect(result.botScoreLead).toBeCloseTo(-35.5);
    });

    it('evaluates resignation when Black bot is trailing with <= 3% winrate and >= 30 deficit', () => {
      // Black bot perspective:
      // Black winrate: 1.5%, Black lead: -32.0 (Bot Black has 1.5% winrate, -32.0 lead)
      const result = evaluateBotResignation({
        botColor: BLACK,
        analysisWinrate: 1.5,
        analysisScoreLead: -32.0,
        moveNumber: 55,
        boardSize: 19,
        hopelessTurnsCount: 2,
      });

      expect(result.shouldResign).toBe(true);
      expect(result.reason).toContain('บอทยอมแพ้');
      expect(result.reason).toContain('32.0 แต้ม');
      expect(result.botWinrate).toBeCloseTo(1.5);
      expect(result.botScoreLead).toBeCloseTo(-32.0);
    });

    it('scales deficit thresholds for 13x13 (18 pts) and 9x9 (10 pts) boards', () => {
      // 13x13 board: deficit >= 18 pts
      const result13 = evaluateBotResignation({
        botColor: WHITE,
        analysisWinrate: 98.5,
        analysisScoreLead: 19.0,
        moveNumber: 30,
        boardSize: 13,
        hopelessTurnsCount: 2,
      });
      expect(result13.shouldResign).toBe(true);

      // 9x9 board: deficit >= 10 pts
      const result9 = evaluateBotResignation({
        botColor: WHITE,
        analysisWinrate: 99.0,
        analysisScoreLead: 11.0,
        moveNumber: 18,
        boardSize: 9,
        hopelessTurnsCount: 2,
      });
      expect(result9.shouldResign).toBe(true);
    });
  });

  describe('BOT-RESIGN-02: Fuseki & Hysteresis Safety Guards', () => {
    it('prevents resignation during early fuseki (move < 40 on 19x19) even with large local loss', () => {
      const result = evaluateBotResignation({
        botColor: WHITE,
        analysisWinrate: 99.0,
        analysisScoreLead: 45.0,
        moveNumber: 18, // Early fuseki!
        boardSize: 19,
        hopelessTurnsCount: 2,
      });

      expect(result.shouldResign).toBe(false);
      expect(result.reason).toBeNull();
    });

    it('prevents premature resignation on the first turn of deficit (hopelessTurnsCount = 1)', () => {
      const result = evaluateBotResignation({
        botColor: WHITE,
        analysisWinrate: 98.5,
        analysisScoreLead: 40.0,
        moveNumber: 60,
        boardSize: 19,
        hopelessTurnsCount: 1, // Only 1 turn, not confirmed yet
      });

      expect(result.shouldResign).toBe(false);
      expect(result.reason).toBeNull();
    });

    it('rejects resignation when score deficit is small or manageable', () => {
      const result = evaluateBotResignation({
        botColor: WHITE,
        analysisWinrate: 90.0, // Bot has 10%
        analysisScoreLead: 8.0, // Bot only trailing by 8 points
        moveNumber: 60,
        boardSize: 19,
        hopelessTurnsCount: 5,
      });

      expect(result.shouldResign).toBe(false);
    });

    it('identifies when a position recovers from hopeless status', () => {
      // Position where bot is winning or trailing by a small margin
      expect(isPositionHopeless(WHITE, 50.0, 0.0, 70, 19)).toBe(false);
      expect(isPositionHopeless(WHITE, 90.0, 12.0, 70, 19)).toBe(false);
      expect(isPositionHopeless(BLACK, 40.0, -5.0, 70, 19)).toBe(false);
    });
  });

  describe('BOT-PASS-01: Smart Pass Conditions', () => {
    const mockCandidates: CandidateMoveEvaluation[] = [
      {
        point: { x: 3, y: 3 },
        coord: 'D4',
        winrate: 95.0,
        scoreLead: 15.0,
        scoreLoss: 0,
        pv: ['D4'],
        visits: 500,
        rank: 1,
      },
    ];

    it('passes when KataGo explicitly recommends PASS as top move', () => {
      const passCandidates: CandidateMoveEvaluation[] = [
        {
          point: null,
          coord: 'PASS',
          winrate: 98.0,
          scoreLead: 20.0,
          scoreLoss: 0,
          pv: ['PASS'],
          visits: 300,
          rank: 1,
        },
      ];

      const state = createInitialGameState(19);
      const passResult = evaluateBotPass({
        botColor: WHITE,
        gameState: state,
        suggestedMoves: passCandidates,
        analysisWinrate: 2.0,
        analysisScoreLead: -20.0,
        boardSize: 19,
      });

      expect(passResult.shouldPass).toBe(true);
      expect(passResult.reason).toContain('KataGo แนะนำให้ผ่านหมาก');
    });

    it('passes to conclude game when opponent just passed and bot is safely ahead in endgame', () => {
      const baseState = createInitialGameState(19);
      // Simulate opponent pass
      const passRes = playMove(baseState, 'PASS');
      expect(passRes.success).toBe(true);

      // Create dummy history to simulate endgame (>= 90 moves)
      const endgameHistory = Array.from({ length: 95 }, (_, i) => ({
        moveNumber: i + 1,
        color: (i % 2 === 0 ? BLACK : WHITE) as any,
        point: { x: 0, y: 0 },
        capturedStones: [],
        boardHash: 'hash',
      }));

      const stateWithHistory = {
        ...passRes.state,
        history: endgameHistory,
        consecutivePasses: 1,
      };

      // White bot has 95% winrate (+25.0 points)
      const result = evaluateBotPass({
        botColor: WHITE,
        gameState: stateWithHistory,
        suggestedMoves: mockCandidates,
        analysisWinrate: 5.0, // Black has 5%, White has 95%
        analysisScoreLead: -25.0, // White leading by 25
        boardSize: 19,
      });

      expect(result.shouldPass).toBe(true);
      expect(result.reason).toContain('ผ่านหมากจบเกม');
    });

    it('passes when no candidate moves are available instead of placing random stones', () => {
      const state = createInitialGameState(19);
      const result = evaluateBotPass({
        botColor: WHITE,
        gameState: state,
        suggestedMoves: [],
        analysisWinrate: 50.0,
        analysisScoreLead: 0,
        boardSize: 19,
      });

      expect(result.shouldPass).toBe(true);
      expect(result.reason).toContain('ไม่มีหมากแนะนำ');
    });

    it('does NOT pass during normal play with active candidate moves and no opponent pass', () => {
      const state = createInitialGameState(19);
      const result = evaluateBotPass({
        botColor: WHITE,
        gameState: state,
        suggestedMoves: mockCandidates,
        analysisWinrate: 50.0,
        analysisScoreLead: 0,
        boardSize: 19,
      });

      expect(result.shouldPass).toBe(false);
      expect(result.reason).toBeNull();
    });
  });
});
