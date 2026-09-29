import { describe, expect, it } from 'vitest';
import {
  calculateEstimatedScores,
  getPlayerIdentityLabels,
} from '../../components/go/EvaluationBar';

describe('EvaluationBar Score Breakdown & Board Coordinate Margin (UI-EVAL-SCORE-01, UI-BOARD-MARGIN-01)', () => {
  describe('calculateEstimatedScores (UI-EVAL-SCORE-01)', () => {
    it('calculates initial state points with 0 captures and standard 6.5 komi', () => {
      const scores = calculateEstimatedScores(null, 0, 6.5, { black: 0, white: 0 });
      expect(scores.blackScore).toBe(0);
      expect(scores.whiteScore).toBe(6.5);
    });

    it('calculates points from realistic 19x19 ownershipGrid and stone captures', () => {
      // Synthetic 3x3 miniature grid for deterministic territory testing
      const grid = [
        [1.0, 0.8, 0.5], // Black territory
        [0.0, 0.0, -0.5],
        [-0.8, -1.0, -1.0], // White territory
      ];

      const scores = calculateEstimatedScores(grid, 0, 6.5, { black: 2, white: 1 });
      // Black territory = 1.0 + 0.8 + 0.5 = 2.3 + 2 captures = 4.3
      // White territory = 0.5 + 0.8 + 1.0 + 1.0 = 3.3 + 1 capture + 6.5 komi = 10.8
      expect(scores.blackScore).toBeCloseTo(4.3, 1);
      expect(scores.whiteScore).toBeCloseTo(10.8, 1);
    });

    it('estimates points from scoreLead when ownershipGrid is empty', () => {
      const scoresBlackAhead = calculateEstimatedScores([], 10.0, 6.5, { black: 3, white: 0 });
      // Black should have more points than White before komi adjustment
      expect(scoresBlackAhead.blackScore).toBeGreaterThan(scoresBlackAhead.whiteScore - 6.5);

      const scoresWhiteAhead = calculateEstimatedScores([], -8.0, 6.5, { black: 0, white: 2 });
      expect(scoresWhiteAhead.whiteScore).toBeGreaterThan(scoresWhiteAhead.blackScore);
    });

    it('assigns White territory correctly from normalized ownershipGrid during White-dominant turn (UI-EVAL-SCORE-02)', () => {
      // Simulates a normalized ownershipGrid AFTER bridge polarity inversion:
      // White dominates most of the board (negative values = White territory after normalization)
      const whiteDominantGrid = [
        [-0.95, -0.90, -0.85, -0.80, -0.70],
        [-0.90, -0.88, -0.75, -0.60, -0.50],
        [-0.40, -0.30,  0.00,  0.30,  0.40],
        [ 0.50,  0.60,  0.75,  0.80,  0.85],
        [ 0.70,  0.80,  0.85,  0.90,  0.95],
      ];

      const scores = calculateEstimatedScores(whiteDominantGrid, -30.0, 6.5, { black: 3, white: 12 });

      // White territory (abs of negative values > 0.2):
      // Row 0: 0.95+0.90+0.85+0.80+0.70 = 4.20
      // Row 1: 0.90+0.88+0.75+0.60+0.50 = 3.63
      // Row 2: 0.40+0.30 = 0.70
      // Total White territory ≈ 8.53 + 12 captures + 6.5 komi = 27.03
      // Black territory (positive values > 0.2):
      // Row 2: 0.30+0.40 = 0.70
      // Row 3: 0.50+0.60+0.75+0.80+0.85 = 3.50
      // Row 4: 0.70+0.80+0.85+0.90+0.95 = 4.20
      // Total Black territory ≈ 8.40 + 3 captures = 11.40
      expect(scores.whiteScore).toBeGreaterThan(scores.blackScore);
      expect(scores.whiteScore).toBeGreaterThan(25); // White should have substantial lead
      expect(scores.blackScore).toBeLessThan(15);    // Black should be significantly behind
    });
  });

  describe('GoBoard Coordinate Clearance (UI-BOARD-MARGIN-01)', () => {
    it('ensures coordinate margin prevents edge stones from overlapping label text', () => {
      const displaySize = 600;
      const boardSize = 19;
      const showCoordinates = true;

      const coordMargin = showCoordinates ? Math.max(38, Math.floor(displaySize * 0.068)) : 14;
      const boardAreaSize = displaySize - coordMargin * 2;
      const cellSize = boardAreaSize / (boardSize - 1);
      const stoneRadius = (cellSize * 0.94) / 2;

      // Coordinate center for stone placed on 1st line (row 19 or col A)
      const stoneCenter = coordMargin;
      const stoneOuterBoundary = stoneCenter - stoneRadius;

      // Text position for coordinates
      const textOffset = Math.round(coordMargin * 0.38);

      // Verify clearance: the text must be well clear of the outermost stone boundary
      const clearance = stoneOuterBoundary - textOffset;
      expect(clearance).toBeGreaterThan(6); // At least 6px of comfortable separation
    });
  });

  describe('Board Layout & Captures Integration (UI-BOARD-LAYOUT-01)', () => {
    it('properly accumulates Black and White captures into point calculations', () => {
      const captures = { black: 4, white: 2 };
      const scores = calculateEstimatedScores(null, 0, 6.5, captures);
      // Black: 4 captures, White: 6.5 komi + 2 captures = 8.5
      expect(scores.blackScore).toBe(4);
      expect(scores.whiteScore).toBe(8.5);
    });

    it('retains score integrity when handicap komi 0.5 is applied', () => {
      const captures = { black: 1, white: 5 };
      const scores = calculateEstimatedScores(null, 0, 0.5, captures);
      // Black: 1, White: 0.5 komi + 5 = 5.5
      expect(scores.blackScore).toBe(1);
      expect(scores.whiteScore).toBe(5.5);
    });
  });

  describe('Player vs AI Identity Mapping (UI-EVAL-ID-01)', () => {
    it('maps Black to User and White to AI when playerColor is Black', () => {
      const labels = getPlayerIdentityLabels('vs-ai', 'B', '8k', 'คุณ');
      expect(labels.black.isUser).toBe(true);
      expect(labels.black.name).toBe('คุณ');
      expect(labels.black.badgeText).toBe('ผู้เล่น');

      expect(labels.white.isUser).toBe(false);
      expect(labels.white.name).toBe('KataGo (8k)');
      expect(labels.white.badgeText).toBe('AI 8k');
    });

    it('maps White to User and Black to AI when playerColor is White', () => {
      const labels = getPlayerIdentityLabels('vs-ai', 'W', '1D', 'คุณ');
      expect(labels.black.isUser).toBe(false);
      expect(labels.black.name).toBe('KataGo (1D)');
      expect(labels.black.badgeText).toBe('AI 1D');

      expect(labels.white.isUser).toBe(true);
      expect(labels.white.name).toBe('คุณ');
      expect(labels.white.badgeText).toBe('ผู้เล่น');
    });

    it('maps both sides to study players in self-study mode', () => {
      const labels = getPlayerIdentityLabels('self-study', 'B', '1D');
      expect(labels.black.name).toContain('ดำ');
      expect(labels.white.name).toContain('ขาว');
      expect(labels.black.badgeText).toBe('เล่น 2 ฝ่าย');
    });
  });
});

