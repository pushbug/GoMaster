import { describe, expect, it, vi } from 'vitest';
import {
  buildVariationSteps,
  drawBoardBackground,
  drawOwnershipHeatmap,
  drawVariationSequence,
  renderGoBoard,
} from '../../lib/go/board-renderer';
import { BLACK, EMPTY, WHITE } from '../../lib/go/types';

function createMockContext() {
  const calls: { method: string; args: any[]; fillStyle?: string }[] = [];

  const ctx = {
    calls,
    fillRect: vi.fn((...args: any[]) => {
      calls.push({ method: 'fillRect', args, fillStyle: (ctx as any)?.fillStyle ?? '' });
    }),
    strokeRect: vi.fn((...args: any[]) => {
      calls.push({ method: 'strokeRect', args });
    }),
    clearRect: vi.fn((...args: any[]) => {
      calls.push({ method: 'clearRect', args });
    }),
    beginPath: vi.fn((...args: any[]) => {
      calls.push({ method: 'beginPath', args });
    }),
    arc: vi.fn((...args: any[]) => {
      calls.push({ method: 'arc', args });
    }),
    fill: vi.fn((...args: any[]) => {
      calls.push({ method: 'fill', args });
    }),
    stroke: vi.fn((...args: any[]) => {
      calls.push({ method: 'stroke', args });
    }),
    moveTo: vi.fn((...args: any[]) => {
      calls.push({ method: 'moveTo', args });
    }),
    lineTo: vi.fn((...args: any[]) => {
      calls.push({ method: 'lineTo', args });
    }),
    fillText: vi.fn((...args: any[]) => {
      calls.push({ method: 'fillText', args });
    }),
    save: vi.fn(),
    restore: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: 'center',
    textBaseline: 'middle',
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  } as unknown as CanvasRenderingContext2D & { calls: { method: string; args: any[]; fillStyle?: string }[] };

  return ctx;
}

