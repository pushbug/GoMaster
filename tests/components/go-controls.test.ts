import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GoControls } from '../../components/go/GoControls';
import { createInitialGameState } from '../../lib/go/rules';

describe('GoControls Action Bar UI Layout (UI-CONTROLS-01)', () => {
  it('renders concise Thai labels without English parentheses for Pass and Resign', () => {
    const gameState = createInitialGameState(19);
    const html = renderToString(
      React.createElement(GoControls, {
        gameState,
        onPass: () => {},
        onResign: () => {},
        onUndo: () => {},
        heatmapMode: 'none',
        onToggleHeatmap: () => {},
      })
    );

    // Verify Pass button renders "ผ่าน" without "(Pass)"
    expect(html).toContain('data-testid="btn-pass"');
    expect(html).toContain('<span>ผ่าน</span>');
    expect(html).not.toContain('<span>ผ่าน (Pass)</span>');

    // Verify Resign button renders "ยอมแพ้" without "(Resign)"
    expect(html).toContain('data-testid="btn-resign"');
    expect(html).toContain('<span>ยอมแพ้</span>');
    expect(html).not.toContain('<span>ยอมแพ้ (Resign)</span>');

    // Verify Undo and 3-pill Heatmap segmented switcher exist
    expect(html).toContain('data-testid="btn-undo"');
    expect(html).toContain('data-testid="toggle-heatmap-mode"');
    expect(html).toContain('data-testid="btn-heatmap-all"');
    expect(html).toContain('data-testid="btn-heatmap-black"');
    expect(html).toContain('data-testid="btn-heatmap-white"');
    expect(html).toContain('<span>All</span>');
    expect(html).toContain('<span>ดำ</span>');
    expect(html).toContain('<span>ขาว</span>');
  });

  it('highlights the selected heatmap mode pill appropriately', () => {
    const gameState = createInitialGameState(19);

    // Mode: both (All active)
    const htmlBoth = renderToString(
      React.createElement(GoControls, {
        gameState,
        onPass: () => {},
        onResign: () => {},
        onUndo: () => {},
        heatmapMode: 'both',
        onToggleHeatmap: () => {},
      })
    );
    expect(htmlBoth).toContain('bg-amber-500/20 text-amber-300 font-bold');

    // Mode: black (Black active)
    const htmlBlack = renderToString(
      React.createElement(GoControls, {
        gameState,
        onPass: () => {},
        onResign: () => {},
        onUndo: () => {},
        heatmapMode: 'black',
        onToggleHeatmap: () => {},
      })
    );
    expect(htmlBlack).toContain('bg-zinc-800 text-zinc-100 font-bold');

    // Mode: white (White active)
    const htmlWhite = renderToString(
      React.createElement(GoControls, {
        gameState,
        onPass: () => {},
        onResign: () => {},
        onUndo: () => {},
        heatmapMode: 'white',
        onToggleHeatmap: () => {},
      })
    );
    expect(htmlWhite).toContain('bg-zinc-100 text-zinc-950 font-bold');
  });

  it('contains shrink-0 styling to enforce single-row layout without unwanted wrapping', () => {
    const gameState = createInitialGameState(19);
    const html = renderToString(
      React.createElement(GoControls, {
        gameState,
        onPass: () => {},
        onResign: () => {},
        onUndo: () => {},
      })
    );

    // Verify right-side action buttons container enforces shrink-0
    expect(html).toContain('flex items-center justify-end gap-1.5 sm:gap-2 shrink-0');
    // Verify replay navigation container enforces shrink-0
    expect(html).toContain('btn-replay-first');
  });

  it('does not render dynamic "กลับสู่เกม" button during review mode, keeping fixed navigation bar width', () => {
    const gameState = createInitialGameState(19);
    const html = renderToString(
      React.createElement(GoControls, {
        gameState,
        onPass: () => {},
        onResign: () => {},
        onUndo: () => {},
        isReviewing: true,
        reviewStep: 10,
      })
    );

    // Dynamic button removed in favor of arrow buttons (>>) to avoid pushing out right-side buttons
    expect(html).not.toContain('data-testid="btn-replay-live"');
    expect(html).not.toContain('<span>กลับสู่เกม</span>');
    expect(html).toContain('data-testid="btn-replay-last"');
    expect(html).toContain('title="ไปตาล่าสุด / กลับสู่เกม (End)"');
  });
});
