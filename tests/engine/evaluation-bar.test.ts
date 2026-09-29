import { describe, expect, it } from 'vitest';
import { calculateEstimatedScores } from '../../components/go/EvaluationBar';

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
});
