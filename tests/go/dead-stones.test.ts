import { describe, expect, it } from 'vitest';
import {
  clusterDeadDragons,
  findDeadStones,
  getRegionLabelThai,
  summarizeDeadStones,
} from '../../lib/go/dead-stones';
import { createEmptyBoard } from '../../lib/go/board';
import { BLACK, WHITE } from '../../lib/go/types';

describe('Dead Stone Detection & Dragon Clustering (DEAD-DETECT-01, DEAD-DRAGON-01)', () => {
  it('handles null, undefined, or empty ownership grids gracefully', () => {
    const board = createEmptyBoard(19);
    expect(findDeadStones(board, null, 19)).toEqual([]);
    expect(findDeadStones(board, undefined, 19)).toEqual([]);
    expect(findDeadStones(board, [], 19)).toEqual([]);

    const summary = summarizeDeadStones(board, null, 19);
    expect(summary.hasDeadStones).toBe(false);
    expect(summary.deadStones).toHaveLength(0);
    expect(summary.dragons).toHaveLength(0);
    expect(summary.largestDeadDragon).toBeNull();
  });

  it('detects dead white stones surrounded in Black territory (DEAD-DETECT-01)', () => {
    const size = 19;
    const board = createEmptyBoard(size);
    const ownership = Array.from({ length: size }, () => new Array(size).fill(0));

    // Place a White stone at (3, 3) = D16, where Black has 100% ownership (+1.0)
    board[3][3] = WHITE;
    ownership[3][3] = 0.95;

    // Place a living White stone at (15, 15) = Q4, where White has 100% ownership (-1.0)
    board[15][15] = WHITE;
    ownership[15][15] = -0.95;

    // Place a living Black stone at (3, 4), where Black has 100% ownership (+1.0)
    board[4][3] = BLACK;
    ownership[4][3] = 0.95;

    // Place an empty point with high ownership
    ownership[5][5] = 0.95;

    const dead = findDeadStones(board, ownership, size, 0.55);
    expect(dead).toHaveLength(1);
    expect(dead[0].point).toEqual({ x: 3, y: 3 });
    expect(dead[0].color).toBe(WHITE);
    expect(dead[0].coord).toBe('D16');
  });

  it('detects dead black stones surrounded in White territory (DEAD-DETECT-01)', () => {
    const size = 19;
    const board = createEmptyBoard(size);
    const ownership = Array.from({ length: size }, () => new Array(size).fill(0));

    // Place a Black stone at (16, 16) = R3, where White has 100% ownership (-0.9)
    board[16][16] = BLACK;
    ownership[16][16] = -0.9;

    const dead = findDeadStones(board, ownership, size, 0.55);
    expect(dead).toHaveLength(1);
    expect(dead[0].point).toEqual({ x: 16, y: 16 });
    expect(dead[0].color).toBe(BLACK);
    expect(dead[0].coord).toBe('R3');
  });

  it('respects threshold and ignores ambiguous/contested stones', () => {
    const size = 19;
    const board = createEmptyBoard(size);
    const ownership = Array.from({ length: size }, () => new Array(size).fill(0));

    // White stone with low ownership margin (0.35 < 0.55 threshold)
    board[10][10] = WHITE;
    ownership[10][10] = 0.35;

    const dead = findDeadStones(board, ownership, size, 0.55);
    expect(dead).toHaveLength(0);
  });

  it('clusters adjacent dead stones into a single Dead Dragon (DEAD-DRAGON-01)', () => {
    const size = 19;
    const board = createEmptyBoard(size);
    const ownership = Array.from({ length: size }, () => new Array(size).fill(0));

    // Place a connected 3-stone White group at (10, 10), (10, 11), (11, 10)
    board[10][10] = WHITE;
    ownership[10][10] = 0.85;

    board[11][10] = WHITE;
    ownership[11][10] = 0.90;

    board[10][11] = WHITE;
    ownership[10][11] = 0.88;

    // Disconnected single White stone at (2, 2)
    board[2][2] = WHITE;
    ownership[2][2] = 0.92;

    const summary = summarizeDeadStones(board, ownership, size, 0.55);
    expect(summary.hasDeadStones).toBe(true);
    expect(summary.whiteDeadCount).toBe(4);
    expect(summary.blackDeadCount).toBe(0);
    expect(summary.dragons).toHaveLength(2);

    // Largest dragon should be first
    const largest = summary.largestDeadDragon!;
    expect(largest).toBeDefined();
    expect(largest.stoneCount).toBe(3);
    expect(largest.color).toBe(WHITE);
    expect(summary.deadStoneKeys.has('10,10')).toBe(true);
    expect(summary.deadStoneKeys.has('10,11')).toBe(true);
    expect(summary.deadStoneKeys.has('11,10')).toBe(true);
    expect(summary.deadStoneKeys.has('2,2')).toBe(true);
    expect(summary.deadStoneKeys.has('0,0')).toBe(false);
  });

  it('maps average dragon point to natural Thai board region descriptions', () => {
    expect(getRegionLabelThai({ x: 1, y: 1 }, 19)).toBe('มุมซ้ายบน');
    expect(getRegionLabelThai({ x: 17, y: 1 }, 19)).toBe('มุมขวาบน');
    expect(getRegionLabelThai({ x: 1, y: 17 }, 19)).toBe('มุมซ้ายล่าง');
    expect(getRegionLabelThai({ x: 17, y: 17 }, 19)).toBe('มุมขวาล่าง');
    expect(getRegionLabelThai({ x: 9, y: 1 }, 19)).toBe('ด้านบน');
    expect(getRegionLabelThai({ x: 9, y: 17 }, 19)).toBe('ด้านล่าง');
    expect(getRegionLabelThai({ x: 1, y: 9 }, 19)).toBe('ปีกซ้าย');
    expect(getRegionLabelThai({ x: 17, y: 9 }, 19)).toBe('ปีกขวา');
    expect(getRegionLabelThai({ x: 9, y: 9 }, 19)).toBe('กลางกระดาน');
  });
});
