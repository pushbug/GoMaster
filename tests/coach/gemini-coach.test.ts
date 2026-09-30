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

  it('COACH-INTENT-01: Analyzes opponent move intent and categorizes tactical suggested move', () => {
    const advice = generateFallbackCoachAdvice({
      ...sampleRequest,
      moveNumber: 14,
      lastMove: { color: 'W', coord: 'C14' },
    });

    expect(advice.opponentMoveIntent).toBeDefined();
    expect(advice.opponentMoveIntent).toContain('C14');
    expect(advice.suggestedMoveCategory).toBe('solid');
    expect(advice.suggestedMoveCategoryThai).toContain('ถอย');
  });

  it('COACH-INTENT-02: Differentiates player own move from opponent move in intent description', () => {
    // When last move was player's own move (Black playing Black)
    const playerMoveAdvice = generateFallbackCoachAdvice({
      ...sampleRequest,
      moveNumber: 1,
      playerColor: 'B',
      lastMove: { color: 'B', coord: 'Q4' },
    });

    expect(playerMoveAdvice.opponentMoveIntent).toContain('ผู้เรียนเพิ่งเดินที่ Q4');
    expect(playerMoveAdvice.opponentMoveIntent).not.toContain('คู่แข่งเล่นที่');
  });

  it('COACH-CANDIDATE-EXP-01: Generates dynamic candidate explanations with purpose and impacts (COACH-CANDIDATE-EXP-01)', () => {
    const candidateReq: CoachAdviceRequest = {
      ...sampleRequest,
      candidates: [
        { coord: 'D16', winrate: 55, scoreLead: 1.5, scoreLoss: 0, rank: 1, pv: ['D16', 'Q4'] },
        { coord: 'Q16', winrate: 53, scoreLead: 0.8, scoreLoss: 0.7, rank: 2, pv: ['Q16'] },
        { coord: 'K10', winrate: 48, scoreLead: -0.5, scoreLoss: 2.0, rank: 3, pv: ['K10'] },
      ],
    };

    const advice = generateFallbackCoachAdvice(candidateReq);
    expect(advice.candidateExplanations).toBeDefined();
    expect(advice.candidateExplanations?.length).toBe(3);

    const first = advice.candidateExplanations![0];
    expect(first.coord).toBe('D16');
    expect(first.rank).toBe(1);
    expect(first.tagThai).toContain('ดีที่สุด');
    expect(first.purpose).toBeDefined();
    expect(first.selfImpact).toBeDefined();
    expect(first.opponentImpact).toBeDefined();

    const second = advice.candidateExplanations![1];
    expect(second.coord).toBe('Q16');
    expect(second.rank).toBe(2);
    expect(second.tagThai).toContain('หนาแน่น');

    const third = advice.candidateExplanations![2];
    expect(third.coord).toBe('K10');
    expect(third.rank).toBe(3);
    expect(third.tagThai).toContain('บุก');
  });

  it('COACH-CANDIDATE-EXP-02: Parses candidateExplanations from Gemini Flash API payload', async () => {
    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  initiative: 'Sente',
                  initiativeThai: 'เซ็นเตะ (ได้จังหวะบุกก่อน)',
                  evaluationTitle: 'ทดสอบคำอธิบาย 3 ทางเลือก',
                  tacticalAdvice: 'ภาพรวมดี',
                  keyConcept: 'ยึดมุมก่อน',
                  suggestedAction: 'เดิน D16',
                  candidateExplanations: [
                    {
                      coord: 'D16',
                      rank: 1,
                      tagThai: '⭐ ทางเลือก 1: ดีที่สุด (Best)',
                      purpose: 'เพื่อสร้างฐานมุม',
                      selfImpact: 'กลุ่มมุมรอดปลอดภัย',
                      opponentImpact: 'บีบให้คู่แข่งถอยไปตั้งรับ',
                    },
                    {
                      coord: 'Q16',
                      rank: 2,
                      tagThai: '🏃 ทางเลือก 2: เน้นหนาแน่น (Solid)',
                      purpose: 'เชื่อมกลุ่มขวา',
                      selfImpact: 'เพิ่มลมหายใจ',
                      opponentImpact: 'ลดการบุกของคู่แข่ง',
                    },
                  ],
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
      expect(advice.candidateExplanations).toBeDefined();
      expect(advice.candidateExplanations?.length).toBe(2);
      expect(advice.candidateExplanations![0].purpose).toBe('เพื่อสร้างฐานมุม');
      expect(advice.candidateExplanations![0].selfImpact).toBe('กลุ่มมุมรอดปลอดภัย');
      expect(advice.candidateExplanations![0].opponentImpact).toBe('บีบให้คู่แข่งถอยไปตั้งรับ');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
