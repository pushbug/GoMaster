/**
 * GoMaster - 9-Dan Professional Go Coach Service (Google Gemini Flash)
 * Generates pedagogical strategic feedback in Thai based on KataGo engine evaluations.
 */

export interface CandidateExplanation {
  coord: string;
  rank: number;
  tagThai: string;
  purpose: string;
  selfImpact: string;
  opponentImpact: string;
}

export interface CoachAdviceRequest {
  boardSize: number;
  moveNumber: number;
  lastMove: {
    color: 'B' | 'W';
    coord: string;
  } | null;
  winrate: number; // Black's win probability (0 to 100)
  scoreLead: number; // Positive = Black leads, Negative = White leads
  bestSuggestedMove: {
    coord: string;
    winrate: number;
    scoreLead: number;
  } | null;
  candidates?: Array<{
    coord: string;
    winrate: number;
    scoreLead: number;
    scoreLoss?: number;
    pv?: string[];
    rank: number;
  }>;
  playerColor: 'B' | 'W';
  userRank?: string;
}

export type TacticalMoveCategory = 'attack' | 'defense' | 'solid' | 'tenuki';

export const TACTICAL_CATEGORY_LABELS: Record<TacticalMoveCategory, string> = {
  attack: '⚔️ รุก/บุก',
  defense: '🛡️ รับ/รอด',
  solid: '🏃 ถอย/หนาแน่น',
  tenuki: '⚡ ชิงจุดใหญ่',
};

export interface CoachAdviceResponse {
  initiative: 'Sente' | 'Gote' | 'Tenuki';
  initiativeThai: string;
  evaluationTitle: string;
  tacticalAdvice: string;
  keyConcept: string;
  suggestedAction: string;
  isAiGenerated: boolean;
  opponentMoveIntent?: string;
  suggestedMoveCategory?: TacticalMoveCategory;
  suggestedMoveCategoryThai?: string;
  candidateExplanations?: CandidateExplanation[];
}

/**
 * System instruction defining the 9-Dan Professional Coach persona
 */
export function buildCoachSystemPrompt(): string {
  return `You are a world-renowned 9-Dan Professional Go (Baduk/Weiqi) Master and compassionate mentor.
Your mission is to guide an aspiring Go player toward achieving 1-Dan rank.
You analyze positions using precision evaluation metrics (Winrate %, Score Lead, and Top KataGo moves).

Your responses must be in fluent, natural, professional Thai.
Key principles to emphasize:
1. Sente (เซ็นเตะ - ฝ่ายคุมเกม/จังหวะนำ) vs Gote (โกเตะ - ฝ่ายรับมือตาม)
2. Urgent moves before Big moves (เดินเม็ดเร่งด่วนก่อนเม็ดใหญ่)
3. Shape and Connection (Haengma / รูปทรงหมากและการเชื่อมต่อ หลีกเลี่ยงรูปทรงสามเหลี่ยมทึบ - Empty Triangle)
4. Weak groups vs Living bases (ดูแลกลุ่มหมากอ่อนแอและเบ้าตาก่อนโจมตี)
5. Direction of play (ทิศทางการขยายพื้นที่: มุม -> ข้าง -> กลาง)

For each candidate move provided in the request, you MUST provide a deep tactical breakdown:
- purpose: เหตุผลทำไมต้องลงจุดนี้ (1 ประโยค)
- selfImpact: ผลที่เกิดขึ้นกับกลุ่มหมากฝ่ายเรา (1 ประโยค เช่น สร้างฐาน, เพิ่มลมหายใจ, เชื่อมหมาก)
- opponentImpact: ผลที่เกิดขึ้นกับคู่แข่ง (1 ประโยค เช่น ปิดล้อม, ขู่ตัด, บีบให้รับมือ)

You must respond ONLY with a valid JSON object matching this structure:
{
  "initiative": "Sente" | "Gote" | "Tenuki",
  "initiativeThai": "เซ็นเตะ (ได้จังหวะบุกก่อน)" | "โกเตะ (ต้องรับมือ)" | "เทนุกิ (สลับไปเล่นจุดใหญ่)",
  "evaluationTitle": "หัวข้อคำแนะนำสั้นๆ กระชับ (ไม่เกิน 15 คำ)",
  "tacticalAdvice": "คำอธิบายเชิงกลยุทธ์ 2-3 ประโยค ชี้จุดดี จุดรั่ว หรือสิ่งที่ควรระวังตามรูปหมากจริง",
  "keyConcept": "คติพจน์/หลักการหมากล้อมสั้นๆ ประจำตามินี้ เช่น 'เชื่อมต่อหมากสำคัญกว่ากิน 1 เม็ด'",
  "suggestedAction": "คำแนะนำการเดินตาถัดไป เช่น 'เดินเม็ด D16 เพื่อยึดมุมและรักษาความหนาแน่น'",
  "opponentMoveIntent": "วิเคราะห์เจตนาของหมากคู่แข่งตาที่เพิ่งเดินสั้นๆ 1 ประโยค เช่น 'คู่แข่งเดิน D4 เพื่อตั้งฐานมุมและเล็งเปิดพื้นที่ปีกขวา'",
  "suggestedMoveCategory": "attack" | "defense" | "solid" | "tenuki",
  "suggestedMoveCategoryThai": "⚔️ รุก/บุก" | "🛡️ รับ/รอด" | "🏃 ถอย/หนาแน่น" | "⚡ ชิงจุดใหญ่",
  "candidateExplanations": [
    {
      "coord": "พิกัดหมาก เช่น D16",
      "rank": 1,
      "tagThai": "⭐ ทางเลือก 1: ดีที่สุด (Best)",
      "purpose": "เดินเพื่อ...",
      "selfImpact": "ช่วยให้กลุ่มเรา...",
      "opponentImpact": "บีบให้คู่แข่ง..."
    }
  ]
}`;
}

