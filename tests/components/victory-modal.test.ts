import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VictoryModal, VictoryModalProps } from '../../components/go/VictoryModal';
import { DeadStonesSummary } from '../../lib/go/dead-stones';
import { WHITE } from '../../lib/go/types';

describe('VictoryModal Component (UI-VICTORY-MODAL-01)', () => {
  const mockDeadStonesSummary: DeadStonesSummary = {
    deadStones: [
      { point: { x: 10, y: 10 }, color: WHITE, coord: 'K10', ownership: 0.9 },
      { point: { x: 10, y: 11 }, color: WHITE, coord: 'K9', ownership: 0.9 },
    ],
    deadStoneKeys: new Set(['10,10', '10,11']),
    whiteDeadCount: 18,
    blackDeadCount: 0,
    dragons: [
      {
        id: 'dragon-W-1',
        color: WHITE,
        stones: [{ x: 10, y: 10 }, { x: 10, y: 11 }],
        stoneCount: 18,
        centerCoord: 'K10',
        coords: ['K10', 'K9'],
        regionLabelThai: 'กลางกระดาน',
      },
    ],
    largestDeadDragon: {
      id: 'dragon-W-1',
      color: WHITE,
      stones: [{ x: 10, y: 10 }, { x: 10, y: 11 }],
      stoneCount: 18,
      centerCoord: 'K10',
      coords: ['K10', 'K9'],
      regionLabelThai: 'กลางกระดาน',
    },
    hasDeadStones: true,
  };

  const defaultProps: VictoryModalProps = {
    isOpen: true,
    onClose: () => {},
    onNewGame: () => {},
    winner: 'B',
    playerColor: 'B',
    resignReason: 'บอทยอมแพ้ (แต้มตามหลัง 37.4 แต้ม)',
    scoreLead: 37.4,
    captures: { black: 15, white: 14 },
    deadStonesSummary: mockDeadStonesSummary,
    showDeadStones: true,
    onToggleDeadStones: () => {},
  };

  it('renders null when isOpen is false', () => {
    const html = renderToString(React.createElement(VictoryModal, { ...defaultProps, isOpen: false }));
    expect(html).toBe('');
  });

  it('renders victory announcement and trophy when player wins', () => {
    const html = renderToString(React.createElement(VictoryModal, defaultProps));
    expect(html).toContain('data-testid="modal-victory"');
    expect(html).toContain('🎉 ชัยชนะเป็นของคุณ!');
    expect(html).toContain('บอทยอมแพ้ (แต้มตามหลัง 37.4 แต้ม)');
    expect(html).toContain('+37.4');
  });

  it('renders dragon autopsy card with stone count and Thai region description', () => {
    const html = renderToString(React.createElement(VictoryModal, defaultProps));
    expect(html).toContain('data-testid="dragon-summary-card"');
    expect(html).toContain('18');
    expect(html).toContain('เม็ด');
    expect(html).toContain('กลางกระดาน');
    expect(html).toContain('K10');
    expect(html).toContain('Two Eyes');
  });

  it('renders interactive toggle and action buttons with test IDs', () => {
    const html = renderToString(React.createElement(VictoryModal, defaultProps));
    expect(html).toContain('data-testid="btn-toggle-dead-stones"');
    expect(html).toContain('data-testid="btn-victory-replay"');
    expect(html).toContain('data-testid="btn-victory-new-game"');
    expect(html).toContain('ไฮไลต์หมากตาย');
    expect(html).toContain('ตรวจดูกระดาน / Replay');
    expect(html).toContain('เริ่มเกมใหม่');
  });

  it('displays bot victory gracefully when opponent wins', () => {
    const html = renderToString(
      React.createElement(VictoryModal, {
        ...defaultProps,
        winner: 'W',
        playerColor: 'B',
        resignReason: 'ผู้เล่นยอมแพ้',
        scoreLead: -25.5,
      })
    );
    expect(html).toContain('ผู้ชนะ: หมากขาว (White)');
    expect(html).toContain('-25.5');
  });
});
