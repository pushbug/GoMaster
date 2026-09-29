import { getStarPoints, pointToString, stringToPoint } from '../go/board';
import { findGroup, getAdjacentPoints } from '../go/rules';
import {
  BLACK,
  BoardSize,
  EMPTY,
  PlayerColor,
  Point,
  Stone,
  WHITE,
} from '../go/types';
import {
  CandidateMoveEvaluation,
  EngineAnalysisResult,
  KataGoAnalysisQuery,
  KataGoColor,
} from './types';

/**
 * Smart Tactical Go Heuristic Engine
 * Evaluates board shapes, liberty defense/capture, and classic openings
 * to provide authentic Go moves when local KataGo binary is not installed.
 */
export function generateMockAnalysis(query: KataGoAnalysisQuery): EngineAnalysisResult {
  const { boardXSize, moves, komi } = query;
  const boardSize = boardXSize as BoardSize;
  const moveCount = moves.length;

  // 1. Reconstruct board state from moves
  const board: Stone[][] = [];
  for (let y = 0; y < boardSize; y++) {
    board.push(new Array(boardSize).fill(EMPTY));
  }

  let lastMovePoint: Point | null = null;
  for (const [color, coordStr] of moves) {
    if (coordStr.toLowerCase() === 'pass') continue;
    const pt = stringToPoint(coordStr, boardSize);
    if (pt && pt.x >= 0 && pt.x < boardSize && pt.y >= 0 && pt.y < boardSize) {
      board[pt.y][pt.x] = color === 'B' ? BLACK : WHITE;
      lastMovePoint = pt;
    }
  }

  // 2. Identify players
  const lastMoveColor = moveCount > 0 ? moves[moveCount - 1][0] : null;
  const currentPlayer: KataGoColor = lastMoveColor === 'B' ? 'W' : 'B';
  const myColor: PlayerColor = currentPlayer === 'B' ? BLACK : WHITE;
  const oppColor: PlayerColor = currentPlayer === 'B' ? WHITE : BLACK;

  // 3. Score potential candidate points with tactical Go principles
  interface ScoredCandidate {
    point: Point;
    score: number;
    reason: string;
  }

  const candidates: ScoredCandidate[] = [];

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== EMPTY) continue;

      const pt: Point = { x, y };
      const distEdge = Math.min(x, boardSize - 1 - x, y, boardSize - 1 - y);

      let score = 0;
      let reason = 'General';

      // Heavy penalty for 1st-line (edge) moves to prevent naive A19 blunders
      if (distEdge === 0) {
        score -= 200; // Strong aversion to 1-line in early/mid game
      } else if (distEdge === 1) {
        score -= (moveCount < 30 ? 40 : 10); // 2nd line penalty in opening
      } else if (distEdge === 2 || distEdge === 3) {
        score += 25; // 3rd and 4th lines: optimal territory and influence lines
      }

      // Check liberties of adjacent stones
      const neighbors = getAdjacentPoints(pt, boardSize);
      let canCaptureOpponent = false;
      let canRescueFriendly = false;

      for (const n of neighbors) {
        const neighborColor = board[n.y][n.x];
        if (neighborColor === oppColor) {
          const oppGroup = findGroup(board, n);
          if (oppGroup && oppGroup.liberties.length === 1) {
            // Priority 1: Direct capture of opponent stones in atari
            score += 150;
            canCaptureOpponent = true;
            reason = 'Atari Capture';
          }
        } else if (neighborColor === myColor) {
          const myGroup = findGroup(board, n);
          if (myGroup && myGroup.liberties.length === 1) {
            // Priority 2: Direct defense of friendly stones in atari
            score += 130;
            canRescueFriendly = true;
            reason = 'Atari Escape';
          } else if (myGroup && myGroup.liberties.length === 2) {
            // Priority 3: Reinforcing group with low liberties
            score += 35;
          }
        }
      }

      // Suicide prevention check: If placing stone has 0 liberties and doesn't capture, discard
      if (!canCaptureOpponent) {
        const hasFreeNeighbor = neighbors.some(n => board[n.y][n.x] === EMPTY);
        if (!hasFreeNeighbor) {
          // Check if any friendly neighbor has > 1 liberty
          const safeConnection = neighbors.some(n => {
            if (board[n.y][n.x] === myColor) {
              const grp = findGroup(board, n);
              return grp && grp.liberties.length > 1;
            }
            return false;
          });
          if (!safeConnection) {
            continue; // Suicide move, skip entirely
          }
        }
      }

      // Priority 4: Corner Openings (Hoshi 4-4 and Komoku 3-4) in early game
      if (moveCount < 16) {
        const cornerStars: Point[] = [
          { x: 3, y: 3 },
          { x: boardSize - 4, y: 3 },
          { x: 3, y: boardSize - 4 },
          { x: boardSize - 4, y: boardSize - 4 },
        ];
        if (cornerStars.some(cs => cs.x === x && cs.y === y)) {
          score += 75;
          reason = 'Corner 4-4';
        }

        // 3-4 Points (Komoku)
        const komokuPoints: Point[] = [
          { x: 2, y: 3 }, { x: 3, y: 2 },
          { x: boardSize - 3, y: 3 }, { x: boardSize - 4, y: 2 },
          { x: 2, y: boardSize - 4 }, { x: 3, y: boardSize - 3 },
          { x: boardSize - 3, y: boardSize - 4 }, { x: boardSize - 4, y: boardSize - 3 },
        ];
        if (komokuPoints.some(kp => kp.x === x && kp.y === y)) {
          score += 70;
          reason = 'Corner 3-4';
        }
      }

      // Priority 5: Side Extensions (3rd/4th line star & midpoints)
      if (distEdge === 3 || distEdge === 2) {
        const sideStars = getStarPoints(boardSize).filter(
          sp => (sp.x === 3 || sp.x === boardSize - 4 || sp.x === Math.floor(boardSize / 2)) &&
                (sp.y === 3 || sp.y === boardSize - 4 || sp.y === Math.floor(boardSize / 2))
        );
        if (sideStars.some(sp => sp.x === x && sp.y === y)) {
          score += 55;
          reason = 'Side/Star Point';
        }
      }

      // Priority 6: Response to opponent's last move (Hane / Extend / Kosumi)
      if (lastMovePoint && (distEdge >= 2 || canCaptureOpponent || canRescueFriendly)) {
        const manhattanDist = Math.abs(x - lastMovePoint.x) + Math.abs(y - lastMovePoint.y);
        if (manhattanDist === 1) {
          score += 40; // Adjacent contact
          reason = 'Contact Defense/Hane';
        } else if (manhattanDist === 2) {
          score += 35; // Diagonal / 1-space jump
          reason = 'Diagonal / Jump';
        } else if (manhattanDist === 3) {
          score += 25; // Knight's move approach
        }
      }

      candidates.push({ point: pt, score, reason });
    }
  }

  // Sort candidates by heuristic score descending
  candidates.sort((a, b) => b.score - a.score);

  // 4. Generate realistic territorial influence heatmap
  const ownershipGrid: number[][] = [];
  let totalBlackInfluence = 0;
  let totalWhiteInfluence = 0;

  for (let y = 0; y < boardSize; y++) {
    const row: number[] = [];
    for (let x = 0; x < boardSize; x++) {
      let influence = 0;
      for (let sy = 0; sy < boardSize; sy++) {
        for (let sx = 0; sx < boardSize; sx++) {
          const stone = board[sy][sx];
          if (stone !== EMPTY) {
            const d = Math.abs(x - sx) + Math.abs(y - sy);
            const weight = 1.0 / (1.0 + d * 0.9);
            if (stone === BLACK) {
              influence += weight;
            } else {
              influence -= weight;
            }
          }
        }
      }
      const clamped = Math.max(-1.0, Math.min(1.0, influence * 0.6));
      row.push(Math.round(clamped * 100) / 100);

      if (clamped > 0.2) totalBlackInfluence += clamped;
      if (clamped < -0.2) totalWhiteInfluence += Math.abs(clamped);
    }
    ownershipGrid.push(row);
  }

  // Estimate winrate and scoreLead from territorial influence
  const netInfluence = totalBlackInfluence - totalWhiteInfluence - (komi || 6.5) * 0.4;
  const baseBlackWinrate = Math.max(5, Math.min(95, Math.round((50 + netInfluence * 2.2) * 10) / 10));
  const baseBlackLead = Math.round((netInfluence * 0.8) * 10) / 10;

  // 5. Select top 3 candidate moves
  const topCandidates = candidates.slice(0, 3);
  const suggestedMoves: CandidateMoveEvaluation[] = topCandidates.map((cand, idx) => {
    const coord = pointToString(cand.point, boardSize);
    const loss = idx === 0 ? 0 : idx === 1 ? 0.6 : 1.8;
    const wr = Math.max(1, Math.min(99, baseBlackWinrate - idx * 2.8));

    return {
      point: cand.point,
      coord,
      winrate: Math.round(wr * 10) / 10,
      scoreLead: Math.round((baseBlackLead - loss) * 10) / 10,
      scoreLoss: loss,
      pv: [coord],
      visits: 600 - idx * 120,
      rank: idx + 1,
    };
  });

  return {
    id: query.id,
    boardSize,
    currentPlayer,
    winrate: baseBlackWinrate,
    scoreLead: baseBlackLead,
    scoreLoss: 0,
    ownershipGrid,
    suggestedMoves,
    isMock: true,
    timestamp: Date.now(),
  };
}