/**
 * Formats user prompt with detailed board metrics
 */
export function buildCoachUserPrompt(req: CoachAdviceRequest): string {
  const isPlayerBlack = req.playerColor === 'B';
  const playerWinrate = isPlayerBlack ? req.winrate : Math.round((100 - req.winrate) * 10) / 10;
  const playerScoreLead = isPlayerBlack ? req.scoreLead : -req.scoreLead;

  const isLastMoveOpponent = req.lastMove ? req.lastMove.color !== req.playerColor : false;
  const lastMoveDesc = req.lastMove
    ? `เม็ดล่าสุด: ฝ่าย${req.lastMove.color === 'B' ? 'ดำ' : 'ขาว'}${isLastMoveOpponent ? ' (คู่แข่ง)' : ' (ผู้เรียน)'} เล่นพิกัด ${req.lastMove.coord}`
    : 'เริ่มต้นเกมใหม่ (ยังไม่มีการวางหมาก)';

  const bestMoveDesc = req.bestSuggestedMove
    ? `KataGo แนะนำพิกัด: ${req.bestSuggestedMove.coord} (โอกาสชนะ ${req.bestSuggestedMove.winrate}%, แต้มนำ ${req.bestSuggestedMove.scoreLead} แต้ม)`
    : 'ไม่มีเม็ดแนะนำเฉพาะเจาะจง';

  const candidateList = req.candidates && req.candidates.length > 0
    ? req.candidates.map((c, i) => `  ${i + 1}. พิกัด ${c.coord}: โอกาสชนะ ${c.winrate}%, แต้มนำ ${c.scoreLead >= 0 ? `+${c.scoreLead}` : c.scoreLead} แต้ม${c.scoreLoss !== undefined ? `, เสียแต้ม ${c.scoreLoss}` : ''}`).join('\n')
    : bestMoveDesc;

  return `สถานะกระดานปัจจุบัน:
- ขนาดกระดาน: ${req.boardSize}x${req.boardSize}
- เม็ดที่: #${req.moveNumber}
- ${lastMoveDesc}
- ผู้เรียนเล่นเป็น: ฝ่าย${isPlayerBlack ? 'ดำ' : 'ขาว'} (ระดับเป้าหมาย: ${req.userRank || '1 Dan'})
- โอกาสชนะของผู้เรียน: ${playerWinrate}% (แต้มนำ: ${playerScoreLead >= 0 ? `+${playerScoreLead}` : `${playerScoreLead}`} แต้ม)
- KataGo ตัวเลือกหมากแนะนำ:
${candidateList}

โปรดวิเคราะห์สถานการณ์ ให้คำแนะนำอย่างมืออาชีพว่าผู้เรียนควรเล่นอย่างไรต่อ และแจกแจงคำอธิบายสำหรับทั้ง 3 ทางเลือก (purpose, selfImpact, opponentImpact) ตอบกลับเป็น JSON ภาษาไทยตามข้อกำหนดเท่านั้น`;
}

