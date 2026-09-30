import { NextResponse } from 'next/server';
import {
  callGeminiFlashCoach,
  CoachAdviceRequest,
  generateFallbackCoachAdvice,
} from '@/lib/coach/gemini-coach';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    const payload = body as Partial<CoachAdviceRequest>;

    // Sanitize and validate payload
    const boardSize = [9, 13, 19].includes(payload.boardSize as number)
      ? (payload.boardSize as number)
      : 19;

    const moveNumber = typeof payload.moveNumber === 'number' && payload.moveNumber >= 0
      ? Math.floor(payload.moveNumber)
      : 0;

    const winrate = typeof payload.winrate === 'number'
      ? Math.max(0, Math.min(100, payload.winrate))
      : 50.0;

    const scoreLead = typeof payload.scoreLead === 'number'
      ? Math.max(-100, Math.min(100, payload.scoreLead))
      : 0.0;

    const playerColor = payload.playerColor === 'W' ? 'W' : 'B';

    const lastMove = payload.lastMove && typeof payload.lastMove.coord === 'string'
      ? {
          color: payload.lastMove.color === 'W' ? ('W' as const) : ('B' as const),
          coord: payload.lastMove.coord.slice(0, 5),
        }
      : null;

    const bestSuggestedMove = payload.bestSuggestedMove && typeof payload.bestSuggestedMove.coord === 'string'
      ? {
          coord: payload.bestSuggestedMove.coord.slice(0, 5),
          winrate: typeof payload.bestSuggestedMove.winrate === 'number' ? payload.bestSuggestedMove.winrate : 50,
          scoreLead: typeof payload.bestSuggestedMove.scoreLead === 'number' ? payload.bestSuggestedMove.scoreLead : 0,
        }
      : null;

    const userRank = typeof payload.userRank === 'string' ? payload.userRank.slice(0, 10) : '1D';

    const candidates = Array.isArray(payload.candidates)
      ? payload.candidates.slice(0, 3).map((c, idx) => ({
          coord: typeof c?.coord === 'string' ? c.coord.slice(0, 5) : '',
          winrate: typeof c?.winrate === 'number' ? Math.max(0, Math.min(100, c.winrate)) : 50,
          scoreLead: typeof c?.scoreLead === 'number' ? Math.max(-100, Math.min(100, c.scoreLead)) : 0,
          scoreLoss: typeof c?.scoreLoss === 'number' ? Math.max(0, Math.min(100, c.scoreLoss)) : 0,
          pv: Array.isArray(c?.pv) ? c.pv.slice(0, 6).map((p: unknown) => String(p).slice(0, 5)) : [],
          rank: idx + 1,
        })).filter(c => c.coord.length > 0)
      : undefined;

    const coachRequest: CoachAdviceRequest = {
      boardSize,
      moveNumber,
      lastMove,
      winrate,
      scoreLead,
      bestSuggestedMove,
      candidates,
      playerColor,
      userRank,
    };

    // Invoke Gemini Flash with fallback protection
    const advice = await callGeminiFlashCoach(coachRequest);

    return NextResponse.json(advice, { status: 200 });
  } catch (error) {
    const fallback = generateFallbackCoachAdvice({
      boardSize: 19,
      moveNumber: 0,
      lastMove: null,
      winrate: 50,
      scoreLead: 0,
      bestSuggestedMove: null,
      playerColor: 'B',
    });
    return NextResponse.json(fallback, { status: 200 });
  }
}
