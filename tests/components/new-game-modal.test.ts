import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NEW_GAME_CONFIG,
  getHandicapPoints,
  NewGameConfig,
  resolveKomi,
  validateNewGameConfig,
} from '../../components/go/NewGameModal';

describe('NewGameModal & Handicap Configuration (UI-NEWGAME-01)', () => {
  describe('DEFAULT_NEW_GAME_CONFIG & validateNewGameConfig', () => {
    it('provides sensible default configuration for 1 Dan training', () => {
      expect(DEFAULT_NEW_GAME_CONFIG.boardSize).toBe(19);
      expect(DEFAULT_NEW_GAME_CONFIG.gameMode).toBe('vs-ai');
      expect(DEFAULT_NEW_GAME_CONFIG.playerColor).toBe('B');
      expect(DEFAULT_NEW_GAME_CONFIG.selectedRank).toBe('1D');
      expect(DEFAULT_NEW_GAME_CONFIG.handicap).toBe(0);
      expect(DEFAULT_NEW_GAME_CONFIG.komi).toBe(6.5);
      expect(DEFAULT_NEW_GAME_CONFIG.boardTheme).toBe('wood');
      expect(DEFAULT_NEW_GAME_CONFIG.soundEnabled).toBe(true);
    });

    it('merges partial config into full valid config with fallback', () => {
      const partial: Partial<NewGameConfig> = {
        boardSize: 13,
        playerColor: 'W',
        handicap: 3,
      };
      const validated = validateNewGameConfig(partial);
      expect(validated.boardSize).toBe(13);
      expect(validated.playerColor).toBe('W');
      expect(validated.handicap).toBe(3);
      expect(validated.komi).toBe(0.5); // automatically adjusted for handicap
      expect(validated.gameMode).toBe('vs-ai');
      expect(validated.selectedRank).toBe('1D');
    });
  });

  describe('resolveKomi', () => {
    it('sets standard 6.5 komi for even games with 0 handicap', () => {
      expect(resolveKomi(0)).toBe(6.5);
    });

    it('sets 0.5 komi for handicap games (2 to 9 stones) to prevent draws', () => {
      expect(resolveKomi(2)).toBe(0.5);
      expect(resolveKomi(4)).toBe(0.5);
      expect(resolveKomi(9)).toBe(0.5);
    });

    it('respects explicitly provided custom komi', () => {
      expect(resolveKomi(0, 7.5)).toBe(7.5);
      expect(resolveKomi(2, 0.5)).toBe(0.5);
    });
  });

  describe('getHandicapPoints', () => {
    it('returns empty array when handicap is 0 or 1', () => {
      expect(getHandicapPoints(19, 0)).toEqual([]);
      expect(getHandicapPoints(19, 1)).toEqual([]);
    });

    it('places standard 2 stones in opposing corners on 19x19 (D4, Q16)', () => {
      const pts = getHandicapPoints(19, 2);
      expect(pts).toHaveLength(2);
      // D4 is {x: 3, y: 3}, Q16 is {x: 15, y: 15}
      expect(pts).toContainEqual({ x: 3, y: 3 });
      expect(pts).toContainEqual({ x: 15, y: 15 });
    });

    it('places standard 4 corner handicap stones on 19x19', () => {
      const pts = getHandicapPoints(19, 4);
      expect(pts).toHaveLength(4);
      expect(pts).toContainEqual({ x: 3, y: 3 });   // D4
      expect(pts).toContainEqual({ x: 15, y: 15 }); // Q16
      expect(pts).toContainEqual({ x: 15, y: 3 });  // Q4
      expect(pts).toContainEqual({ x: 3, y: 15 });  // D16
    });

    it('places 5 stones including Tengen center on 19x19', () => {
      const pts = getHandicapPoints(19, 5);
      expect(pts).toHaveLength(5);
      expect(pts).toContainEqual({ x: 9, y: 9 }); // K10 center
    });

    it('places standard 9 handicap stones covering all star points on 19x19 (UI-NEWGAME-HCAP-01)', () => {
      const pts9 = getHandicapPoints(19, 9);
      expect(pts9).toHaveLength(9);
      expect(pts9).toContainEqual({ x: 3, y: 3 });   // D4
      expect(pts9).toContainEqual({ x: 15, y: 15 }); // Q16
      expect(pts9).toContainEqual({ x: 15, y: 3 });  // Q4
      expect(pts9).toContainEqual({ x: 3, y: 15 });  // D16
      expect(pts9).toContainEqual({ x: 9, y: 9 });   // K10 Tengen
      expect(pts9).toContainEqual({ x: 3, y: 9 });   // D10
      expect(pts9).toContainEqual({ x: 15, y: 9 });  // Q10
      expect(pts9).toContainEqual({ x: 9, y: 3 });   // K4
      expect(pts9).toContainEqual({ x: 9, y: 15 });  // K16
    });

    it('places star points on 13x13 board for 2 to 5 handicap stones (UI-NEWGAME-HCAP-01)', () => {
      const pts2 = getHandicapPoints(13, 2);
      expect(pts2).toHaveLength(2);
      expect(pts2).toContainEqual({ x: 3, y: 3 }); // D4
      expect(pts2).toContainEqual({ x: 9, y: 9 }); // K10

      const pts4 = getHandicapPoints(13, 4);
      expect(pts4).toHaveLength(4);
      expect(pts4).toContainEqual({ x: 3, y: 3 }); // D4
      expect(pts4).toContainEqual({ x: 9, y: 9 }); // K10
      expect(pts4).toContainEqual({ x: 9, y: 3 }); // K4
      expect(pts4).toContainEqual({ x: 3, y: 9 }); // D10

      const pts5 = getHandicapPoints(13, 5);
      expect(pts5).toHaveLength(5);
      expect(pts5).toContainEqual({ x: 6, y: 6 }); // G7 Tengen
    });

    it('handles 9x9 handicap up to 5 stones', () => {
      const pts2 = getHandicapPoints(9, 2);
      expect(pts2).toHaveLength(2);
      expect(pts2).toContainEqual({ x: 2, y: 2 }); // C3
      expect(pts2).toContainEqual({ x: 6, y: 6 }); // G7

      const pts5 = getHandicapPoints(9, 5);
      expect(pts5).toHaveLength(5);
      expect(pts5).toContainEqual({ x: 4, y: 4 }); // E5 center
    });
  });
});
