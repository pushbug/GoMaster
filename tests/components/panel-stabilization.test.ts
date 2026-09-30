import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CoachAdviceCard } from '../../components/go/CoachAdviceCard';
import { OpponentMoveCard } from '../../components/go/OpponentMoveCard';
import { CoachAdviceResponse } from '../../lib/coach/gemini-coach';
import { WHITE } from '../../lib/go/types';

describe('Panel Stabilization & Anti-Flicker Layout (UI-PANEL-STABLE-01 & 02)', () => {
  const mockAdvice: CoachAdviceResponse = {
    initiative: 'Sente',
    initiativeThai: 'เซ็นเตะ (บุกก่อน)',
    evaluationTitle: 'รักษาจังหวะบุกเซ็นเตะที่มุมขวาบน',
    tacticalAdvice: 'เม็ด Q16 ของคุณสร้างความแข็งแกร่งอย่างมาก สามารถใช้จังหวะนี้ขยายพื้นที่ไปทาง R10 ได้ทันที',
    keyConcept: 'ชิงเดินจุดเร่งด่วนก่อนจุดใหญ่ (急場先、大場後)',
    suggestedAction: 'เดินเม็ด R10 เพื่อเปิดพื้นที่ปีกขวา',
    suggestedMoveCategoryThai: 'ขยายพื้นที่',
    isAiGenerated: true,
  };

  describe('CoachAdviceCard Silent Background Loading (UI-PANEL-STABLE-01)', () => {
    it('preserves existing advice text and renders subtle header loader during background fetch', () => {
      const html = renderToString(
        React.createElement(CoachAdviceCard, {
          advice: mockAdvice,
          isLoading: true,
          gameMode: 'vs-ai',
          selectedRank: '1D',
        })
      );

      // Verify DOM is NOT destroyed/replaced by bulky loader box
      expect(html).toContain('data-testid="coach-advice-card"');
      expect(html).toContain('รักษาจังหวะบุกเซ็นเตะที่มุมขวาบน');
      expect(html).toContain('เม็ด Q16 ของคุณสร้างความแข็งแกร่งอย่างมาก');
      expect(html).toContain('ชิงเดินจุดเร่งด่วนก่อนจุดใหญ่');

      // Verify subtle micro-loader exists in header
      expect(html).toContain('data-testid="coach-silent-loader"');

      // Verify container has min-height reservation
      expect(html).toContain('min-h-[220px]');
    });

    it('renders advice without silent loader when loading completes', () => {
      const html = renderToString(
        React.createElement(CoachAdviceCard, {
          advice: mockAdvice,
          isLoading: false,
          gameMode: 'vs-ai',
          selectedRank: '1D',
        })
      );

      expect(html).toContain('รักษาจังหวะบุกเซ็นเตะที่มุมขวาบน');
      expect(html).not.toContain('data-testid="coach-silent-loader"');
    });

    it('maintains min-height reservation in empty initial welcome state', () => {
      const html = renderToString(
        React.createElement(CoachAdviceCard, {
          advice: null,
          isLoading: false,
          gameMode: 'self-study',
          selectedRank: '1D',
        })
      );

      expect(html).toContain('เริ่มต้นการฝึกฝนหมากล้อม');
      expect(html).toContain('min-h-[220px]');
    });
  });

  describe('OpponentMoveCard Height Reservation (UI-PANEL-STABLE-02)', () => {
    it('enforces min-height reservation in both empty and populated states', () => {
      const emptyHtml = renderToString(
        React.createElement(OpponentMoveCard, {
          moveNumber: 0,
          lastMoveCoord: null,
        })
      );
      expect(emptyHtml).toContain('min-h-[145px]');

      const activeHtml = renderToString(
        React.createElement(OpponentMoveCard, {
          moveNumber: 16,
          lastMoveCoord: 'D4',
          lastMoveColor: WHITE,
          opponentIntent: 'คู่แข่งเล่นที่ D4 เพื่อยึดมุมล่างซ้าย',
        })
      );
      expect(activeHtml).toContain('min-h-[145px]');
    });
  });
});
