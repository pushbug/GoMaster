import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateAccuracy,
  classifyMoveQuality,
  clearMatchHistory,
  getMatchHistory,
  MatchRecord,
  saveMatchRecord,
} from '../../lib/storage/match-history';

// Minimal valid MatchRecord factory
function makeRecord(overrides: Partial<MatchRecord> = {}): MatchRecord {
  return {
    id: `match_${Date.now()}_${Math.random()}`,
    date: '2026-09-30',
    boardSize: 19,
    playerColor: 'B',
    botRank: '1D',
    result: 'B+5.5',
    winner: 'Player',
    totalMoves: 120,
    accuracyScore: 85.0,
    sgf: '(;GM[1]FF[4]SZ[19])',
    winrateHistory: [50, 52],
    scoreLeadHistory: [0, 1.5],
    ...overrides,
  };
}

describe('Match History Storage & Move Quality (HIST-QUAL-01, HIST-ACC-01, HIST-STORE-02)', () => {
  describe('Move Quality Classification (HIST-QUAL-01)', () => {
    it('classifies Best at exact boundary (scoreLoss <= 0.3)', () => {
      expect(classifyMoveQuality(0)).toBe('Best');
      expect(classifyMoveQuality(0.3)).toBe('Best');
    });

    it('classifies Good between 0.3 and 1.0', () => {
      expect(classifyMoveQuality(0.31)).toBe('Good');
      expect(classifyMoveQuality(1.0)).toBe('Good');
    });

    it('classifies Inaccuracy between 1.0 and 3.0', () => {
      expect(classifyMoveQuality(1.01)).toBe('Inaccuracy');
      expect(classifyMoveQuality(3.0)).toBe('Inaccuracy');
    });

    it('classifies Mistake between 3.0 and 6.0', () => {
      expect(classifyMoveQuality(3.01)).toBe('Mistake');
      expect(classifyMoveQuality(6.0)).toBe('Mistake');
    });

    it('classifies Blunder above 6.0', () => {
      expect(classifyMoveQuality(6.01)).toBe('Blunder');
      expect(classifyMoveQuality(50.0)).toBe('Blunder');
    });
  });

  describe('Accuracy Calculation (HIST-ACC-01)', () => {
    it('returns 100% for empty losses (perfect game)', () => {
      expect(calculateAccuracy([])).toBe(100);
    });

    it('returns 100% for all-zero losses', () => {
      expect(calculateAccuracy([0, 0, 0])).toBe(100);
    });

    it('clamps to minimum 10% for catastrophic losses', () => {
      const hugeLosses = Array(10).fill(100);
      expect(calculateAccuracy(hugeLosses)).toBe(10);
    });

    it('negative losses are treated as zero (no bonus for gaining points)', () => {
      const withNeg = [-5, -3, 0];
      expect(calculateAccuracy(withNeg)).toBe(100);
    });

    it('exponential dampening produces monotonically decreasing accuracy', () => {
      const acc1 = calculateAccuracy([1.0]);
      const acc3 = calculateAccuracy([3.0]);
      const acc10 = calculateAccuracy([10.0]);

      expect(acc1).toBeGreaterThan(acc3);
      expect(acc3).toBeGreaterThan(acc10);
      expect(acc10).toBeGreaterThanOrEqual(10);
    });
  });

  describe('localStorage Persistence (HIST-STORE-02)', () => {
    let mockStorage: Record<string, string>;

    beforeEach(() => {
      mockStorage = {};
      // Stub window so `typeof window === 'undefined'` guard passes
      vi.stubGlobal('window', {});
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('saves and retrieves a match record', () => {
      const record = makeRecord({ id: 'test_1' });
      saveMatchRecord(record);

      const history = getMatchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('test_1');
    });

    it('prepends new records (most recent first)', () => {
      saveMatchRecord(makeRecord({ id: 'old' }));
      saveMatchRecord(makeRecord({ id: 'new' }));

      const history = getMatchHistory();
      expect(history[0].id).toBe('new');
      expect(history[1].id).toBe('old');
    });

    it('enforces FIFO cap of 50 matches', () => {
      for (let i = 0; i < 55; i++) {
        saveMatchRecord(makeRecord({ id: `match_${i}` }));
      }

      const history = getMatchHistory();
      expect(history).toHaveLength(50);
      // Most recent should be match_54
      expect(history[0].id).toBe('match_54');
    });

    it('clearMatchHistory removes all records', () => {
      saveMatchRecord(makeRecord({ id: 'to_clear' }));
      expect(getMatchHistory()).toHaveLength(1);

      clearMatchHistory();
      expect(getMatchHistory()).toHaveLength(0);
    });

    it('returns empty array when localStorage contains invalid JSON', () => {
      mockStorage['gomaster_match_history'] = '{broken json';
      const history = getMatchHistory();
      expect(history).toHaveLength(0);
    });

    it('handles localStorage.setItem throwing (quota exceeded)', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError');
        }),
        removeItem: vi.fn(),
      });

      // Should not throw
      expect(() => saveMatchRecord(makeRecord())).not.toThrow();
    });
  });
});