/**
 * Generates heuristic candidate explanations for offline or fallback operation
 */
export function generateFallbackCandidateExplanations(
  candidates?: Array<{ coord: string; rank: number; scoreLoss?: number; winrate: number; scoreLead: number }>
): CandidateExplanation[] {
  if (!candidates || candidates.length === 0) return [];

  return candidates.slice(0, 3).map((c, idx) => {
    const rank = idx + 1;
    if (rank === 1) {
      return {
        coord: c.coord,
        rank: 1,
        tagThai: '⭐ ทางเลือก 1: ดีที่สุด (Best)',
        purpose: `เดินยึดจุดยุทธศาสตร์ที่ ${c.coord} เพื่อรักษาจังหวะเซ็นเตะและสมดุลทั่วกระดาน`,
        selfImpact: 'กลุ่มหมากมีความมั่นคงสูงสุด ไม่เปิดจุดตัด และรักษาระดับแต้มนำไว้ได้อย่างมั่นคง',
        opponentImpact: 'จำกัดทิศทางการขยายพื้นที่ของคู่แข่ง และบีบให้คู่แข่งต้องระวังจุดเชื่อมต่อ',
      };
    }
    if (rank === 2) {
      return {
        coord: c.coord,
        rank: 2,
        tagThai: '🏃 ทางเลือก 2: เน้นหนาแน่น (Solid)',
        purpose: `เดินเสริมโครงสร้างที่ ${c.coord} เพื่อความปลอดภัยและหลีกเลี่ยงการปะทะที่เสี่ยงภัย`,
        selfImpact: 'เพิ่มความหนาแน่นและลมหายใจของกลุ่มหมาก ปิดจุดอ่อนจากการถูกรุกไล่',
        opponentImpact: 'ลดทอนอำนาจการบุกของคู่แข่ง ทำให้คู่แข่งไม่สามารถหาจังหวะเจาะพื้นที่ได้ง่าย',
      };
    }
    return {
      coord: c.coord,
      rank: 3,
      tagThai: '⚔️ ทางเลือก 3: บุกชิงแต้ม (Active)',
      purpose: `เปิดฉากชิงพื้นที่หรือเข้าปะทะที่ ${c.coord} เพื่อกดดันและเปลี่ยนทิศทางเกม`,
      selfImpact: 'อาจเปิดจุดตัดบางตำแหน่ง แต่ได้ผลตอบแทนเป็นพื้นที่หรืออิทธิพลภายนอก',
      opponentImpact: 'กดดันให้คู่แข่งต้องตัดสินใจรับมือทันที ซึ่งอาจบีบให้เกิดความผิดพลาด',
    };
  });
}

/**
 * Fallback 9-Dan Tactical Advisor
 * Used when GEMINI_API_KEY is not configured or in offline sandbox environments.
 */
