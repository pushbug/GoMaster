import { describe, expect, it } from 'vitest';
import { COLUMN_LETTERS, pointToString, stringToPoint } from '../../lib/go/board';
import { createInitialGameState, findGroup, playMove, undoMove, validateMove } from '../../lib/go/rules';
import { exportToSgf, importFromSgf } from '../../lib/go/sgf';
import { BLACK, EMPTY, WHITE } from '../../lib/go/types';

describe('Go Rule Engine & Board Logic', () => {
  describe('Coordinate Mapping (UI-COORD-01)', () => {
    it('skips letter I in standard column labels', () => {
      expect(COLUMN_LETTERS).not.toContain('I');
      expect(COLUMN_LETTERS[0]).toBe('A');
      expect(COLUMN_LETTERS[7]).toBe('H');
      expect(COLUMN_LETTERS[8]).toBe('J'); // 'J' immediately follows 'H'
      expect(COLUMN_LETTERS[18]).toBe('T');
    });

    it('converts Point to standard string and back', () => {
      const p1 = { x: 3, y: 3 }; // D16 on 19x19
      expect(pointToString(p1, 19)).toBe('D16');
      expect(stringToPoint('D16', 19)).toEqual(p1);

      const pTengen = { x: 9, y: 9 }; // K10 on 19x19
      expect(pointToString(pTengen, 19)).toBe('K10');
      expect(stringToPoint('K10', 19)).toEqual(pTengen);

      const pCorner = { x: 0, y: 18 }; // A1 (bottom-left)
      expect(pointToString(pCorner, 19)).toBe('A1');
      expect(stringToPoint('A1', 19)).toEqual(pCorner);
    });
  });

  describe('Liberties Calculation (RULE-LIB-01, RULE-LIB-02)', () => {
    it('calculates 4 liberties for single center stone (RULE-LIB-01)', () => {
      let state = createInitialGameState(19);
      // Place black at (9, 9)
      const res = playMove(state, { x: 9, y: 9 });
      expect(res.success).toBe(true);
      state = res.state;

      const group = findGroup(state.board, { x: 9, y: 9 });
      expect(group).not.toBeNull();
      expect(group?.stones.length).toBe(1);
      expect(group?.liberties.length).toBe(4);
    });

    it('calculates 3 liberties for edge stone and 2 for corner (RULE-LIB-02)', () => {
      let state = createInitialGameState(19);
      // Corner: (0, 0)
      let res = playMove(state, { x: 0, y: 0 });
      state = res.state;
      let group = findGroup(state.board, { x: 0, y: 0 });
      expect(group?.liberties.length).toBe(2);

      // Edge: (5, 0) (top edge)
      res = playMove(state, { x: 5, y: 0 });
      state = res.state;
      group = findGroup(state.board, { x: 5, y: 0 });
      expect(group?.liberties.length).toBe(3);
    });
  });

  describe('Stone Capturing (RULE-CAP-01, RULE-CAP-02)', () => {
    it('captures a single opponent stone when all liberties are removed (RULE-CAP-01)', () => {
      let state = createInitialGameState(9);

      // Setup: White stone at (4, 4)
      // Black surrounds it at (4, 3), (4, 5), (3, 4), and finally (5, 4)
      state = playMove(state, { x: 4, y: 3 }).state; // B (4,3)
      state = playMove(state, { x: 4, y: 4 }).state; // W (4,4)
      state = playMove(state, { x: 4, y: 5 }).state; // B (4,5)
      state = playMove(state, 'PASS').state;         // W Pass
      state = playMove(state, { x: 3, y: 4 }).state; // B (3,4)
      state = playMove(state, 'PASS').state;         // W Pass

      // White at (4,4) now has only 1 liberty left at (5,4)
      const groupBefore = findGroup(state.board, { x: 4, y: 4 });
      expect(groupBefore?.liberties.length).toBe(1);
      expect(groupBefore?.liberties[0]).toEqual({ x: 5, y: 4 });

      // Black plays the final capturing move at (5,4)
      const capMove = playMove(state, { x: 5, y: 4 });
      expect(capMove.success).toBe(true);
      state = capMove.state;

      // The white stone should be captured (removed from board)
      expect(state.board[4][4]).toBe(EMPTY);
      // Black capture counter should increment by 1
      expect(state.captures.black).toBe(1);
    });

    it('captures a multi-stone group when surrounded (RULE-CAP-02)', () => {
      let state = createInitialGameState(9);

      // White group of 2 stones at (1, 1) and (1, 2)
      state = playMove(state, { x: 0, y: 1 }).state; // B
      state = playMove(state, { x: 1, y: 1 }).state; // W1
      state = playMove(state, { x: 0, y: 2 }).state; // B
      state = playMove(state, { x: 1, y: 2 }).state; // W2
      state = playMove(state, { x: 1, y: 0 }).state; // B
      state = playMove(state, 'PASS').state;         // W Pass
      state = playMove(state, { x: 2, y: 1 }).state; // B
      state = playMove(state, 'PASS').state;         // W Pass
      state = playMove(state, { x: 2, y: 2 }).state; // B
      state = playMove(state, 'PASS').state;         // W Pass

      // The remaining liberty for the 2-stone white group is at (1, 3)
      const finalMove = playMove(state, { x: 1, y: 3 });
      expect(finalMove.success).toBe(true);
      state = finalMove.state;

      // Both white stones are removed
      expect(state.board[1][1]).toBe(EMPTY);
      expect(state.board[2][1]).toBe(EMPTY);
      expect(state.captures.black).toBe(2);
    });
  });

  describe('Suicide Move Prevention (RULE-SUI-01, RULE-SUI-02)', () => {
    it('rejects suicide move that creates 0-liberty group (RULE-SUI-01)', () => {
      let state = createInitialGameState(9);

      // Black surrounds corner (0,0) by placing at (1,0) and (0,1)
      state = playMove(state, { x: 1, y: 0 }).state; // B
      state = playMove(state, 'PASS').state;         // W Pass
      state = playMove(state, { x: 0, y: 1 }).state; // B

      // Now White's turn. Attempting to place White at (0,0) is suicide
      expect(state.turn).toBe(WHITE);
      const validation = validateMove(state, { x: 0, y: 0 }, WHITE);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('SUICIDE');

      const attempt = playMove(state, { x: 0, y: 0 });
      expect(attempt.success).toBe(false);
      expect(attempt.error).toContain('Suicide');
    });

    it('allows move with 0 initial liberties if it captures opponent (RULE-SUI-02)', () => {
      let state = createInitialGameState(9);

      // Black stone at corner (0,0) in atari
      state = playMove(state, { x: 0, y: 0 }).state; // B
      state = playMove(state, { x: 1, y: 0 }).state; // W

      // Black passes
      state = playMove(state, 'PASS').state;

      // White plays at (0,1). Even though (0,1) would have 0 liberties,
      // it captures the Black stone at (0,0), so it is LEGAL!
      const capMove = playMove(state, { x: 0, y: 1 });
      expect(capMove.success).toBe(true);
      expect(capMove.state.board[0][0]).toBe(EMPTY);
      expect(capMove.state.board[1][0]).toBe(WHITE); // (0,1)
      expect(capMove.state.captures.white).toBe(1);
    });
  });

  describe('Ko Rule Enforcement (RULE-KO-01, RULE-KO-02)', () => {
    it('enforces simple Ko rule prohibiting immediate recapture (RULE-KO-01)', () => {
      let state = createInitialGameState(9);

      // Setup classic 1-stone Ko shape
      // Black: (1,0), (0,1), (1,2)
      // White: (2,0), (3,1), (2,2)
      state = playMove(state, { x: 1, y: 0 }).state; // B
      state = playMove(state, { x: 2, y: 0 }).state; // W
      state = playMove(state, { x: 0, y: 1 }).state; // B
      state = playMove(state, { x: 3, y: 1 }).state; // W
      state = playMove(state, { x: 1, y: 2 }).state; // B
      state = playMove(state, { x: 2, y: 2 }).state; // W

      // Black places at (2,1)
      state = playMove(state, { x: 2, y: 1 }).state; // B

      // White captures Black at (2,1) by playing (1,1)
      // White stone at (1,1) captures Black at (2,1)
      const whiteCapture = playMove(state, { x: 1, y: 1 });
      expect(whiteCapture.success).toBe(true);
      state = whiteCapture.state;
      expect(state.board[1][2]).toBe(EMPTY); // (2,1) is captured

      // Black immediately attempts to recapture at (2,1) -> KO VIOLATION!
      const blackRecapture = playMove(state, { x: 2, y: 1 });
      expect(blackRecapture.success).toBe(false);
      expect(blackRecapture.error).toContain('Ko rule');
    });

    it('allows recapture after intervening move (tenuki) (RULE-KO-02)', () => {
      let state = createInitialGameState(9);

      // Setup same Ko position
      state = playMove(state, { x: 1, y: 0 }).state; // B
      state = playMove(state, { x: 2, y: 0 }).state; // W
      state = playMove(state, { x: 0, y: 1 }).state; // B
      state = playMove(state, { x: 3, y: 1 }).state; // W
      state = playMove(state, { x: 1, y: 2 }).state; // B
      state = playMove(state, { x: 2, y: 2 }).state; // W
      state = playMove(state, { x: 2, y: 1 }).state; // B

      // White captures at (1,1)
      state = playMove(state, { x: 1, y: 1 }).state;

      // Black plays a ko threat elsewhere (e.g. 8,8)
      state = playMove(state, { x: 8, y: 8 }).state;
      // White responds elsewhere (e.g. 8,7)
      state = playMove(state, { x: 8, y: 7 }).state;

      // Now Black CAN recapture at (2,1)!
      const validRecapture = playMove(state, { x: 2, y: 1 });
      expect(validRecapture.success).toBe(true);
      expect(validRecapture.state.board[1][1]).toBe(EMPTY);
    });
  });

  describe('Game Lifecycle & Undo (RULE-PASS-01)', () => {
    it('switches turn on pass and ends game on 2 consecutive passes (RULE-PASS-01)', () => {
      let state = createInitialGameState(19);
      expect(state.turn).toBe(BLACK);

      // 1st pass: switches to White
      state = playMove(state, 'PASS').state;
      expect(state.turn).toBe(WHITE);
      expect(state.consecutivePasses).toBe(1);
      expect(state.isGameOver).toBe(false);

      // 2nd pass: game ends
      state = playMove(state, 'PASS').state;
      expect(state.consecutivePasses).toBe(2);
      expect(state.isGameOver).toBe(true);
    });

    it('correctly undoes moves and restores prior board state', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state; // Move 1: B
      state = playMove(state, { x: 15, y: 15 }).state; // Move 2: W

      expect(state.history.length).toBe(2);
      expect(state.board[15][15]).toBe(WHITE);

      // Undo Move 2
      state = undoMove(state);
      expect(state.history.length).toBe(1);
      expect(state.turn).toBe(WHITE);
      expect(state.board[15][15]).toBe(EMPTY);
      expect(state.board[3][3]).toBe(BLACK);

      // Undo Move 1
      state = undoMove(state);
      expect(state.history.length).toBe(0);
      expect(state.turn).toBe(BLACK);
      expect(state.board[3][3]).toBe(EMPTY);
    });
  });

  describe('SGF Serialization & Parsing (RULE-SGF-01)', () => {
    it('exports and imports SGF game records faithfully', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 15, y: 3 }).state; // Q16 (B[pd])
      state = playMove(state, { x: 3, y: 15 }).state; // D4 (W[dp])

      const sgf = exportToSgf(state, 'Player1', 'Player2');
      expect(sgf).toContain(';B[pd]');
      expect(sgf).toContain(';W[dp]');
      expect(sgf).toContain('SZ[19]');

      const imported = importFromSgf(sgf);
      expect(imported.success).toBe(true);
      expect(imported.state?.board[3][15]).toBe(BLACK);
      expect(imported.state?.board[15][3]).toBe(WHITE);
      expect(imported.state?.history.length).toBe(2);
    });
  });
});
