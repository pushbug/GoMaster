import { BoardSize, GameState, Stone, BLACK } from '@/lib/go/types';
import { CandidateMoveEvaluation } from './types';

export interface BotResignEvaluationParams {
  botColor: Stone;
  analysisWinrate: number; // KataGo Black winrate (0 - 100)
  analysisScoreLead: number; // KataGo Black score lead (+ for Black, - for White)
  moveNumber: number;
  boardSize: BoardSize;
  hopelessTurnsCount: number; // Consecutive turns meeting hopeless criteria
}

export interface BotResignResult {
  shouldResign: boolean;
  reason: string | null;
  botWinrate: number;
  botScoreLead: number;
}

export interface BotPassEvaluationParams {
  botColor: Stone;
  gameState: GameState;
  suggestedMoves: CandidateMoveEvaluation[];
  analysisWinrate: number;
  analysisScoreLead: number;
  boardSize: BoardSize;
}

export interface BotPassResult {
  shouldPass: boolean;
  reason: string | null;
}

/**
 * Returns minimum move threshold to protect early fuseki / opening moves
 */
export function getMinMovesForResignation(boardSize: BoardSize): number {
  switch (boardSize) {
    case 9:
      return 15;
    case 13:
      return 25;
    case 19:
    default:
      return 40;
  }
}

/**
 * Returns deficit threshold by board size for hopeless determination
 */
export function getMaxDeficitThreshold(boardSize: BoardSize): number {
  switch (boardSize) {
    case 9:
      return 10.0;
    case 13:
      return 18.0;
    case 19:
    default:
      return 30.0;
  }
}

/**
 * Checks whether a single position is considered hopeless from the bot's perspective
 */
export function isPositionHopeless(
  botColor: Stone,
  analysisWinrate: number,
  analysisScoreLead: number,
  moveNumber: number,
  boardSize: BoardSize
): boolean {
  const minMoves = getMinMovesForResignation(boardSize);
  if (moveNumber < minMoves) {
    return false;
  }

  // Calculate metrics from bot's perspective
  const botWinrate = botColor === BLACK ? analysisWinrate : 100 - analysisWinrate;
  const botScoreLead = botColor === BLACK ? analysisScoreLead : -analysisScoreLead;
  const maxDeficit = getMaxDeficitThreshold(boardSize);

  // Criteria 1: Standard hopeless (winrate <= 3% AND deficit >= threshold)
  if (botWinrate <= 3.0 && botScoreLead <= -maxDeficit) {
    return true;
  }

  // Criteria 2: Extreme hopeless (winrate <= 1.0% AND deficit >= 75% of threshold)
  if (botWinrate <= 1.0 && botScoreLead <= -(maxDeficit * 0.75)) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether the bot should resign with hysteresis (requiring >= 2 consecutive hopeless turns)
 */
export function evaluateBotResignation(params: BotResignEvaluationParams): BotResignResult {
  const {
    botColor,
    analysisWinrate,
    analysisScoreLead,
    moveNumber,
    boardSize,
    hopelessTurnsCount,
  } = params;

  const botWinrate = botColor === BLACK ? analysisWinrate : 100 - analysisWinrate;
  const botScoreLead = botColor === BLACK ? analysisScoreLead : -analysisScoreLead;

  const hopeless = isPositionHopeless(
    botColor,
    analysisWinrate,
    analysisScoreLead,
    moveNumber,
    boardSize
  );

  // Require at least 2 consecutive hopeless turns to prevent resigning on search volatility
  if (hopeless && hopelessTurnsCount >= 2) {
    return {
      shouldResign: true,
      reason: `บอทยอมแพ้ (แต้มตามหลัง ${Math.abs(botScoreLead).toFixed(1)} แต้ม)`,
      botWinrate,
      botScoreLead,
    };
  }

  return {
    shouldResign: false,
    reason: null,
    botWinrate,
    botScoreLead,
  };
}

/**
 * Evaluates whether the bot should pass instead of placing a move
 */
export function evaluateBotPass(params: BotPassEvaluationParams): BotPassResult {
  const {
    botColor,
    gameState,
    suggestedMoves = [],
    analysisWinrate,
    analysisScoreLead,
    boardSize,
  } = params;

  // 1. If KataGo's top candidate is explicitly PASS
  if (suggestedMoves.length > 0) {
    const topMove = suggestedMoves[0];
    if (topMove.coord && topMove.coord.toUpperCase() === 'PASS') {
      return {
        shouldPass: true,
        reason: 'KataGo แนะนำให้ผ่านหมาก (รูปเกมยุติแล้ว)',
      };
    }
  }

  // 2. If opponent just passed (consecutivePasses === 1)
  if (gameState.consecutivePasses === 1) {
    const botWinrate = botColor === BLACK ? analysisWinrate : 100 - analysisWinrate;
    const botScoreLead = botColor === BLACK ? analysisScoreLead : -analysisScoreLead;
    const minEndgameMoves = boardSize === 9 ? 25 : boardSize === 13 ? 45 : 90;

    // 2a. Bot is safely leading in endgame -> accept pass to conclude game
    if (gameState.history.length >= minEndgameMoves && botWinrate >= 90.0 && botScoreLead > 0) {
      return {
        shouldPass: true,
        reason: 'คู่แข่งผ่านหมาก และบอทนำแต้มอย่างปลอดภัย จึงผ่านหมากจบเกม',
      };
    }

    // 2b. Candidates do not provide meaningful territory gain (all have scoreLoss or 0 gain)
    const hasProductiveMove = suggestedMoves.some(
      m => m.point && m.scoreLoss !== undefined && m.scoreLoss <= 1.0
    );
    if (!hasProductiveMove && gameState.history.length >= minEndgameMoves) {
      return {
        shouldPass: true,
        reason: 'ไม่มีจุดเดินที่เพิ่มแต้มในกระดาน จึงผ่านหมากจบเกม',
      };
    }
  }

  // 3. If no candidate moves are available at all
  if (suggestedMoves.length === 0) {
    return {
      shouldPass: true,
      reason: 'ไม่มีหมากแนะนำที่สามารถเดินได้',
    };
  }

  return {
    shouldPass: false,
    reason: null,
  };
}
