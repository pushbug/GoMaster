import { createInitialGameState, playMove } from './rules';
import { BLACK, BoardSize, GameState, Point, WHITE } from './types';

/**
 * Converts Point {x, y} to 2-letter SGF coordinate (e.g. {x:0, y:0} -> "aa")
 */
export function pointToSgf(point: Point | null): string {
  if (!point) return '';
  const xChar = String.fromCharCode('a'.charCodeAt(0) + point.x);
  const yChar = String.fromCharCode('a'.charCodeAt(0) + point.y);
  return `${xChar}${yChar}`;
}

/**
 * Converts 2-letter SGF coordinate to Point {x, y}
 */
export function sgfToPoint(sgfCoord: string, size: BoardSize): Point | null {
  if (!sgfCoord || sgfCoord.length !== 2) return null;
  // Handle pass in SGF (empty or 'tt' for 19x19)
  if (sgfCoord === 'tt' && size <= 19) return null;

  const x = sgfCoord.charCodeAt(0) - 'a'.charCodeAt(0);
  const y = sgfCoord.charCodeAt(1) - 'a'.charCodeAt(0);

  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return { x, y };
}

/**
 * Serializes a GameState history into standard SGF text
 */
export function exportToSgf(gameState: GameState, playerBlack = 'Black', playerWhite = 'White'): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  let sgf = `(;GM[1]FF[4]CA[UTF-8]AP[GoMaster:1.0]SZ[${gameState.boardSize}]KM[6.5]RU[Japanese]`;
  sgf += `PW[${playerWhite}]PB[${playerBlack}]DT[${dateStr}]\n`;

  for (const record of gameState.history) {
    const colorTag = record.color === BLACK ? 'B' : 'W';
    if (record.isResign) {
      // SGF does not record resign as a move, but in game result (RE)
      continue;
    }
    const coord = pointToSgf(record.point);
    sgf += `;${colorTag}[${coord}]`;
  }

  sgf += ')';
  return sgf;
}

/**
 * Parses an SGF string and replays it into a GameState
 */
export function importFromSgf(sgfContent: string): { success: boolean; state?: GameState; error?: string } {
  try {
    // Extract board size SZ[...] (default 19)
    const szMatch = sgfContent.match(/SZ\[(\d+)\]/i);
    const size: BoardSize = szMatch ? (parseInt(szMatch[1], 10) as BoardSize) : 19;

    if (size !== 9 && size !== 13 && size !== 19) {
      return { success: false, error: `Unsupported board size in SGF: ${size}` };
    }

    let state = createInitialGameState(size);

    // Regex to match move nodes like ;B[pd] or ;W[dp] or ;B[]
    const moveRegex = /;([BW])\[([a-z]{0,2})\]/gi;
    let match: RegExpExecArray | null;

    while ((match = moveRegex.exec(sgfContent)) !== null) {
      const colorChar = match[1].toUpperCase();
      const coordStr = match[2].toLowerCase();

      const expectedColor = colorChar === 'B' ? BLACK : WHITE;
      if (state.turn !== expectedColor) {
        // Handle consecutive moves of same color if present
        state.turn = expectedColor;
      }

      const point = sgfToPoint(coordStr, size);
      if (point === null) {
        // Pass
        const result = playMove(state, 'PASS');
        if (result.success) state = result.state;
      } else {
        const result = playMove(state, point);
        if (result.success) {
          state = result.state;
        } else {
          return { success: false, error: `Invalid SGF move at ${coordStr}: ${result.error}` };
        }
      }
    }

    return { success: true, state };
  } catch (err) {
    return { success: false, error: `Failed to parse SGF: ${String(err)}` };
  }
}
