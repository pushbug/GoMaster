import { describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/analyze/route';
import {
  generateMockAnalysis,
  KataGoBridge,
  parseKataGoRawResponse,
} from '../../lib/engine/katago-bridge';
import {
  KataGoAnalysisQuery,
  KataGoRawResponse,
} from '../../lib/engine/types';
import { validateAndSanitizeRequest } from '../../lib/engine/validator';

describe('KataGo Analysis Engine Bridge', () => {
  describe('Request Validation & Sanitization (ENG-VAL-01, ENG-JSON-01)', () => {
    it('generates a valid KataGo JSON query from client moves (ENG-JSON-01)', () => {
      const payload = {
        boardSize: 19,
        moves: [
          { color: 'B', point: { x: 15, y: 3 } }, // Q16
          { color: 'W', point: { x: 3, y: 15 } }, // D4
          { color: 'B', point: null }, // Pass
        ],
        rules: 'japanese',
        komi: 6.5,
        maxVisits: 600,
      };

      const result = validateAndSanitizeRequest(payload, 'test_q1');
      expect(result.valid).toBe(true);
      expect(result.sanitizedQuery).toBeDefined();

      const q = result.sanitizedQuery!;
      expect(q.id).toBe('test_q1');
      expect(q.boardXSize).toBe(19);
      expect(q.boardYSize).toBe(19);
      expect(q.rules).toBe('japanese');
      expect(q.komi).toBe(6.5);
      expect(q.maxVisits).toBe(600);
      expect(q.includeOwnership).toBe(true);
      expect(q.moves).toEqual([
        ['B', 'Q16'],
        ['W', 'D4'],
        ['B', 'pass'],
      ]);
    });

    it('rejects invalid board sizes and out-of-bounds coordinates (ENG-VAL-01)', () => {
      // 1. Invalid board size
      const resBadSize = validateAndSanitizeRequest({
        boardSize: 15,
        moves: [],
      });
      expect(resBadSize.valid).toBe(false);
      expect(resBadSize.error).toContain('Supported sizes are 9, 13, 19');

      // 2. Out of bounds coordinate
      const resOutOfBounds = validateAndSanitizeRequest({
        boardSize: 9,
        moves: [{ color: 'B', point: { x: 10, y: 4 } }],
      });
      expect(resOutOfBounds.valid).toBe(false);
      expect(resOutOfBounds.error).toContain('outside 9x9 bounds');

      // 3. Invalid color
      const resBadColor = validateAndSanitizeRequest({
        boardSize: 19,
        moves: [{ color: 'X', point: { x: 3, y: 3 } }],
      });
      expect(resBadColor.valid).toBe(false);
      expect(resBadColor.error).toContain('Must be "B" or "W"');
    });
  });

  describe('KataGo Raw Response Parsing (ENG-PARSE-01)', () => {
    it('correctly parses winrate, scoreLead, ownership grid, and suggested candidate moves', () => {
      // Fixture representing a raw KataGo JSON output line for 9x9
      const rawFixture: KataGoRawResponse = {
        id: 'query_123',
        isBase: true,
        turnNumber: 2,
        rootInfo: {
          currentPlayer: 'B',
          winrate: 0.625, // 62.5% for Black
          scoreLead: 2.8,  // +2.8 for Black
          visits: 500,
        },
        // 9x9 = 81 ownership values
        ownership: new Array(81).fill(0).map((_, i) => (i < 40 ? 0.8 : -0.7)),
        moveInfos: [
          {
            move: 'E5',
            visits: 350,
            winrate: 0.625,
            scoreLead: 2.8,
            pv: ['E5', 'E4', 'D5'],
            order: 0, // Best move
          },
          {
            move: 'D5',
            visits: 120,
            winrate: 0.58,
            scoreLead: 1.5,
            scoreLoss: 1.3,
            pv: ['D5', 'C4'],
            order: 1, // 2nd move
          },
        ],
      };

      const parsed = parseKataGoRawResponse(rawFixture, 9, false);

      expect(parsed.id).toBe('query_123');
      expect(parsed.boardSize).toBe(9);
      expect(parsed.currentPlayer).toBe('B');
      expect(parsed.winrate).toBe(62.5);
      expect(parsed.scoreLead).toBe(2.8);
      expect(parsed.isMock).toBe(false);

      // Verify 2D ownership grid dimensions
      expect(parsed.ownershipGrid.length).toBe(9);
      expect(parsed.ownershipGrid[0].length).toBe(9);
      expect(parsed.ownershipGrid[0][0]).toBe(0.8);

      // Verify candidate moves
      expect(parsed.suggestedMoves.length).toBe(2);
      expect(parsed.suggestedMoves[0].coord).toBe('E5');
      expect(parsed.suggestedMoves[0].rank).toBe(1);
      expect(parsed.suggestedMoves[0].scoreLoss).toBe(0);
      expect(parsed.suggestedMoves[1].coord).toBe('D5');
      expect(parsed.suggestedMoves[1].rank).toBe(2);
      expect(parsed.suggestedMoves[1].scoreLoss).toBe(1.3);
    });

    it('inverts perspective correctly when White is current player', () => {
      const rawWhiteFixture: KataGoRawResponse = {
        id: 'query_white',
        rootInfo: {
          currentPlayer: 'W',
          winrate: 0.70, // 70% for White -> 30% for Black
          scoreLead: 4.5, // White leads by 4.5 -> Black scoreLead = -4.5
          visits: 500,
        },
        moveInfos: [],
      };

      const parsed = parseKataGoRawResponse(rawWhiteFixture, 19, false);
      expect(parsed.currentPlayer).toBe('W');
      expect(parsed.winrate).toBe(30.0);
      expect(parsed.scoreLead).toBe(-4.5);
    });

    it('handles massive White lead scenario correctly without double inversion (ENG-PARSE-02)', () => {
      // KataGo configured with reportAnalysisWinratesAs = SIDETOMOVE reports White's perspective when currentPlayer is W
      const rawWhiteDominantFixture: KataGoRawResponse = {
        id: 'query_white_dom',
        rootInfo: {
          currentPlayer: 'W',
          winrate: 0.99, // 99% for White (e.g. White leads 240.7 vs 169.6)
          scoreLead: 71.1, // White leads by +71.1
          visits: 1000,
        },
        moveInfos: [
          {
            move: 'D9',
            visits: 800,
            winrate: 0.99, // 99% for White candidate move
            scoreLead: 71.1,
            scoreLoss: 0,
            pv: ['D9'],
            order: 0,
          },
        ],
      };

      const parsed = parseKataGoRawResponse(rawWhiteDominantFixture, 19, false);
      expect(parsed.currentPlayer).toBe('W');
      // Black winrate should be 1.0% (not 99.0%)
      expect(parsed.winrate).toBe(1.0);
      // Black scoreLead should be -71.1 (down by 71.1)
      expect(parsed.scoreLead).toBe(-71.1);
      // Candidate move winrate remains 99.0% for White's candidate badge
      expect(parsed.suggestedMoves[0].winrate).toBe(99.0);
    });

    it('inverts ownershipGrid polarity when currentPlayer is White (ENG-PARSE-03)', () => {
      // SIDETOMOVE: raw ownership +0.9 means White territory when currentPlayer is W
      // After inversion: +0.9 must become -0.9 (White), and -0.6 must become +0.6 (Black)
      const rawWhiteOwnership: KataGoRawResponse = {
        id: 'query_ownership_inv',
        rootInfo: {
          currentPlayer: 'W',
          winrate: 0.80,
          scoreLead: 15.0,
          visits: 500,
        },
        // 9x9 = 81 values: first 40 positive (White territory under SIDETOMOVE), last 41 negative (Black territory)
        ownership: new Array(81).fill(0).map((_, i) => (i < 40 ? 0.9 : -0.6)),
        moveInfos: [],
      };

      const parsed = parseKataGoRawResponse(rawWhiteOwnership, 9, false);

      // After inversion: raw +0.9 (White territory) → -0.9
      expect(parsed.ownershipGrid[0][0]).toBeCloseTo(-0.9, 2);
      // After inversion: raw -0.6 (Black territory) → +0.6
      expect(parsed.ownershipGrid[8][8]).toBeCloseTo(0.6, 2);

      // Verify Black-turn ownership is NOT inverted (control case)
      const rawBlackOwnership: KataGoRawResponse = {
        id: 'query_ownership_black',
        rootInfo: {
          currentPlayer: 'B',
          winrate: 0.60,
          scoreLead: 3.0,
          visits: 500,
        },
        ownership: new Array(81).fill(0).map((_, i) => (i < 40 ? 0.8 : -0.7)),
        moveInfos: [],
      };

      const parsedBlack = parseKataGoRawResponse(rawBlackOwnership, 9, false);
      // Black turn: raw values stay as-is (+0.8 = Black, -0.7 = White)
      expect(parsedBlack.ownershipGrid[0][0]).toBeCloseTo(0.8, 2);
      expect(parsedBlack.ownershipGrid[8][8]).toBeCloseTo(-0.7, 2);
    });
  });

  describe('Mock Fallback Engine (ENG-MOCK-01)', () => {
    it('returns high-fidelity deterministic analysis when KataGo binary is not found', () => {
      const mockQuery: KataGoAnalysisQuery = {
        id: 'mock_test',
        moves: [['B', 'Q16'], ['W', 'D4']],
        rules: 'japanese',
        komi: 6.5,
        boardXSize: 19,
        boardYSize: 19,
        maxVisits: 500,
      };

      const analysis = generateMockAnalysis(mockQuery);

      expect(analysis.isMock).toBe(true);
      expect(analysis.boardSize).toBe(19);
      expect(analysis.currentPlayer).toBe('B'); // Last move was W -> current is B
      expect(analysis.winrate).toBeGreaterThan(0);
      expect(analysis.winrate).toBeLessThan(100);

      // Verify ownership grid
      expect(analysis.ownershipGrid.length).toBe(19);
      expect(analysis.ownershipGrid[0].length).toBe(19);

      // Verify candidate moves
      expect(analysis.suggestedMoves.length).toBe(3);
      expect(analysis.suggestedMoves[0].rank).toBe(1);
      expect(analysis.suggestedMoves[0].scoreLoss).toBe(0);
      expect(analysis.suggestedMoves[0].pv.length).toBeGreaterThan(0);
    });
  });

  describe('API Route Handler (ENG-API-01)', () => {
    it('returns 200 with structured analysis on valid payload', async () => {
      const bridge = KataGoBridge.getInstance();
      const spy = vi.spyOn(bridge, 'analyze').mockImplementation(async (query) => {
        return generateMockAnalysis(query);
      });

      const request = new Request('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardSize: 19,
          moves: [{ color: 'B', point: { x: 3, y: 3 } }],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.boardSize).toBe(19);
      expect(json.suggestedMoves).toBeDefined();
      expect(json.ownershipGrid).toBeDefined();

      spy.mockRestore();
    });

    it('returns 400 Bad Request on invalid payload', async () => {
      const request = new Request('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardSize: 99, // Invalid size
          moves: [],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toContain('Invalid board size');
    });
  });
});
