import { BLACK, BoardSize, EMPTY, Point, Stone, WHITE } from './types';
import { getAdjacentPoints } from './rules';
import { pointToString } from './board';

export interface DeadStone {
  point: Point;
  color: typeof BLACK | typeof WHITE;
  coord: string;
  ownership: number;
}

export interface DeadDragon {
  id: string;
  color: typeof BLACK | typeof WHITE;
  stones: Point[];
  stoneCount: number;
  centerCoord: string;
  coords: string[];
  regionLabelThai: string;
}

export interface DeadStonesSummary {
  deadStones: DeadStone[];
  deadStoneKeys: Set<string>; // "x,y" keys for fast O(1) lookup
  whiteDeadCount: number;
  blackDeadCount: number;
  dragons: DeadDragon[];
  largestDeadDragon: DeadDragon | null;
  hasDeadStones: boolean;
}

/**
 * Maps average coordinates of a group to an intuitive Thai board region label
 */
export function getRegionLabelThai(point: Point, size: BoardSize): string {
  const third = size / 3;
  const isLeft = point.x < third;
  const isRight = point.x >= size - third;
  const isTop = point.y < third;
  const isBottom = point.y >= size - third;

  if (isTop && isLeft) return 'มุมซ้ายบน';
  if (isTop && isRight) return 'มุมขวาบน';
  if (isBottom && isLeft) return 'มุมซ้ายล่าง';
  if (isBottom && isRight) return 'มุมขวาล่าง';
  if (isTop) return 'ด้านบน';
  if (isBottom) return 'ด้านล่าง';
  if (isLeft) return 'ปีกซ้าย';
  if (isRight) return 'ปีกขวา';
  return 'กลางกระดาน';
}

/**
 * Identifies individual dead stones on the board using KataGo ownership grid polarity mismatch
 */
export function findDeadStones(
  board: Stone[][],
  ownershipGrid: number[][] | null | undefined,
  size: BoardSize,
  threshold = 0.55
): DeadStone[] {
  if (!ownershipGrid || ownershipGrid.length !== size) {
    return [];
  }

  const deadStones: DeadStone[] = [];

  for (let y = 0; y < size; y++) {
    const row = board[y];
    const ownRow = ownershipGrid[y];
    if (!row || !ownRow) continue;

    for (let x = 0; x < size; x++) {
      const stone = row[x];
      const own = ownRow[x] ?? 0;

      // White stone in Black-dominated territory (ownership >= threshold)
      if (stone === WHITE && own >= threshold) {
        deadStones.push({
          point: { x, y },
          color: WHITE,
          coord: pointToString({ x, y }, size),
          ownership: own,
        });
      }
      // Black stone in White-dominated territory (ownership <= -threshold)
      else if (stone === BLACK && own <= -threshold) {
        deadStones.push({
          point: { x, y },
          color: BLACK,
          coord: pointToString({ x, y }, size),
          ownership: own,
        });
      }
    }
  }

  return deadStones;
}

/**
 * Clusters connected dead stones of the same color into cohesive Dragon groups (Connected Components)
 */
export function clusterDeadDragons(
  deadStones: DeadStone[],
  size: BoardSize
): DeadDragon[] {
  if (deadStones.length === 0) return [];

  const deadMap = new Map<string, DeadStone>();
  for (const ds of deadStones) {
    deadMap.set(`${ds.point.x},${ds.point.y}`, ds);
  }

  const visited = new Set<string>();
  const dragons: DeadDragon[] = [];
  let dragonSeq = 1;

  for (const ds of deadStones) {
    const startKey = `${ds.point.x},${ds.point.y}`;
    if (visited.has(startKey)) continue;

    // BFS to find all connected stones of the same color that are dead
    const queue: DeadStone[] = [ds];
    visited.add(startKey);

    const clusterStones: Point[] = [];
    const clusterCoords: string[] = [];
    let sumX = 0;
    let sumY = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      clusterStones.push(current.point);
      clusterCoords.push(current.coord);
      sumX += current.point.x;
      sumY += current.point.y;

      const neighbors = getAdjacentPoints(current.point, size);
      for (const n of neighbors) {
        const neighborKey = `${n.x},${n.y}`;
        if (!visited.has(neighborKey) && deadMap.has(neighborKey)) {
          const neighborStone = deadMap.get(neighborKey)!;
          if (neighborStone.color === current.color) {
            visited.add(neighborKey);
            queue.push(neighborStone);
          }
        }
      }
    }

    const count = clusterStones.length;
    const avgPoint: Point = {
      x: Math.round(sumX / count),
      y: Math.round(sumY / count),
    };

    dragons.push({
      id: `dragon-${ds.color === WHITE ? 'W' : 'B'}-${dragonSeq++}`,
      color: ds.color,
      stones: clusterStones,
      stoneCount: count,
      centerCoord: pointToString(avgPoint, size),
      coords: clusterCoords,
      regionLabelThai: getRegionLabelThai(avgPoint, size),
    });
  }

  // Sort descending by stone count (largest dragon first)
  return dragons.sort((a, b) => b.stoneCount - a.stoneCount);
}

/**
 * Generates an aggregated summary of dead stones and dead dragon groups
 */
export function summarizeDeadStones(
  board: Stone[][],
  ownershipGrid: number[][] | null | undefined,
  size: BoardSize,
  threshold = 0.55
): DeadStonesSummary {
  const deadStones = findDeadStones(board, ownershipGrid, size, threshold);
  const deadStoneKeys = new Set(deadStones.map(s => `${s.point.x},${s.point.y}`));
  const dragons = clusterDeadDragons(deadStones, size);

  let whiteDeadCount = 0;
  let blackDeadCount = 0;

  for (const s of deadStones) {
    if (s.color === WHITE) whiteDeadCount++;
    else if (s.color === BLACK) blackDeadCount++;
  }

  return {
    deadStones,
    deadStoneKeys,
    whiteDeadCount,
    blackDeadCount,
    dragons,
    largestDeadDragon: dragons[0] || null,
    hasDeadStones: deadStones.length > 0,
  };
}
