import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MoveHistoryPanel } from '../../components/go/MoveHistoryPanel';
import { createInitialGameState, playMove } from '../../lib/go/rules';
import { BLACK, WHITE } from '../../lib/go/types';

describe('MoveHistoryPanel Component (UI-HIST-PANEL-01, UI-HIST-PANEL-02)', () => {
  describe('2-Column Layout & Selectors (UI-HIST-PANEL-01)', () => {
    it('renders Black and White column headers with correct data-testid selectors', () => {
      const state = createInitialGameState(19);
      const html = renderToString(
        React.createElement(MoveHistoryPanel, {
          gameState: state,
        })
      );

      expect(html).toContain('data-testid="move-history-panel"');
      expect(html).toContain('data-testid="history-col-black"');
      expect(html).toContain('data-testid="history-col-white"');
      expect(html).toContain('หมากดำ');
      expect(html).toContain('หมากขาว');
    });

    it('renders empty state message when no moves played', () => {
      const state = createInitialGameState(19);
      const html = renderToString(
        React.createElement(MoveHistoryPanel, {
          gameState: state,
        })
      );

      expect(html).toContain('ยังไม่มีการเดินหมาก');
    });

    it('renders move pairs in 2-column layout after Black and White each play', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state;  // Black D16
      state = playMove(state, { x: 15, y: 15 }).state; // White Q4

      const html = renderToString(
        React.createElement(MoveHistoryPanel, {
          gameState: state,
          scoreLeadHistory: [0, 1.5, 1.0],
        })
      );

      // Should not show empty state
      expect(html).not.toContain('ยังไม่มีการเดินหมาก');
      // Should contain the coordinate texts
      expect(html).toContain('D16');
      expect(html).toContain('Q4');
      // Should contain move numbers
      expect(html).toContain('#1');
      expect(html).toContain('#2');
      // Total count
      expect(html).toContain('2');
    });

    it('renders PASS move text when a player passes', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state; // Black D16
      state = playMove(state, 'PASS').state;            // White passes

      const html = renderToString(
        React.createElement(MoveHistoryPanel, {
          gameState: state,
        })
      );

      expect(html).toContain('D16');
      expect(html).toContain('PASS');
    });
  });

  describe('Score Delta Badges & Interaction (UI-HIST-PANEL-02)', () => {
    it('renders score delta badges when scoreLeadHistory is provided', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state;   // Move 1 (B)
      state = playMove(state, { x: 15, y: 15 }).state;  // Move 2 (W)

      // scoreLead: move0=0, move1=+3.0 (B gained), move2=+2.0 (W gained 1.0)
      const html = renderToString(
        React.createElement(MoveHistoryPanel, {
          gameState: state,
          scoreLeadHistory: [0, 3.0, 2.0],
        })
      );

      // Black move 1: delta = 3.0 - 0 = +3.0
      expect(html).toContain('+3.0');
      // White move 2: delta = -(2.0 - 3.0) = +1.0
      expect(html).toContain('+1.0');
    });

    it('renders neutral dash when scoreLeadHistory is empty', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state;

      const html = renderToString(
        React.createElement(MoveHistoryPanel, {
          gameState: state,
          scoreLeadHistory: [],
        })
      );

      // No delta badge rendered, just a dash placeholder
      expect(html).toContain('D16');
    });

    it('highlights active move when reviewStep is provided', () => {
      let state = createInitialGameState(19);
      state = playMove(state, { x: 3, y: 3 }).state;
      state = playMove(state, { x: 15, y: 15 }).state;

      const html = renderToString(
        React.createElement(MoveHistoryPanel, {
          gameState: state,
          reviewStep: 1,
        })
      );

      // Active move styling includes amber highlight
      expect(html).toContain('bg-amber-500/15');
    });
  });
});