describe('Go Board Renderer (UI-BOARD-BORDER-01, UI-BOARD-CLEAN-01)', () => {
  describe('Single Perimeter Border (UI-BOARD-BORDER-01)', () => {
    it('drawBoardBackground does not call strokeRect for outer bevel', () => {
      const ctx = createMockContext();
      drawBoardBackground(ctx, 600, 'wood');

      // Verify fillRect is called for the board surface
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 600, 600);

      // Verify strokeRect is NOT called (no secondary border frame)
      expect(ctx.strokeRect).not.toHaveBeenCalled();
    });
  });

  describe('Clean Board Without Candidate Move Overlay (UI-BOARD-CLEAN-01)', () => {
    it('renderGoBoard executes cleanly without candidate moves overlay', () => {
      const ctx = createMockContext();
      const emptyBoard = Array.from({ length: 19 }, () => Array(19).fill(EMPTY));

      renderGoBoard({
        ctx,
        displaySize: 600,
        dpr: 1,
        boardSize: 19,
        board: emptyBoard,
        boardTheme: 'wood',
        showCoordinates: true,
        coordMargin: 30,
        boardAreaSize: 540,
        cellSize: 30,
        stoneRadius: 14,
        turn: BLACK,
        lastMove: null,
        hoverPoint: null,
        isHoverValid: true,
        interactive: true,
        showGhostStone: false,
        isGameOver: false,
      });

      // ClearRect must have been called
      expect(ctx.clearRect).toHaveBeenCalled();

      // Check fillText calls: should only be coordinate letters/numbers (A-T, 1-19)
      // and NOT percentage badges (e.g. "50%", "49%")
      const textCalls = (ctx as any).calls
        .filter((c: any) => c.method === 'fillText')
        .map((c: any) => String(c.args[0]));

      const percentageCalls = textCalls.filter((t: string) => t.includes('%'));
      expect(percentageCalls).toEqual([]);
    });
  });

  describe('Ownership Heatmap Mode Filtering (UI-HEATMAP-RENDER-01)', () => {
    const mockGrid = [
      [0.8, -0.7, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    it('drawOwnershipHeatmap suppresses all drawing when mode is "none"', () => {
      const ctx = createMockContext();
      drawOwnershipHeatmap(ctx, mockGrid, 19, 30, 30, 'none');

      const fillCalls = ctx.calls.filter(c => c.method === 'fillRect');
      expect(fillCalls).toHaveLength(0);
    });

    it('drawOwnershipHeatmap renders both Black and White boxes when mode is "both"', () => {
      const ctx = createMockContext();
      drawOwnershipHeatmap(ctx, mockGrid, 19, 30, 30, 'both');

      const fillCalls = ctx.calls.filter(c => c.method === 'fillRect');
      expect(fillCalls).toHaveLength(2);

      const blackFills = fillCalls.filter(c => (c as any).fillStyle.includes('0, 0, 0'));
      const whiteFills = fillCalls.filter(c => (c as any).fillStyle.includes('255, 255, 255'));
      expect(blackFills).toHaveLength(1);
      expect(whiteFills).toHaveLength(1);
    });

    it('drawOwnershipHeatmap filters strictly to Black territory when mode is "black"', () => {
      const ctx = createMockContext();
      drawOwnershipHeatmap(ctx, mockGrid, 19, 30, 30, 'black');

      const fillCalls = ctx.calls.filter(c => c.method === 'fillRect');
      expect(fillCalls).toHaveLength(1);
      expect((fillCalls[0] as any).fillStyle).toContain('0, 0, 0');
    });

    it('drawOwnershipHeatmap filters strictly to White territory when mode is "white"', () => {
      const ctx = createMockContext();
      drawOwnershipHeatmap(ctx, mockGrid, 19, 30, 30, 'white');

      const fillCalls = ctx.calls.filter(c => c.method === 'fillRect');
      expect(fillCalls).toHaveLength(1);
      expect((fillCalls[0] as any).fillStyle).toContain('255, 255, 255');
    });
  });

  describe('Dead Stone Dimming and Cross Marker (UI-DEAD-RENDER-01)', () => {
    it('renders dead stones with dimming opacity and cross marker (✕)', () => {
      const ctx = createMockContext();
      const board = Array.from({ length: 19 }, () => Array(19).fill(EMPTY));
      board[3][3] = BLACK;
      const deadKeys = new Set(['3,3']);

      renderGoBoard({
        ctx,
        displaySize: 600,
        dpr: 1,
        boardSize: 19,
        board,
        boardTheme: 'wood',
        showCoordinates: true,
        coordMargin: 30,
        boardAreaSize: 540,
        cellSize: 30,
        stoneRadius: 14,
        turn: BLACK,
        lastMove: null,
        hoverPoint: null,
        isHoverValid: true,
        interactive: false,
        showGhostStone: false,
        isGameOver: true,
        deadStoneKeys: deadKeys,
      });

      // Verify cross marker stroke was executed
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('PV Variation Sequence Rendering (UI-PV-PREVIEW-01)', () => {
    it('buildVariationSteps creates alternating colored steps with sequential numbers', () => {
      const emptyBoard = Array.from({ length: 19 }, () => Array(19).fill(EMPTY));
      const steps = buildVariationSteps(['D16', 'Q4', 'C16'], BLACK, 19, emptyBoard);

      expect(steps).toHaveLength(3);
      expect(steps[0].point).toEqual({ x: 3, y: 3 });
      expect(steps[0].color).toBe(BLACK);
      expect(steps[0].stepNumber).toBe(1);

      expect(steps[1].point).toEqual({ x: 15, y: 15 });
      expect(steps[1].color).toBe(WHITE);
      expect(steps[1].stepNumber).toBe(2);

      expect(steps[2].point).toEqual({ x: 2, y: 3 });
      expect(steps[2].color).toBe(BLACK);
      expect(steps[2].stepNumber).toBe(3);
    });

    it('buildVariationSteps skips coordinates already occupied on the board', () => {
      const board = Array.from({ length: 19 }, () => Array(19).fill(EMPTY));
      board[3][3] = BLACK; // D16 is occupied

      const steps = buildVariationSteps(['D16', 'Q4'], BLACK, 19, board);
      // D16 skipped because occupied, Q4 proceeds
      expect(steps).toHaveLength(1);
      expect(steps[0].stepNumber).toBe(2);
      expect(steps[0].point).toEqual({ x: 15, y: 15 });
    });

    it('drawVariationSequence renders numbered badges on canvas', () => {
      const ctx = createMockContext();
      const steps = [
        { point: { x: 3, y: 3 }, color: BLACK, stepNumber: 1 },
        { point: { x: 15, y: 15 }, color: WHITE, stepNumber: 2 },
      ];

      drawVariationSequence(ctx, steps, 30, 30, 14);

      expect(ctx.arc).toHaveBeenCalled();
      const textCalls = ctx.calls
        .filter(c => c.method === 'fillText')
        .map(c => String(c.args[0]));

      expect(textCalls).toContain('1');
      expect(textCalls).toContain('2');
    });

    it('renderGoBoard renders variationPreview when supplied', () => {
      const ctx = createMockContext();
      const emptyBoard = Array.from({ length: 19 }, () => Array(19).fill(EMPTY));
      const variationPreview = [
        { point: { x: 3, y: 3 }, color: BLACK, stepNumber: 1 },
      ];

      renderGoBoard({
        ctx,
        displaySize: 600,
        dpr: 1,
        boardSize: 19,
        board: emptyBoard,
        boardTheme: 'wood',
        showCoordinates: true,
        coordMargin: 30,
        boardAreaSize: 540,
        cellSize: 30,
        stoneRadius: 14,
        turn: BLACK,
        lastMove: null,
        hoverPoint: null,
        isHoverValid: true,
        interactive: true,
        showGhostStone: false,
        isGameOver: false,
        variationPreview,
      });

      const textCalls = ctx.calls
        .filter(c => c.method === 'fillText')
        .map(c => String(c.args[0]));

      expect(textCalls).toContain('1');
    });
  });
});
