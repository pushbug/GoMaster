import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OpponentMoveCard } from '../../components/go/OpponentMoveCard';
import { BLACK, WHITE } from '../../lib/go/types';

describe('OpponentMoveCard Component (OPPONENT-CARD-01)', () => {
  it('renders initial empty placeholder when no moves have been played yet', () => {
    const html = renderToString(
      React.createElement(OpponentMoveCard, {
        moveNumber: 0,
        lastMoveCoord: null,
      })
    );

    expect(html).toContain('data-testid="opponent-move-card"');
    expect(html).toContain('ยังไม่มีการเดินหมากของคู่ต่อสู้');
    expect(html).not.toContain('data-testid="opponent-move-coord"');
  });

  it('renders opponent move coordinates, color token, intent, and positive score delta', () => {
    const html = renderToString(
      React.createElement(OpponentMoveCard, {
        moveNumber: 16,
        lastMoveCoord: 'D4',
        lastMoveColor: WHITE,
        scoreDelta: {
          delta: 1.2,
          formatted: '+1.2',
          isGain: true,
          isLoss: false,
        },
        opponentIntent: 'คู่แข่งเล่นที่ D4 เพื่อยึดมุมล่างซ้ายและสร้างฐานที่มั่น',
        initiative: 'Sente',
        initiativeThai: 'เซ็นเตะ (บุกก่อน)',
      })
    );

    expect(html).toContain('data-testid="opponent-move-card"');
    expect(html).toContain('data-testid="opponent-move-coord"');
    expect(html).toContain('D4');
    expect(html).toContain('ตาที่ #16');
    expect(html).toContain('หมากขาว');
    expect(html).toContain('เซ็นเตะ (บุกก่อน)');
    expect(html).toContain('+1.2 แต้ม');
    expect(html).toContain('bg-emerald-500/15');
    expect(html).toContain('คู่แข่งเล่นที่ D4 เพื่อยึดมุมล่างซ้าย');
  });

  it('renders negative score delta with rose styling for blunders or mistakes', () => {
    const html = renderToString(
      React.createElement(OpponentMoveCard, {
        moveNumber: 27,
        lastMoveCoord: 'R10',
        lastMoveColor: BLACK,
        scoreDelta: {
          delta: -3.4,
          formatted: '-3.4',
          isGain: false,
          isLoss: true,
        },
        opponentIntent: 'ผู้เรียนเดินหมากบุกเร็วเกินไป ทำให้กลุ่มหมากเสียแต้ม',
        initiative: 'Gote',
        initiativeThai: 'โกเตะ (ตั้งรับ)',
      })
    );

    expect(html).toContain('R10');
    expect(html).toContain('หมากดำ');
    expect(html).toContain('-3.4 แต้ม');
    expect(html).toContain('bg-rose-500/15');
    expect(html).toContain('โกเตะ (ตั้งรับ)');
  });
});