export function generateFallbackCoachAdvice(req: CoachAdviceRequest): CoachAdviceResponse {
  const isPlayerBlack = req.playerColor === 'B';
  const playerWinrate = isPlayerBlack ? req.winrate : Math.round((100 - req.winrate) * 10) / 10;
  const playerScoreLead = isPlayerBlack ? req.scoreLead : -req.scoreLead;
  const bestCoord = req.bestSuggestedMove?.coord || 'จุดดาว (Star Point)';
  const isOpponentMove = req.lastMove ? req.lastMove.color !== req.playerColor : false;
  const candidateExplanations = generateFallbackCandidateExplanations(req.candidates);

  // Phase 1: Opening (Moves 0 - 15)
  if (req.moveNumber <= 15) {
    const isSente = req.moveNumber % 2 === 1;
    return {
      initiative: isSente ? 'Sente' : 'Gote',
      initiativeThai: isSente ? 'เซ็นเตะ (ได้จังหวะบุกก่อน)' : 'โกเตะ (ระวังจังหวะรับมือ)',
      evaluationTitle: 'ช่วงเปิดเกม (Fuseki) ให้ความสำคัญกับการครอบครองมุม',
      tacticalAdvice: `ในช่วงต้นเกม ควรรักษาทิศทางการเดินหมากจากมุม (Corner) สู่ริมกระดาน (Side) ตามหลักหมากล้อมสากล ไม่ควรรีบเข้าปะทะกลางกระดานเร็วเกินไป`,
      keyConcept: 'ยึดมุมได้แต้มเร็ว ริมกระดานสร้างทรง กลางกระดานลอยเคว้ง (Corner > Side > Center)',
      suggestedAction: `เดินที่ ${bestCoord} เพื่อสร้างฐานที่มั่นและเปิดทางขยายพื้นที่อย่างมั่นคง`,
      opponentMoveIntent: isOpponentMove
        ? `คู่แข่งเล่นที่ ${req.lastMove!.coord} เพื่อยึดโครงสร้างมุมหรือเล็งเปิดพื้นที่ปีกกระดาน`
        : req.lastMove
        ? `ผู้เรียนเพิ่งเดินที่ ${req.lastMove.coord} กำลังรอคู่แข่งตอบโต้`
        : 'เริ่มต้นการวางโครงสร้างกระดาน',
      suggestedMoveCategory: 'solid',
      suggestedMoveCategoryThai: TACTICAL_CATEGORY_LABELS.solid,
      candidateExplanations,
      isAiGenerated: false,
    };
  }

  // Phase 2: Middle Game (Moves 16 - 80)
  if (req.moveNumber <= 80) {
    if (playerWinrate >= 55) {
      return {
        initiative: 'Sente',
        initiativeThai: 'เซ็นเตะ (ฝ่ายได้เปรียบ คุมจังหวะ)',
        evaluationTitle: 'สถานการณ์ได้เปรียบ เดินเน้นความหนาแน่นเพื่อรักษารูปเกม',
        tacticalAdvice: `รูปเกมของคุณกำลังนำอยู่ +${playerScoreLead} แต้ม อย่ารีบเร่งบุกพื้นที่เสี่ยง เดินเน้นความหนาแน่นและเชื่อมต่อกลุ่มหมากให้แข็งแรงเพื่อไม่ให้คู่ต่อสู้หาจุดตัดหมากได้`,
        keyConcept: 'เมื่อนำอยู่จงเดินหมากหนาแน่น อย่าเปิดโอกาสให้เกิดศึกโคะที่ไม่จำเป็น',
        suggestedAction: `พิจารณาเดินที่ ${bestCoord} เพื่อเชื่อมต่อกลุ่มและจำกัดพื้นที่ฝ่ายตรงข้าม`,
        opponentMoveIntent: isOpponentMove
          ? `คู่แข่งเล่นที่ ${req.lastMove!.coord} พยายามหาจุดตัดหรือเจาะพื้นที่ที่ยังหลวมอยู่`
          : req.lastMove
          ? `ผู้เรียนเพิ่งเดินที่ ${req.lastMove.coord} เตรียมรับมือจังหวะถัดไป`
          : 'คู่แข่งพยายามสร้างจุดสู้',
        suggestedMoveCategory: 'solid',
        suggestedMoveCategoryThai: TACTICAL_CATEGORY_LABELS.solid,
        candidateExplanations,
        isAiGenerated: false,
      };
    } else {
      return {
        initiative: 'Gote',
        initiativeThai: 'โกเตะ (เป็นรอง ต้องมองหาจุดพลิกเกม)',
        evaluationTitle: 'ตรวจสอบลมหายใจของกลุ่มหมาก และมองหาจุดตัดของคู่ต่อสู้',
        tacticalAdvice: `สถานการณ์กำลังตามหลังเล็กน้อย ควรตรวจสอบว่ามีกลุ่มหมากใดที่เบ้าตายังไม่สมบูรณ์หรือไม่ จากนั้นมองหาการโจมตีกลุ่มหมากที่ลอยอยู่ของคู่แข่ง`,
        keyConcept: 'ดูแลกลุ่มอ่อนแอของตนเองก่อน จึงจะสามารถเปิดฉากโจมตีได้อย่างไร้กังวล',
        suggestedAction: `เดินที่ ${bestCoord} เพื่อรักษาฐานและชิงจังหวะกลับคืนมา`,
        opponentMoveIntent: isOpponentMove
          ? `คู่แข่งเดินที่ ${req.lastMove!.coord} เพื่อกดดันลมหายใจและบีบให้เรารับมือตามจังหวะ`
          : req.lastMove
          ? `ผู้เรียนเพิ่งเดินที่ ${req.lastMove.coord} กำลังจัดกลุ่มหมาก`
          : 'คู่แข่งคุมจังหวะการบุก',
        suggestedMoveCategory: 'defense',
        suggestedMoveCategoryThai: TACTICAL_CATEGORY_LABELS.defense,
        candidateExplanations,
        isAiGenerated: false,
      };
    }
  }

  // Phase 3: Late Game & Endgame (Yose)
  return {
    initiative: 'Tenuki',
    initiativeThai: 'เทนุกิ (เก็บแต้มริมกระดานจุดใหญ่สุด)',
    evaluationTitle: 'เข้าสู่ช่วงเกมจบ (Yose) ละเอียดทุกแต้มตามริมกระดาน',
    tacticalAdvice: `เข้าสู่ช่วงท้ายเกมแล้ว ให้คำนวณแต้มเซ็นเตะริมกระดาน (1st/2nd line) ที่มีมูลค่า 2-4 แต้มก่อนการเดินโกเตะธรรมดา`,
    keyConcept: 'ในเกมจบ แต้มเซ็นเตะเล็กๆ สะสมกันคือจุดชี้ขาดชัยชนะ',
    suggestedAction: `เก็บแต้มที่ ${bestCoord} เพื่อรักษาส่วนต่างคะแนน`,
    opponentMoveIntent: isOpponentMove
      ? `คู่แข่งเดินปิดพรมแดนพื้นที่ที่ ${req.lastMove!.coord} เพื่อรักษาแต้มขอบกระดาน`
      : req.lastMove
      ? `ผู้เรียนเพิ่งเก็บแต้มที่ ${req.lastMove.coord}`
      : 'คู่แข่งกำลังเก็บแต้มเกมจบ',
    suggestedMoveCategory: 'tenuki',
    suggestedMoveCategoryThai: TACTICAL_CATEGORY_LABELS.tenuki,
    candidateExplanations,
    isAiGenerated: false,
  };
}

