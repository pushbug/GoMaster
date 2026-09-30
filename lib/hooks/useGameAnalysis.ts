import { useCallback, useEffect, useRef, useState } from 'react';
import { CoachAdviceResponse } from '../coach/gemini-coach';
import { getRankConfig, Rank } from '../engine/difficulty';
import { EngineAnalysisResult } from '../engine/types';
import { pointToString } from '../go/board';
import { BLACK, GameState } from '../go/types';

export interface UseGameAnalysisOptions {
  playerColor: 'B' | 'W';
  selectedRank: Rank;
}

export interface UseGameAnalysisReturn {
  analysis: EngineAnalysisResult | null;
  setAnalysis: React.Dispatch<React.SetStateAction<EngineAnalysisResult | null>>;
  isEngineMock: boolean;
  setIsEngineMock: React.Dispatch<React.SetStateAction<boolean>>;
  winrateHistory: number[];
  setWinrateHistory: React.Dispatch<React.SetStateAction<number[]>>;
  scoreLeadHistory: number[];
  setScoreLeadHistory: React.Dispatch<React.SetStateAction<number[]>>;
  coachAdvice: CoachAdviceResponse | null;
  setCoachAdvice: React.Dispatch<React.SetStateAction<CoachAdviceResponse | null>>;
  isCoachLoading: boolean;
  setIsCoachLoading: React.Dispatch<React.SetStateAction<boolean>>;
  previewCandidateCoord: string | null;
  setPreviewCandidateCoord: React.Dispatch<React.SetStateAction<string | null>>;
  previewPvCoords: string[] | null;
  setPreviewPvCoords: React.Dispatch<React.SetStateAction<string[] | null>>;
  analysisSeqRef: React.RefObject<number>;
  coachSeqRef: React.RefObject<number>;
  requestAnalysis: (state: GameState, rank: Rank) => Promise<EngineAnalysisResult | null>;
  requestCoachAdvice: (state: GameState, analysisResult: EngineAnalysisResult | null) => Promise<void>;
  resetAnalysis: () => void;
  invalidateInflightAnalysis: () => void;
}

/**
 * Custom hook managing KataGo engine analysis fetching, Gemini coach feedback sequencing,
 * winrate/score-lead histories, and PV candidate preview states.
 */
export function useGameAnalysis(options: UseGameAnalysisOptions): UseGameAnalysisReturn {
  const { playerColor, selectedRank } = options;

  const [analysis, setAnalysis] = useState<EngineAnalysisResult | null>(null);
  const [isEngineMock, setIsEngineMock] = useState<boolean>(false);
  const [winrateHistory, setWinrateHistory] = useState<number[]>([50]);
  const [scoreLeadHistory, setScoreLeadHistory] = useState<number[]>([0]);
  const [coachAdvice, setCoachAdvice] = useState<CoachAdviceResponse | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);
  const [previewCandidateCoord, setPreviewCandidateCoord] = useState<string | null>(null);
  const [previewPvCoords, setPreviewPvCoords] = useState<string[] | null>(null);

  const analysisSeqRef = useRef<number>(0);
  const coachSeqRef = useRef<number>(0);

  // Check initial engine status on mount
  useEffect(() => {
    fetch('/api/engine/status')
      .then(res => res.json())
      .then(data => {
        if (typeof data.isMock === 'boolean') {
          setIsEngineMock(data.isMock);
        }
      })
      .catch(() => setIsEngineMock(true));
  }, []);

  // Request AI Coach Advice
  const requestCoachAdvice = useCallback(
    async (state: GameState, analysisResult: EngineAnalysisResult | null) => {
      const seq = ++coachSeqRef.current;
      setIsCoachLoading(true);
      try {
        const lastMoveCoord = state.lastMove
          ? pointToString(state.lastMove, state.boardSize)
          : null;
        const lastMoveRecord = state.history[state.history.length - 1];

        const bestMove = analysisResult?.suggestedMoves[0]
          ? {
              coord: analysisResult.suggestedMoves[0].coord,
              winrate: analysisResult.suggestedMoves[0].winrate,
              scoreLead: analysisResult.suggestedMoves[0].scoreLead,
            }
          : null;

        const candidatesPayload = analysisResult?.suggestedMoves
          ? analysisResult.suggestedMoves.map(m => ({
              coord: m.coord,
              winrate: m.winrate,
              scoreLead: m.scoreLead,
              scoreLoss: m.scoreLoss,
              pv: m.pv,
              rank: m.rank,
            }))
          : undefined;

        const res = await fetch('/api/coach-explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boardSize: state.boardSize,
            moveNumber: state.history.length,
            lastMove: lastMoveRecord
              ? {
                  color: lastMoveRecord.color === BLACK ? 'B' : 'W',
                  coord: lastMoveCoord || '',
                }
              : null,
            winrate: analysisResult?.winrate ?? 50.0,
            scoreLead: analysisResult?.scoreLead ?? 0.0,
            bestSuggestedMove: bestMove,
            candidates: candidatesPayload,
            playerColor,
            userRank: selectedRank,
          }),
        });

        if (res.ok && seq === coachSeqRef.current) {
          const data: CoachAdviceResponse = await res.json();
          setCoachAdvice(data);
        }
      } catch {
        // Silently keep previous advice or fallback
      } finally {
        if (seq === coachSeqRef.current) {
          setIsCoachLoading(false);
        }
      }
    },
    [playerColor, selectedRank]
  );

  // Analyze Board Position via KataGo API
  const requestAnalysis = useCallback(
    async (state: GameState, rank: Rank): Promise<EngineAnalysisResult | null> => {
      try {
        const movesPayload = state.history.map(m => ({
          color: m.color === BLACK ? ('B' as const) : ('W' as const),
          point: m.point,
        }));

        const rankConfig = getRankConfig(rank);

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boardSize: state.boardSize,
            moves: movesPayload,
            maxVisits: rankConfig.maxVisits,
          }),
        });

        if (!response.ok) return null;
        const result: EngineAnalysisResult = await response.json();
        if (typeof result.isMock === 'boolean') {
          setIsEngineMock(result.isMock);
        }
        return result;
      } catch {
        return null;
      }
    },
    []
  );

  const resetAnalysis = useCallback(() => {
    analysisSeqRef.current++;
    coachSeqRef.current++;
    setAnalysis(null);
    setCoachAdvice(null);
    setPreviewCandidateCoord(null);
    setPreviewPvCoords(null);
    setWinrateHistory([50]);
    setScoreLeadHistory([0]);
  }, []);

  const invalidateInflightAnalysis = useCallback(() => {
    analysisSeqRef.current++;
  }, []);

  return {
    analysis,
    setAnalysis,
    isEngineMock,
    setIsEngineMock,
    winrateHistory,
    setWinrateHistory,
    scoreLeadHistory,
    setScoreLeadHistory,
    coachAdvice,
    setCoachAdvice,
    isCoachLoading,
    setIsCoachLoading,
    previewCandidateCoord,
    setPreviewCandidateCoord,
    previewPvCoords,
    setPreviewPvCoords,
    analysisSeqRef,
    coachSeqRef,
    requestAnalysis,
    requestCoachAdvice,
    resetAnalysis,
    invalidateInflightAnalysis,
  };
}
