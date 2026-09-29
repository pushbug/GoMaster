import { pointToString } from '../go/board';
import { BoardSize, Point } from '../go/types';
import { AnalyzeApiRequest, KataGoAnalysisQuery, KataGoMove } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedQuery?: KataGoAnalysisQuery;
}

const VALID_BOARD_SIZES: BoardSize[] = [9, 13, 19];
const MAX_ALLOWED_MOVES = 1000;
const MAX_ALLOWED_VISITS = 2000;
const MIN_ALLOWED_VISITS = 10;

/**
 * Validates and sanitizes client analysis request into a safe KataGo query
 */
export function validateAndSanitizeRequest(
  payload: unknown,
  queryId = `query_${Date.now()}`
): ValidationResult {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const req = payload as Partial<AnalyzeApiRequest>;

  // 1. Board Size validation
  const boardSize: BoardSize = req.boardSize ?? 19;
  if (!VALID_BOARD_SIZES.includes(boardSize)) {
    return {
      valid: false,
      error: `Invalid board size: ${boardSize}. Supported sizes are 9, 13, 19.`,
    };
  }

  // 2. Moves array validation
  if (!Array.isArray(req.moves)) {
    return { valid: false, error: 'Field "moves" must be an array' };
  }

  if (req.moves.length > MAX_ALLOWED_MOVES) {
    return {
      valid: false,
      error: `Move list exceeds maximum limit of ${MAX_ALLOWED_MOVES} moves.`,
    };
  }

  const sanitizedMoves: KataGoMove[] = [];

  for (let i = 0; i < req.moves.length; i++) {
    const moveItem = req.moves[i];
    if (!moveItem || typeof moveItem !== 'object') {
      return { valid: false, error: `Invalid move item at index ${i}` };
    }

    const color = moveItem.color?.toUpperCase();
    if (color !== 'B' && color !== 'W') {
      return {
        valid: false,
        error: `Invalid color at move index ${i}: "${moveItem.color}". Must be "B" or "W".`,
      };
    }

    if (moveItem.point === null || moveItem.point === undefined) {
      // Pass move
      sanitizedMoves.push([color, 'pass']);
    } else {
      const pt = moveItem.point as Point;
      if (
        typeof pt.x !== 'number' ||
        typeof pt.y !== 'number' ||
        !Number.isInteger(pt.x) ||
        !Number.isInteger(pt.y)
      ) {
        return { valid: false, error: `Coordinates at index ${i} must be integers` };
      }

      if (pt.x < 0 || pt.x >= boardSize || pt.y < 0 || pt.y >= boardSize) {
        return {
          valid: false,
          error: `Coordinates (${pt.x}, ${pt.y}) at index ${i} are outside ${boardSize}x${boardSize} bounds`,
        };
      }

      const coordStr = pointToString(pt, boardSize);
      sanitizedMoves.push([color, coordStr]);
    }
  }

  // 3. Rules & Komi validation
  const rules = req.rules === 'chinese' ? 'chinese' : 'japanese';
  const komi = typeof req.komi === 'number' && !isNaN(req.komi) && req.komi >= -50 && req.komi <= 50
    ? req.komi
    : rules === 'chinese' ? 7.5 : 6.5;

  // 4. Visits validation
  const maxVisits = typeof req.maxVisits === 'number' && Number.isInteger(req.maxVisits)
    ? Math.max(MIN_ALLOWED_VISITS, Math.min(MAX_ALLOWED_VISITS, req.maxVisits))
    : 500;

  const sanitizedQuery: KataGoAnalysisQuery = {
    id: queryId,
    moves: sanitizedMoves,
    rules,
    komi,
    boardXSize: boardSize,
    boardYSize: boardSize,
    maxVisits,
    includeOwnership: true,
    includePolicy: false,
  };

  return {
    valid: true,
    sanitizedQuery,
  };
}
