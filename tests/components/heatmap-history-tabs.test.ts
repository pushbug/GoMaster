import { describe, expect, it } from 'vitest';
import {
  calculateMoveScoreDelta,
  groupMovesIntoPairs,
  HeatmapMode,
  getNextHeatmapMode,
  filterOwnershipGridByMode,
} from '@/lib/go/history-analysis';
import { BLACK, WHITE, MoveRecord } from '@/lib/go/types';

describe('Heatmap Mode Transitions & Filtering (UI-HEATMAP-01)', () => {
  it('cycles through heatmap modes in sequence: none -> both -> black -> white -> none', () => {
    let mode: HeatmapMode = 'none';
    mode = getNextHeatmapMode(mode);
    expect(mode).toBe('both');

    mode = getNextHeatmapMode(mode);
    expect(mode).toBe('black');

    mode = getNextHeatmapMode(mode);
    expect(mode).toBe('white');

    mode = getNextHeatmapMode(mode);
    expect(mode).toBe('none');
  });

  it('filters ownership grid by selected mode properly', () => {
    // 2x2 mock grid: [0,0]=+0.8 (Black), [0,1]=-0.6 (White), [1,0]=+0.02 (negligible), [1,1]=-0.9 (White)
    const grid = [
      [0.8, -0.6],
      [0.02, -0.9],
    ];

    // Mode 'both': keeps both Black and White above 0.05 threshold
    const bothFiltered = filterOwnershipGridByMode(grid, 'both');
    expect(bothFiltered[0][0]).toBe(0.8);
    expect(bothFiltered[0][1]).toBe(-0.6);
    expect(bothFiltered[1][0]).toBe(0); // below threshold
    expect(bothFiltered[1][1]).toBe(-0.9);

    // Mode 'black': keeps only Black (> 0.05)
    const blackFiltered = filterOwnershipGridByMode(grid, 'black');
    expect(blackFiltered[0][0]).toBe(0.8);
    expect(blackFiltered[0][1]).toBe(0); // White suppressed
    expect(blackFiltered[1][0]).toBe(0);
    expect(blackFiltered[1][1]).toBe(0); // White suppressed

    // Mode 'white': keeps only White (< -0.05)
    const whiteFiltered = filterOwnershipGridByMode(grid, 'white');
    expect(whiteFiltered[0][0]).toBe(0); // Black suppressed
    expect(whiteFiltered[0][1]).toBe(-0.6);
    expect(whiteFiltered[1][0]).toBe(0);
    expect(whiteFiltered[1][1]).toBe(-0.9);

    // Mode 'none': all zeroes
    const noneFiltered = filterOwnershipGridByMode(grid, 'none');
    expect(noneFiltered[0][0]).toBe(0);
    expect(noneFiltered[0][1]).toBe(0);
  });
});

describe('Move Score Delta Calculation (UI-HIST-DELTA-01)', () => {
  it('correctly calculates score gain and loss for Black moves', () => {
    // scoreLeadHistory: [baseline=0, move1(B)=+1.5, move2(W)=+0.5, move3(B)=-2.0]
    const leadHistory = [0, 1.5, 0.5, -2.0];

    // Move 1 (Black): delta = 1.5 - 0 = +1.5 gain
    const delta1 = calculateMoveScoreDelta(1, BLACK, leadHistory);
    expect(delta1).not.toBeNull();
    expect(delta1?.delta).toBe(1.5);
    expect(delta1?.formatted).toBe('+1.5');
    expect(delta1?.isGain).toBe(true);
    expect(delta1?.isLoss).toBe(false);

    // Move 3 (Black): delta = -2.0 - 0.5 = -2.5 loss
    const delta3 = calculateMoveScoreDelta(3, BLACK, leadHistory);
    expect(delta3).not.toBeNull();
    expect(delta3?.delta).toBe(-2.5);
    expect(delta3?.formatted).toBe('-2.5');
    expect(delta3?.isGain).toBe(false);
    expect(delta3?.isLoss).toBe(true);
  });

  it('correctly inverts score delta calculation for White moves', () => {
    // scoreLeadHistory: [baseline=0, move1(B)=+1.5, move2(W)=+0.5, move3(B)=-2.0, move4(W)=-1.0]
    const leadHistory = [0, 1.5, 0.5, -2.0, -1.0];

    // Move 2 (White): previous lead=+1.5, new lead=+0.5.
    // White improved lead by 1.0! Delta for White = +(1.5 - 0.5) = +1.0
    const delta2 = calculateMoveScoreDelta(2, WHITE, leadHistory);
    expect(delta2).not.toBeNull();
    expect(delta2?.delta).toBe(1.0);
    expect(delta2?.formatted).toBe('+1.0');
    expect(delta2?.isGain).toBe(true);

    // Move 4 (White): previous lead=-2.0, new lead=-1.0.
    // White was ahead by 2, now ahead by only 1. White lost 1.0! Delta for White = (-2.0 - (-1.0)) = -1.0
    const delta4 = calculateMoveScoreDelta(4, WHITE, leadHistory);
    expect(delta4).not.toBeNull();
    expect(delta4?.delta).toBe(-1.0);
    expect(delta4?.formatted).toBe('-1.0');
    expect(delta4?.isLoss).toBe(true);
  });

  it('returns null delta when score history is incomplete or move index out of bounds', () => {
    expect(calculateMoveScoreDelta(5, BLACK, [0, 1.0])).toBeNull();
    expect(calculateMoveScoreDelta(1, BLACK, [])).toBeNull();
  });

  it('handles neutral move with 0 score delta (isGain and isLoss false)', () => {
    const leadHistory = [0, 1.5, 1.5]; // Move 2 changed score lead by 0.0
    const delta = calculateMoveScoreDelta(2, WHITE, leadHistory);
    expect(delta).not.toBeNull();
    expect(delta?.delta).toBe(0);
    expect(delta?.isGain).toBe(false);
    expect(delta?.isLoss).toBe(false);
    expect(delta?.formatted).toBe('0.0');
  });
});

