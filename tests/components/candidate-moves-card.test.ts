import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CandidateMovesCard } from '../../components/go/CandidateMovesCard';
import { CandidateMoveEvaluation } from '../../lib/engine/types';

describe('CandidateMovesCard Component (CANDIDATE-CARD-01)', () => {
  const mockCandidates: CandidateMoveEvaluation[] = [
    {
      point: { x: 3, y: 3 },
      coord: 'D16',
      winrate: 55.4,
      scoreLead: 1.5,
      scoreLoss: 0,
      pv: ['D16'],
      visits: 600,
      rank: 1,
    },
    {
      point: { x: 15, y: 3 },
      coord: 'Q16',
      winrate: 53.8,
      scoreLead: 1.1,
      scoreLoss: 0.4,
      pv: ['Q16'],
      visits: 400,
      rank: 2,
    },
    {
      point: { x: 9, y: 9 },
      coord: 'K10',
      winrate: 49.2,
      scoreLead: -0.8,
      scoreLoss: 2.3,
      pv: ['K10'],
      visits: 150,
      rank: 3,
    },
  ];

  it('renders placeholder when candidates list is empty', () => {
    const html = renderToString(React.createElement(CandidateMovesCard, { candidates: [] }));
    expect(html).toContain('data-testid="candidate-moves-card"');
    expect(html).toContain('เดินหมากเพื่อดู 3 ตัวเลือก');
  });

  it('renders all 3 candidate moves with tags, coordinates, and metrics', () => {
    const html = renderToString(React.createElement(CandidateMovesCard, { candidates: mockCandidates }));

    expect(html).toContain('data-testid="candidate-moves-card"');
    expect(html).toContain('data-testid="candidate-move-item"');
    expect(html).toContain('D16');
    expect(html).toContain('Q16');
    expect(html).toContain('K10');

    expect(html).toContain('ทางเลือก 1: ดีที่สุด');
    expect(html).toContain('ทางเลือก 2: เน้นหนาแน่น');
    expect(html).toContain('ทางเลือก 3: บุกชิงแต้ม');

    expect(html).toContain('55.4');
    expect(html).toContain('+1.5');
    expect(html).toContain('-0.8');
  });

  it('renders thinking state indicator and preserves candidate items to eliminate flicker (CANDIDATE-CARD-02)', () => {
    const html = renderToString(
      React.createElement(CandidateMovesCard, {
        candidates: mockCandidates,
        isAiThinking: true,
      })
    );

    // Verify thinking indicator is present
    expect(html).toContain('data-testid="candidate-moves-card"');
    expect(html).toContain('data-testid="candidate-thinking-state"');
    expect(html).toContain('คู่ต่อสู้กำลังเดินหมาก...');

    // Verify candidates are preserved (zero layout flicker) and disabled
    expect(html).toContain('data-testid="candidate-move-item"');
    expect(html).toContain('D16');
    expect(html).toContain('Q16');
    expect(html).toContain('K10');
    expect(html).toContain('opacity-60 pointer-events-none');
    expect(html).toContain('disabled=""');
  });

  it('renders thinking indicator when candidates are empty during AI turn (BOT-RACE-01)', () => {
    const html = renderToString(
      React.createElement(CandidateMovesCard, {
        candidates: [],
        isAiThinking: true,
      })
    );

    expect(html).toContain('data-testid="candidate-thinking-state"');
    expect(html).toContain('คู่ต่อสู้กำลังเดินหมาก...');
    expect(html).not.toContain('data-testid="candidate-move-item"');
    expect(html).not.toContain('เดินหมากเพื่อดู 3 ตัวเลือกกลยุทธ์จาก KataGo');
  });

  it('omits verbose explanation box to keep card clean while preserving PV preview button and metrics (CANDIDATE-CARD-03, UI-PV-PREVIEW-01)', () => {
    const mockExplanations = [
      {
        coord: 'D16',
        rank: 1,
        tagThai: '⭐ ทางเลือก 1: ดีที่สุด (Best)',
        purpose: 'เพื่อสร้างฐานมุมที่มั่นคง',
        selfImpact: 'กลุ่มมุมรอดปลอดภัย',
        opponentImpact: 'บีบให้คู่แข่งถอยไปตั้งรับ',
      },
    ];

    const html = renderToString(
      React.createElement(CandidateMovesCard, {
        candidates: mockCandidates,
        explanations: mockExplanations,
      })
    );

    // Verify verbose boilerplate explanation box is omitted
    expect(html).not.toContain('data-testid="candidate-explanation-box"');
    expect(html).not.toContain('เพื่อสร้างฐานมุมที่มั่นคง');

    // Verify PV preview button and core metrics are preserved
    expect(html).toContain('data-testid="candidate-pv-preview-btn"');
    expect(html).toContain('ดูสายหมาก');
    expect(html).toContain('D16');
    expect(html).toContain('55.4%');
    expect(html).toContain('+1.5');
    expect(html).toContain('แต้ม');
  });
});
