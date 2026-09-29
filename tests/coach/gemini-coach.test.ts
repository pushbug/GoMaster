import { describe, expect, it, vi } from 'vitest';
import {
  buildCoachSystemPrompt,
  buildCoachUserPrompt,
  callGeminiFlashCoach,
  CoachAdviceRequest,
  generateFallbackCoachAdvice,
} from '@/lib/coach/gemini-coach';

describe('Gemini 9-Dan Coach Layer (COACH-PROMPT-01, COACH-FALLBACK-01, COACH-API-01)', () => {
  const sampleRequest: CoachAdviceRequest = {
    boardSize: 19,
    moveNumber: 12,
    lastMove: { color: 'W', coord: 'D4' },
    winrate: 54.2,
    scoreLead: 1.5,
    bestSuggestedMove: { coord: 'Q16', winrate: 54.8, scoreLead: 1.8 },
    playerColor: 'B',
    userRank: '1D',
  };

  it('COACH-PROMPT-01: System prompt establishes 9-Dan mentor persona and Thai Go principles', () => {
    const sysPrompt = buildCoachSystemPrompt();

    expect(sysPrompt).toContain('9-Dan Professional Go');
    expect(sysPrompt).toContain('Sente');
    expect(sysPrompt).toContain('Gote');
    expect(sysPrompt).toContain('Haengma');
    expect(sysPrompt).toContain('Empty Triangle');
    expect(sysPrompt).toContain('JSON');
  });

  it('COACH-PROMPT-01: User prompt formats board state and KataGo evaluation parameters', () => {
    const userPrompt = buildCoachUserPrompt(sampleRequest);

    expect(userPrompt).toContain('19x19');
    expect(userPrompt).toContain('#12');
    expect(userPrompt).toContain('D4');
    expect(userPrompt).toContain('54.2%');
    expect(userPrompt).toContain('+1.5');
    expect(userPrompt).toContain('Q16');
    expect(userPrompt).toContain('1D');
  });

  it('COACH-FALLBACK-01: Generates authentic Thai fuseki guidance during opening', () => {
    const openingReq: CoachAdviceRequest = {
      ...sampleRequest,
      moveNumber: 3,
    };

    const advice = generateFallbackCoachAdvice(openingReq);

    expect(advice.isAiGenerated).toBe(false);
    expect(advice.initiative).toBeDefined();
    expect(advice.initiativeThai).toContain('เซ็นเตะ');
    expect(advice.evaluationTitle).toContain('เปิดเกม');
    expect(advice.tacticalAdvice).toContain('มุม');
    expect(advice.keyConcept).toContain('Corner');
    expect(advice.suggestedAction).toContain('Q16');
  });

  it('COACH-FALLBACK-01: Generates tactical solid-play advice when leading in midgame', () => {
    const midgameLeadReq: CoachAdviceRequest = {
      ...sampleRequest,
      moveNumber: 45,
      winrate: 68.5,
      scoreLead: 7.2,
      bestSuggestedMove: { coord: 'K10', winrate: 69.0, scoreLead: 7.5 },
    };

    const advice = generateFallbackCoachAdvice(midgameLeadReq);

    expect(advice.isAiGenerated).toBe(false);
    expect(advice.initiative).toBe('Sente');
    expect(advice.evaluationTitle).toContain('ได้เปรียบ');
    expect(advice.tacticalAdvice).toContain('ความหนาแน่น');
    expect(advice.suggestedAction).toContain('K10');
  });

  it('COACH-FALLBACK-01: Generates defensive base-care advice when trailing in midgame', () => {
    const midgameTrailReq: CoachAdviceRequest = {
      ...sampleRequest,
      moveNumber: 50,
      winrate: 32.0,
      scoreLead: -8.5,
      bestSuggestedMove: { coord: 'C10', winrate: 33.0, scoreLead: -8.0 },
    };

    const advice = generateFallbackCoachAdvice(midgameTrailReq);

    expect(advice.isAiGenerated).toBe(false);
    expect(advice.initiative).toBe('Gote');
    expect(advice.tacticalAdvice).toContain('เบ้าตา');
    expect(advice.keyConcept).toContain('กลุ่มอ่อนแอ');
  });

  it('COACH-API-01: callGeminiFlashCoach parses structured Gemini response correctly', async () => {
    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  initiative: 'Sente',
                  initiativeThai: 'เซ็นเตะ (ได้จังหวะบุกก่อน)',
                  evaluationTitle: 'รักษาจังหวะบุกเซ็นเตะที่มุมขวาบน',
                  tacticalAdvice: 'เม็ด Q16 ของคุณสร้างความแข็งแกร่งอย่างมาก สามารถใช้จังหวะนี้ขยายพื้นที่ไปทาง R10 ได้ทันที',
                  keyConcept: 'ชิงเดินจุดเร่งด่วนก่อนจุดใหญ่ (急場先、大場後)',
                  suggestedAction: 'เดินเม็ด R10 เพื่อเปิดพื้นที่ปีกขวา',
                }),
              },
            ],
          },
        },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    try {
      const advice = await callGeminiFlashCoach(sampleRequest, 'dummy_test_key');

      expect(advice.isAiGenerated).toBe(true);
      expect(advice.initiative).toBe('Sente');
      expect(advice.evaluationTitle).toBe('รักษาจังหวะบุกเซ็นเตะที่มุมขวาบน');
      expect(advice.tacticalAdvice).toContain('Q16');
      expect(advice.keyConcept).toContain('จุดเร่งด่วน');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('COACH-API-01: callGeminiFlashCoach degrades gracefully to fallback on fetch error', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    try {
      const advice = await callGeminiFlashCoach(sampleRequest, 'dummy_test_key');

      expect(advice.isAiGenerated).toBe(false);
      expect(advice.evaluationTitle).toBeDefined();
      expect(advice.tacticalAdvice).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