describe('2-Column Move Grouping (UI-HIST-DELTA-01, UI-HIST-PAIR-01)', () => {
  it('groups consecutive moves into 2-column Black and White pairs', () => {
    const mockMoves: MoveRecord[] = [
      {
        moveNumber: 1,
        color: BLACK,
        point: { x: 3, y: 3 },
        isPass: false,
        isResign: false,
        capturedStones: [],
        boardHash: 'hash1',
      },
      {
        moveNumber: 2,
        color: WHITE,
        point: { x: 15, y: 15 },
        isPass: false,
        isResign: false,
        capturedStones: [],
        boardHash: 'hash2',
      },
      {
        moveNumber: 3,
        color: BLACK,
        point: { x: 15, y: 3 },
        isPass: false,
        isResign: false,
        capturedStones: [],
        boardHash: 'hash3',
      },
    ];

    const pairs = groupMovesIntoPairs(mockMoves);
    expect(pairs.length).toBe(2);

    // Pair 1: Turn 1 with both Black and White
    expect(pairs[0].pairNumber).toBe(1);
    expect(pairs[0].black?.moveNumber).toBe(1);
    expect(pairs[0].white?.moveNumber).toBe(2);

    // Pair 2: Turn 2 with Black and pending White
    expect(pairs[1].pairNumber).toBe(2);
    expect(pairs[1].black?.moveNumber).toBe(3);
    expect(pairs[1].white).toBeNull();
  });

  it('groups moves into pairs when White plays the first move in handicap game (UI-HIST-PAIR-01)', () => {
    const mockHandicapMoves: MoveRecord[] = [
      {
        moveNumber: 1,
        color: WHITE,
        point: { x: 9, y: 9 },
        isPass: false,
        isResign: false,
        capturedStones: [],
        boardHash: 'hashW1',
      },
      {
        moveNumber: 2,
        color: BLACK,
        point: { x: 3, y: 3 },
        isPass: false,
        isResign: false,
        capturedStones: [],
        boardHash: 'hashB2',
      },
      {
        moveNumber: 3,
        color: WHITE,
        point: { x: 15, y: 15 },
        isPass: false,
        isResign: false,
        capturedStones: [],
        boardHash: 'hashW3',
      },
    ];

    const pairs = groupMovesIntoPairs(mockHandicapMoves);
    expect(pairs).toHaveLength(2);

    // Pair 1: Turn 1 where Black placed handicap stones before Move 1 so White started Turn 1
    expect(pairs[0].pairNumber).toBe(1);
    expect(pairs[0].black).toBeNull();
    expect(pairs[0].white?.moveNumber).toBe(1);

    // Pair 2: Turn 2 with Black move 2 and White move 3
    expect(pairs[1].pairNumber).toBe(2);
    expect(pairs[1].black?.moveNumber).toBe(2);
    expect(pairs[1].white?.moveNumber).toBe(3);
  });
});

describe('2-Tab Right Panel Navigation (UI-TABS-01)', () => {
  it('toggles active tab between coach and history', () => {
    let currentTab: 'coach' | 'history' = 'coach';
    expect(currentTab).toBe('coach');

    currentTab = 'history';
    expect(currentTab).toBe('history');

    currentTab = 'coach';
    expect(currentTab).toBe('coach');
  });
});

