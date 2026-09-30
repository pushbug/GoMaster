import { describe, expect, it } from 'vitest';
import { exportToSgf, importFromSgf, pointToSgf, sgfToPoint } from '../../lib/go/sgf';
import { createInitialGameState, playMove } from '../../lib/go/rules';
import { BLACK, EMPTY, WHITE } from '../../lib/go/types';

describe('SGF Parser & Serializer Edge Cases (RULE-SGF-02)', () => {
  describe('Coordinate Conversion', () => {
    it('pointToSgf converts {x:0,y:0} to "aa" and {x:15,y:3} to "pd"', () => {
      expect(pointToSgf({ x: 0, y: 0 })).toBe('aa');
      expect(pointToSgf({ x: 15, y: 3 })).toBe('pd');
      expect(pointToSgf({ x: 3, y: 15 })).toBe('dp');
    });

    it('pointToSgf returns empty string for null point', () => {
      expect(pointToSgf(null)).toBe('');
    });

    it('sgfToPoint converts "pd" to {x:15,y:3} on 19x19', () => {
      expect(sgfToPoint('pd', 19)).toEqual({ x: 15, y: 3 });
    });

    it('sgfToPoint treats "tt" as pass (null) on 19x19', () => {
      expect(sgfToPoint('tt', 19)).toBeNull();
    });

    it('sgfToPoint returns null for empty or 1-char input', () => {
      expect(sgfToPoint('', 19)).toBeNull();
      expect(sgfToPoint('a', 19)).toBeNull();
    });

    it('sgfToPoint returns null for out-of-bounds coordinates', () => {
      // 'ta' on 9x9: x=19, y=0 → x >= 9, out of bounds
      expect(sgfToPoint('ta', 9)).toBeNull();
    });
  });

  describe('Import Edge Cases', () => {
    it('imports SGF with pass moves (empty brackets)', () => {
      const sgf = '(;GM[1]FF[4]SZ[19];B[pd];W[];B[dp])';
      const result = importFromSgf(sgf);

      expect(result.success).toBe(true);
      expect(result.state).toBeDefined();
      // Move 1 (B pd) and Move 3 (B dp) placed, Move 2 was pass
      expect(result.state!.board[3][15]).toBe(BLACK);  // pd
      expect(result.state!.board[15][3]).toBe(BLACK);  // dp
      expect(result.state!.history.length).toBe(3);
    });

    it('rejects SGF with unsupported board size (e.g. 15x15)', () => {
      const sgf = '(;GM[1]FF[4]SZ[15];B[hh])';
      const result = importFromSgf(sgf);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported board size');
    });

    it('imports 9x9 SGF correctly', () => {
      const sgf = '(;GM[1]FF[4]SZ[9];B[ee];W[cc])';
      const result = importFromSgf(sgf);

      expect(result.success).toBe(true);
      expect(result.state!.boardSize).toBe(9);
      expect(result.state!.board[4][4]).toBe(BLACK); // ee
      expect(result.state!.board[2][2]).toBe(WHITE); // cc
    });

    it('defaults to 19x19 when SZ tag is missing', () => {
      const sgf = '(;GM[1]FF[4];B[pd];W[dp])';
      const result = importFromSgf(sgf);

      expect(result.success).toBe(true);
      expect(result.state!.boardSize).toBe(19);
    });

    it('handles SGF with extra metadata tags without crashing', () => {
      const sgf = '(;GM[1]FF[4]SZ[19]KM[6.5]RU[Japanese]PB[Player]PW[KataGo]RE[B+Resign]DT[2026-09-30];B[pd];W[dp])';
      const result = importFromSgf(sgf);

      expect(result.success).toBe(true);
      expect(result.state!.history.length).toBe(2);
    });

    it('recovers gracefully from completely malformed input', () => {
      const result1 = importFromSgf('');
      // Empty string has no moves, should succeed with empty board
      expect(result1.success).toBe(true);
      expect(result1.state!.history.length).toBe(0);

      const result2 = importFromSgf('not an sgf file at all {{{');
      expect(result2.success).toBe(true);
      expect(result2.state!.history.length).toBe(0);
    });

    it('handles SGF with consecutive same-color moves', () => {
      // Some SGF editors produce AB/AW setup stones as sequential B/W moves
      const sgf = '(;GM[1]FF[4]SZ[19];B[pd];B[dp];W[pp])';
      const result = importFromSgf(sgf);

      expect(result.success).toBe(true);
      expect(result.state!.board[3][15]).toBe(BLACK);  // pd
      expect(result.state!.board[15][3]).toBe(BLACK);  // dp
      expect(result.state!.board[15][15]).toBe(WHITE); // pp
    });
  });

  describe('Export Faithfulness', () => {
    it('export includes SZ, PB, PW, and move sequence', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 15, y: 3 }).state; // B pd
      state = playMove(state, { x: 3, y: 15 }).state;  // W dp

      const sgf = exportToSgf(state, 'TestBlack', 'TestWhite');

      expect(sgf).toContain('SZ[19]');
      expect(sgf).toContain('PB[TestBlack]');
      expect(sgf).toContain('PW[TestWhite]');
      expect(sgf).toContain(';B[pd]');
      expect(sgf).toContain(';W[dp]');
      expect(sgf.startsWith('(;')).toBe(true);
      expect(sgf.endsWith(')')).toBe(true);
    });

    it('export round-trips through import faithfully', () => {
      let state = createInitialGameState(9);
      state = playMove(state, { x: 4, y: 4 }).state; // B ee
      state = playMove(state, { x: 2, y: 2 }).state;  // W cc
      state = playMove(state, { x: 6, y: 6 }).state;  // B gg

      const sgf = exportToSgf(state);
      const imported = importFromSgf(sgf);

      expect(imported.success).toBe(true);
      expect(imported.state!.boardSize).toBe(9);
      expect(imported.state!.board[4][4]).toBe(BLACK);
      expect(imported.state!.board[2][2]).toBe(WHITE);
      expect(imported.state!.board[6][6]).toBe(BLACK);
      expect(imported.state!.history.length).toBe(3);
    });

    it('export skips resign moves in SGF output', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state;
      state = playMove(state, 'RESIGN').state;

      const sgf = exportToSgf(state);
      // Should contain the stone move but not the resign
      expect(sgf).toContain(';B[dd]');
      expect(sgf).not.toContain('RESIGN');
    });

    it('export handles pass moves with empty bracket notation', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state;
      state = playMove(state, 'PASS').state;

      const sgf = exportToSgf(state);
      expect(sgf).toContain(';B[dd]');
      expect(sgf).toContain(';W[]');
    });
  });
});