/**
 * Invokes Google Gemini Flash API to generate structured coaching analysis
 */
export async function callGeminiFlashCoach(
  req: CoachAdviceRequest,
  apiKey?: string
): Promise<CoachAdviceResponse> {
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY;

  if (!resolvedKey) {
    // Graceful degradation when API key is not supplied
    return generateFallbackCoachAdvice(req);
  }

  const systemPrompt = buildCoachSystemPrompt();
  const userPrompt = buildCoachUserPrompt(req);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${resolvedKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500); // 8.5s timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return generateFallbackCoachAdvice(req);
    }

    const data = await res.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return generateFallbackCoachAdvice(req);
    }

    const parsed = JSON.parse(textOutput) as Partial<CoachAdviceResponse>;
    const fallback = generateFallbackCoachAdvice(req);
    const candidateExplanations = Array.isArray(parsed.candidateExplanations) && parsed.candidateExplanations.length > 0
      ? parsed.candidateExplanations
      : fallback.candidateExplanations;

    return {
      initiative: parsed.initiative || 'Sente',
      initiativeThai: parsed.initiativeThai || 'เซ็นเตะ (ได้จังหวะบุกก่อน)',
      evaluationTitle: parsed.evaluationTitle || 'คำแนะนำเชิงกลยุทธ์จากอาจารย์ 9 ดั้ง',
      tacticalAdvice: parsed.tacticalAdvice || fallback.tacticalAdvice,
      keyConcept: parsed.keyConcept || 'รักษาจังหวะและรูปทรงหมากให้มั่นคง',
      suggestedAction: parsed.suggestedAction || `เดินที่ ${req.bestSuggestedMove?.coord || 'จุดสำคัญ'}`,
      opponentMoveIntent: parsed.opponentMoveIntent || fallback.opponentMoveIntent,
      suggestedMoveCategory: parsed.suggestedMoveCategory || fallback.suggestedMoveCategory,
      suggestedMoveCategoryThai: parsed.suggestedMoveCategoryThai || fallback.suggestedMoveCategoryThai,
      candidateExplanations,
      isAiGenerated: true,
    };
  } catch {
    // On network failure or parsing exception, fallback safely
    return generateFallbackCoachAdvice(req);
  }
}
