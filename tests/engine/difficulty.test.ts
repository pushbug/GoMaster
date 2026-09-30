import { describe, expect, it } from 'vitest';
import { ALL_RANKS, getRankConfig, selectBotMove } from '../../lib/engine/difficulty';
import { CandidateMoveEvaluation } from '../../lib/engine/types';
import { createInitialGameState, playMove } from '../../lib/go/rules';
import {
  calculateAccuracy,
  classifyMoveQuality,
} from '../../lib/storage/match-history';

describe('AI Difficulty & Match History System', () => {
  describe('Rank Calibration (AI-RANK-01)', () => {
    it('contains all 17 standard ranks from 8k to 9D', () => {
      expect(ALL_RANKS.length).toBe(17);
      expect(ALL_RANKS[0]).toBe('8k');
      expect(ALL_RANKS[7]).toBe('1k');
      expect(ALL_RANKS[8]).toBe('1D');
      expect(ALL_RANKS[16]).toBe('9D');
    });

    it('scales visits strictly monotonically with rank', () => {
      const config8k = getRankConfig('8k');
      const config1k = getRankConfig('1k');
      const config1D = getRankConfig('1D');
      const config9D = getRankConfig('9D');

      expect(config8k.maxVisits).toBeLessThan(config1k.maxVisits);
      expect(config1k.maxVisits).toBeLessThan(config1D.maxVisits);
      expect(config1D.maxVisits).toBeLessThan(config9D.maxVisits);
    });

    it('decreases blunder rate from Kyu to 9 Dan', () => {
      const config8k = getRankConfig('8k');
      const config1D = getRankConfig('1D');
      const config9D = getRankConfig('9D');

      expect(config8k.blunderRate).toBeGreaterThan(config1D.blunderRate);
      expect(config1D.blunderRate).toBeGreaterThan(config9D.blunderRate);
      expect(config9D.blunderRate).toBe(0.0);
    });
  });

  describe('Bot Move Selection (AI-BOT-01)', () => {
    const mockCandidates: CandidateMoveEvaluation[] = [
      {
        point: { x: 3, y: 3 },
        coord: 'D16',
        winrate: 55.0,
        scoreLead: 1.5,
        scoreLoss: 0,
        pv: ['D16'],
        visits: 500,
        rank: 1,
      },
      {
        point: { x: 15, y: 3 },
        coord: 'Q16',
        winrate: 53.0,
        scoreLead: 0.8,
        scoreLoss: 0.7,
        pv: ['Q16'],
        visits: 200,
        rank: 2,
      },
      {
        point: { x: 9, y: 9 },
        coord: 'K10',
        winrate: 48.0,
        scoreLead: -0.5,
        scoreLoss: 2.0,
        pv: ['K10'],
        visits: 80,
        rank: 3,
      },
    ];

    it('always selects top candidate for 9 Dan (zero blunder rate)', () => {
      for (let i = 0; i < 20; i++) {
        const move = selectBotMove(mockCandidates, '9D');
        expect(move?.coord).toBe('D16');
      }
    });

    it('returns null when candidates list is empty', () => {
      const move = selectBotMove([], '1D');
      expect(move).toBeNull();
    });

    it('can occasionally pick suboptimal moves for 8k players', () => {
      const chosenMoves = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const move = selectBotMove(mockCandidates, '8k');
        if (move) chosenMoves.add(move.coord);
      }
      // Over 100 trials with calibrated blunder rate, more than 1 candidate should be sampled
      expect(chosenMoves.size).toBeGreaterThan(1);
    });

    it('calibrates 1D bot to authentic human level sampling candidates 2 and 3 (BOT-CALIB-1D-01)', () => {
      const config1D = getRankConfig('1D');
      expect(config1D.blunderRate).toBe(0.14);

      const selections: Record<string, number> = { D16: 0, Q16: 0, K10: 0 };
      const trials = 300;
      for (let i = 0; i < trials; i++) {
        const move = selectBotMove(mockCandidates, '1D');
        if (move) selections[move.coord] = (selections[move.coord] || 0) + 1;
      }

      // Best move (D16) is still the dominant choice (> 70% of moves)
      expect(selections['D16']).toBeGreaterThan(trials * 0.7);
      // But candidates 2 (Q16) and 3 (K10) are sampled occasionally for human realism
      expect(selections['Q16'] + selections['K10']).toBeGreaterThan(5);
    });

    it('generates authentic Kyu slack moves when gameState is provided (AI-BOT-02)', () => {
      let state = createInitialGameState(19);
      // Play a couple of moves so there are stones on the board
      state = playMove(state, { x: 3, y: 3 }).state; // Black D16
      state = playMove(state, { x: 15, y: 15 }).state; // White Q4

      let slackMoveFound = false;
      for (let i = 0; i < 60; i++) {
        const move = selectBotMove(mockCandidates, '8k', state);
        if (move && move.coord !== 'D16' && move.coord !== 'Q16' && move.coord !== 'K10') {
          slackMoveFound = true;
          expect(move.rank).toBe(4);
          expect(move.scoreLoss).toBeGreaterThan(1.0);
          break;
        }
      }
      expect(slackMoveFound).toBe(true);
    });
  });

  describe('Accuracy & Move Quality Scoring (ACC-SCORE-01)', () => {
    it('classifies move quality correctly across loss thresholds', () => {
      expect(classifyMoveQuality(0.1)).toBe('Best');
      expect(classifyMoveQuality(0.8)).toBe('Good');
      expect(classifyMoveQuality(2.5)).toBe('Inaccuracy');
      expect(classifyMoveQuality(4.5)).toBe('Mistake');
      expect(classifyMoveQuality(7.2)).toBe('Blunder');
    });

    it('calculates 100% accuracy for games with zero score loss', () => {
      const perfectLosses = [0, 0, 0, 0];
      expect(calculateAccuracy(perfectLosses)).toBe(100);
    });

    it('reduces accuracy score gracefully as score loss increases', () => {
      const smallLosses = [0.2, 0.5, 0.4, 0.3];
      const bigLosses = [3.5, 5.0, 7.0, 2.5];

      const accSmall = calculateAccuracy(smallLosses);
      const accBig = calculateAccuracy(bigLosses);

      expect(accSmall).toBeGreaterThan(90);
      expect(accBig).toBeLessThan(accSmall);
      expect(accBig).toBeGreaterThanOrEqual(10);
    });
  });
});
