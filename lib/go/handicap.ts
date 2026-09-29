import { BoardSize, Point } from './types';

/**
 * Resolves standard Komi based on handicap stones
 */
export function resolveKomi(handicap: number, customKomi?: number): number {
  if (customKomi !== undefined) return customKomi;
  return handicap >= 2 ? 0.5 : 6.5;
}

/**
 * Standard Go handicap star point positions (0-indexed)
 */
export function getHandicapPoints(boardSize: BoardSize, handicap: number): Point[] {
  if (handicap < 2) return [];

  if (boardSize === 19) {
    const d = 3;
    const k = 9;
    const q = 15;
    const pts: Point[] = [
      { x: d, y: d }, // D4 (0)
      { x: q, y: q }, // Q16 (1)
      { x: q, y: d }, // Q4 (2)
      { x: d, y: q }, // D16 (3)
      { x: k, y: k }, // K10 Tengen (4)
      { x: d, y: k }, // D10 (5)
      { x: q, y: k }, // Q10 (6)
      { x: k, y: d }, // K4 (7)
      { x: k, y: q }, // K16 (8)
    ];

    if (handicap === 2) return [pts[0], pts[1]];
    if (handicap === 3) return [pts[0], pts[1], pts[2]];
    if (handicap === 4) return [pts[0], pts[1], pts[2], pts[3]];
    if (handicap === 5) return [pts[0], pts[1], pts[2], pts[3], pts[4]];
    if (handicap === 6) return [pts[0], pts[1], pts[2], pts[3], pts[5], pts[6]];
    if (handicap === 7) return [pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6]];
    if (handicap === 8) return [pts[0], pts[1], pts[2], pts[3], pts[5], pts[6], pts[7], pts[8]];
    return pts.slice(0, 9);
  }

  if (boardSize === 13) {
    const d = 3;
    const g = 6;
    const k = 9;
    const pts: Point[] = [
      { x: d, y: d }, // D4
      { x: k, y: k }, // K10
      { x: k, y: d }, // K4
      { x: d, y: k }, // D10
      { x: g, y: g }, // G7 (Tengen)
    ];
    return pts.slice(0, Math.min(handicap, 5));
  }

  if (boardSize === 9) {
    const c = 2;
    const e = 4;
    const g = 6;
    const pts: Point[] = [
      { x: c, y: c }, // C3
      { x: g, y: g }, // G7
      { x: g, y: c }, // G3
      { x: c, y: g }, // C7
      { x: e, y: e }, // E5 (Tengen)
    ];
    return pts.slice(0, Math.min(handicap, 5));
  }

  return [];
}
