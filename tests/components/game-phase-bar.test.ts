import { describe, expect, it } from 'vitest';
import { calculateGamePhase } from '../../lib/go/game-phase';

describe('Game Phase Domain & UI (PHASE-01)', () => {
  describe('19x19 Board Transitions', () => {
    it('identifies opening phase (Fuseki) for moves 0-30', () => {
      const phase0 = calculateGamePhase(0, 19);
      expect(phase0.phase).toBe('opening');
      expect(phase0.stageName).toBe('Fuseki');
      expect(phase0.progressPercent).toBe(0);

      const phase20 = calculateGamePhase(20, 19);
      expect(phase20.phase).toBe('opening');
    });

    it('identifies middle game (Chuban) for moves 31-120', () => {
      const phase45 = calculateGamePhase(45, 19);
      expect(phase45.phase).toBe('middle');
      expect(phase45.stageName).toBe('Chuban');
      expect(phase45.progressPercent).toBeGreaterThan(15);
    });

    it('identifies endgame (Yose) for moves > 120', () => {
      const phase150 = calculateGamePhase(150, 19);
      expect(phase150.phase).toBe('endgame');
      expect(phase150.stageName).toBe('Yose');
      expect(phase150.progressPercent).toBeGreaterThan(60);
    });
  });

  describe('Scaled Board Sizes (13x13 and 9x9)', () => {
    it('scales phase thresholds for 13x13 boards', () => {
      expect(calculateGamePhase(10, 13).phase).toBe('opening');
      expect(calculateGamePhase(30, 13).phase).toBe('middle');
      expect(calculateGamePhase(60, 13).phase).toBe('endgame');
    });

    it('scales phase thresholds for 9x9 boards', () => {
      expect(calculateGamePhase(4, 9).phase).toBe('opening');
      expect(calculateGamePhase(15, 9).phase).toBe('middle');
      expect(calculateGamePhase(28, 9).phase).toBe('endgame');
    });
  });

  describe('Unified Progress Bar Component Rendering (PROGRESS-BAR-01)', () => {
    it('renders single-track progress bar with inner phase text and excludes redundant advice text', async () => {
      const React = await import('react');
      const { renderToString } = await import('react-dom/server');
      const { GamePhaseBar } = await import('../../components/go/GamePhaseBar');

      const html = renderToString(
        React.createElement(GamePhaseBar, {
          moveNumber: 15,
          boardSize: 19,
        })
      );

      // Verify container data-testid
      expect(html).toContain('data-testid="game-phase-bar"');
      // Verify phase info and progress percentage
      expect(html).toContain('เปิดเกม');
      expect(html).toContain('Fuseki');
      expect(html).toContain('ตาที่ #15');
      // Verify unified progress track
      expect(html).toContain('style="width:');
      // Verify phase zone markers
      expect(html).toContain('เปิดเกม (Fuseki)');
      expect(html).toContain('กลางเกม (Chuban)');
      expect(html).toContain('ท้ายเกม (Yose)');
      // Verify redundant micro-advice description is removed
      expect(html).not.toContain('เน้นยึดมุม');
      expect(html).not.toContain('ช่วงเข้าสู่กลางกระดาน');
    });
  });
});

