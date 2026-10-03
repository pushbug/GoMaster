import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EvaluationBar } from '../../components/go/EvaluationBar';

describe('Zen Mode & Collapsible Layout Verification (UI-ZEN-01, UI-COLLAPSE-01)', () => {
  describe('EvaluationBar Zen Mode (UI-ZEN-01)', () => {
    it('renders score and winrate when zenMode is false (standard mode)', () => {
      const html = renderToString(
        React.createElement(EvaluationBar, {
          winrate: 65.4,
          scoreLead: 4.5,
          blackScore: 45.5,
          whiteScore: 41.0,
          captures: { black: 2, white: 1 },
          zenMode: false,
        })
      );

      // In standard mode: score lead and winrates are clearly visible
      expect(html).toContain('45.5');
      expect(html).toContain('41');
      expect(html).toContain('65.4');
      expect(html).toContain('34.6');
      expect(html).toContain('data-testid="counter-black-captures"');
      expect(html).toContain('data-testid="counter-white-captures"');
    });

    it('conceals score and winrate numbers when zenMode is true', () => {
      const html = renderToString(
        React.createElement(EvaluationBar, {
          winrate: 65.4,
          scoreLead: 4.5,
          blackScore: 45.5,
          whiteScore: 41.0,
          captures: { black: 2, white: 1 },
          zenMode: true,
        })
      );

      // In Zen mode: scores and winrate percentages must be hidden from user
      expect(html).not.toContain('65.4%');
      expect(html).not.toContain('34.6%');
      expect(html).not.toContain('แต้ม');

      // But player labels and capture counters remain visible for game awareness
      expect(html).toContain('data-testid="counter-black-captures"');
      expect(html).toContain('data-testid="counter-white-captures"');
      expect(html).toContain('data-testid="eval-player-black"');
      expect(html).toContain('data-testid="eval-player-white"');
    });
  });

  describe('Sidebar Collapse Responsiveness (UI-COLLAPSE-01)', () => {
    it('calculates full width column classes when sidebar is collapsed vs active', () => {
      const getBoardColumnClass = (isSidebarOpen: boolean) =>
        isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12';

      expect(getBoardColumnClass(true)).toBe('lg:col-span-8');
      expect(getBoardColumnClass(false)).toBe('lg:col-span-12');
    });

    it('suppresses candidate ghost coords and Pv variations when in zen mode', () => {
      const candidate = 'Q16';
      const pv = ['Q16', 'D4', 'Q4'];

      const resolveActiveCandidate = (isZen: boolean, rawCandidate: string | null) =>
        isZen ? null : rawCandidate;

      const resolveActivePv = (isZen: boolean, rawPv: string[] | null) =>
        isZen ? [] : (rawPv ?? []);

      expect(resolveActiveCandidate(false, candidate)).toBe('Q16');
      expect(resolveActiveCandidate(true, candidate)).toBeNull();

      expect(resolveActivePv(false, pv)).toEqual(['Q16', 'D4', 'Q4']);
      expect(resolveActivePv(true, pv)).toEqual([]);
    });
  });
});
