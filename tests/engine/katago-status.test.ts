import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { generateMockAnalysis, isValidModelFile, KataGoBridge } from '@/lib/engine/katago-bridge';
import { KataGoAnalysisQuery } from '@/lib/engine/types';

describe('KataGo Engine Auto-Detection & Tactical Heuristic (ENG-DETECT-01, ENG-SMART-01, ENG-STAT-01)', () => {
  it('ENG-DETECT-01: Engine status returns valid structure and mock/real indicator', () => {
    const bridge = KataGoBridge.getInstance();
    const status = bridge.getEngineStatus();

    expect(status).toBeDefined();
    expect(typeof status.isAvailable).toBe('boolean');
    expect(typeof status.isMock).toBe('boolean');
    expect(status.isMock).toBe(!status.isAvailable);
    // Paths are strings or null depending on whether KataGo binary exists
    if (status.binaryPath) {
      expect(typeof status.binaryPath).toBe('string');
    } else {
      expect(status.binaryPath).toBeNull();
    }

    if (status.modelPath) {
      expect(isValidModelFile(status.modelPath)).toBe(true);
    }
  });

  it('ENG-SMART-01: Smart tactical heuristic selects corner 4-4/3-4 on opening and rejects 1st-line (A19)', () => {
    const query: KataGoAnalysisQuery = {
      id: 'test_opening',
      moves: [],
      rules: 'japanese',
      komi: 6.5,
      boardXSize: 19,
      boardYSize: 19,
      maxVisits: 500,
    };

    const result = generateMockAnalysis(query);

    expect(result.suggestedMoves.length).toBeGreaterThan(0);
    const topMove = result.suggestedMoves[0];
    expect(topMove.point).not.toBeNull();
    const pt = topMove.point!;

    // Top move must not be on the 1st line (A19, A1, etc.)
    expect(pt.x).toBeGreaterThan(0);
    expect(pt.x).toBeLessThan(18);
    expect(pt.y).toBeGreaterThan(0);
    expect(pt.y).toBeLessThan(18);

    // Verify none of the candidates are 1st line (A19 is 0, 0)
    for (const move of result.suggestedMoves) {
      expect(move.coord).not.toBe('A19');
      expect(move.coord).not.toBe('A1');
      expect(move.coord).not.toBe('T19');
      expect(move.coord).not.toBe('T1');
    }

    // Opening moves should target 3rd or 4th lines (e.g. Q16, D16, D4, Q4, etc.)
    const distEdgeX = Math.min(pt.x, 19 - 1 - pt.x);
    const distEdgeY = Math.min(pt.y, 19 - 1 - pt.y);
    expect(distEdgeX).toBeGreaterThanOrEqual(2);
    expect(distEdgeY).toBeGreaterThanOrEqual(2);
  });

  it('ENG-SMART-01: Smart tactical heuristic detects Atari and prioritizes capture/escape', () => {
    // Setup a position where White stone at D4 (x:3, y:15) is in atari
    // Black played: D5 (x:3, y:14), E4 (x:4, y:15), D3 (x:3, y:16)
    // The only remaining liberty for White is C4 (x:2, y:15)
    const moves: [('B' | 'W'), string][] = [
      ['W', 'D4'],
      ['B', 'D5'],
      ['W', 'Q16'], // Tenuki away
      ['B', 'E4'],
      ['W', 'K10'], // Tenuki away
      ['B', 'D3'],
    ];

    // Current turn is White
    const whiteQuery: KataGoAnalysisQuery = {
      id: 'test_atari_defense',
      moves,
      rules: 'japanese',
      komi: 6.5,
      boardXSize: 19,
      boardYSize: 19,
      maxVisits: 500,
    };

    const whiteResult = generateMockAnalysis(whiteQuery);
    // White should identify C4 as an urgent rescue move
    const whiteCoords = whiteResult.suggestedMoves.map(m => m.coord);
    expect(whiteCoords).toContain('C4');

    // If it is Black's turn to move after White plays elsewhere:
    const blackQuery: KataGoAnalysisQuery = {
      id: 'test_atari_capture',
      moves: [...moves, ['W', 'Q4']],
      rules: 'japanese',
      komi: 6.5,
      boardXSize: 19,
      boardYSize: 19,
      maxVisits: 500,
    };

    const blackResult = generateMockAnalysis(blackQuery);
    // Black must capture at C4 as the #1 top suggested move
    expect(blackResult.suggestedMoves[0].coord).toBe('C4');
  });

  it('ENG-STAT-01: Generates valid territorial heatmap and realistic score lead', () => {
    const query: KataGoAnalysisQuery = {
      id: 'test_territory',
      moves: [
        ['B', 'Q16'],
        ['W', 'D4'],
        ['B', 'Q4'],
        ['W', 'D16'],
      ],
      rules: 'japanese',
      komi: 6.5,
      boardXSize: 19,
      boardYSize: 19,
      maxVisits: 500,
    };

    const result = generateMockAnalysis(query);

    // Heatmap grid is 19x19
    expect(result.ownershipGrid.length).toBe(19);
    expect(result.ownershipGrid[0].length).toBe(19);

    // Ownership values are between -1.0 and 1.0
    for (let y = 0; y < 19; y++) {
      for (let x = 0; x < 19; x++) {
        expect(result.ownershipGrid[y][x]).toBeGreaterThanOrEqual(-1.0);
        expect(result.ownershipGrid[y][x]).toBeLessThanOrEqual(1.0);
      }
    }

    // Winrate is clamped in realistic opening range (around 30-70%)
    expect(result.winrate).toBeGreaterThan(20);
    expect(result.winrate).toBeLessThan(80);
    expect(typeof result.scoreLead).toBe('number');
  });

  it('ENG-MODEL-01: Rejects models smaller than 1MB (e.g. XML AccessDenied error stubs)', () => {
    // Non-existent file
    expect(isValidModelFile('/path/to/nonexistent/model.bin.gz')).toBe(false);

    // Existing 111-byte corrupted model file in engine/models/
    const stubPath = path.join(process.cwd(), 'engine/models/kata1-b15c192-s1672170752-d466197061.bin.gz');
    if (fs.existsSync(stubPath) && fs.statSync(stubPath).size < 1024 * 1024) {
      expect(isValidModelFile(stubPath)).toBe(false);
    }
  });

  it('ENG-CFG-01: Analysis config includes numSearchThreads and valid threading keys', () => {
    const configPath = path.join(process.cwd(), 'engine/config/analysis.cfg');
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toMatch(/numAnalysisThreads\s*=/);
    expect(content).toMatch(/numSearchThreadsPerAnalysisThread\s*=/);
    expect(content).toMatch(/reportAnalysisWinratesAs\s*=/);
  });
});

