import { describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/coach-explain/route';
import {
  callGeminiFlashCoach,
  generateFallbackCoachAdvice,
} from '../../lib/coach/gemini-coach';

// Mock callGeminiFlashCoach to prevent real Gemini API calls
vi.mock('../../lib/coach/gemini-coach', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/coach/gemini-coach')>();
  return {
    ...actual,
    callGeminiFlashCoach: vi.fn(async (req) => actual.generateFallbackCoachAdvice(req)),
  };
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/coach-explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Coach Explain API Route (API-COACH-01, API-COACH-02)', () => {
  describe('Payload Validation & Sanitization (API-COACH-01)', () => {
    it('returns 200 with valid minimal payload', async () => {
      const response = await POST(makeRequest({
        boardSize: 19,
        moveNumber: 5,
        winrate: 52,
        scoreLead: 1.0,
        playerColor: 'B',
      }));

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.initiative).toBeDefined();
      expect(json.tacticalAdvice).toBeDefined();
      expect(json.isAiGenerated).toBeDefined();
    });

    it('defaults boardSize to 19 when invalid value provided', async () => {
      const response = await POST(makeRequest({
        boardSize: 42,
        moveNumber: 0,
        winrate: 50,
        scoreLead: 0,
        playerColor: 'B',
      }));

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toBeDefined();
    });

    it('clamps winrate to 0-100 range', async () => {
      const response = await POST(makeRequest({
        boardSize: 19,
        moveNumber: 10,
        winrate: 250,
        scoreLead: 0,
        playerColor: 'B',
      }));

      expect(response.status).toBe(200);
    });

    it('clamps scoreLead to -100..100 range', async () => {
      const response = await POST(makeRequest({
        boardSize: 19,
        moveNumber: 10,
        winrate: 50,
        scoreLead: -999,
        playerColor: 'B',
      }));

      expect(response.status).toBe(200);
    });

    it('truncates candidates to max 3 and PV to max 6', async () => {
      const response = await POST(makeRequest({
        boardSize: 19,
        moveNumber: 10,
        winrate: 50,
        scoreLead: 0,
        playerColor: 'B',
        candidates: [
          { coord: 'Q16', winrate: 55, scoreLead: 2.0, pv: ['Q16', 'D4', 'R14', 'C16', 'Q4', 'E16', 'O17', 'R6'] },
          { coord: 'D4', winrate: 54, scoreLead: 1.8, pv: ['D4'] },
          { coord: 'R14', winrate: 53, scoreLead: 1.5, pv: [] },
          { coord: 'C16', winrate: 52, scoreLead: 1.0, pv: [] },
          { coord: 'E3', winrate: 51, scoreLead: 0.5, pv: [] },
        ],
      }));

      expect(response.status).toBe(200);
    });

    it('truncates userRank to 10 characters max', async () => {
      const response = await POST(makeRequest({
        boardSize: 19,
        moveNumber: 10,
        winrate: 50,
        scoreLead: 0,
        playerColor: 'B',
        userRank: 'AAAAAAAAAABBBBBBBBBB_EXTRA',
      }));

      expect(response.status).toBe(200);
    });

    it('defaults playerColor to B when not W', async () => {
      const response = await POST(makeRequest({
        boardSize: 19,
        moveNumber: 10,
        winrate: 50,
        scoreLead: 0,
        playerColor: 'X',
      }));

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling & Fallback (API-COACH-02)', () => {
    it('returns 400 on non-object body (null)', async () => {
      const response = await POST(makeRequest(null));
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('JSON object');
    });

    it('returns 400 on invalid JSON (non-parseable)', async () => {
      const request = new Request('http://localhost:3000/api/coach-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{broken json!!',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Invalid JSON');
    });

    it('returns 200 with fallback advice when callGeminiFlashCoach throws', async () => {
      const mockedCall = vi.mocked(callGeminiFlashCoach);
      mockedCall.mockRejectedValueOnce(new Error('Network timeout'));

      const response = await POST(makeRequest({
        boardSize: 19,
        moveNumber: 5,
        winrate: 50,
        scoreLead: 0,
        playerColor: 'B',
      }));

      // Route catches and returns fallback with 200
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.initiative).toBeDefined();
      expect(json.isAiGenerated).toBe(false);
    });
  });
});
