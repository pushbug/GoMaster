'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameMode } from '@/components/go/GameModeSelector';
import { CoachAdviceResponse } from '@/lib/coach/gemini-coach';
import { getRankConfig, Rank, selectBotMove } from '@/lib/engine/difficulty';
import { EngineAnalysisResult } from '@/lib/engine/types';
import { pointToString } from '@/lib/go/board';
import { CandidateMove } from '@/lib/go/board-renderer';
import { createInitialGameState, playMove, undoMove } from '@/lib/go/rules';
import { exportToSgf } from '@/lib/go/sgf';
import { stoneSoundEngine } from '@/lib/go/sound';
import { BLACK, BoardSize, GameState, Point, WHITE } from '@/lib/go/types';
import {
  calculateAccuracy,
  MatchRecord,
  saveMatchRecord,
} from '@/lib/storage/match-history';

export interface UseGoGameOptions {
  initialBoardSize?: BoardSize;
  soundEnabled?: boolean;
}

export function useGoGame(options: UseGoGameOptions = {}) {
  const { initialBoardSize = 19, soundEnabled = true } = options;

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(initialBoardSize)
  );

  // AI & Game Mode Settings
  const [gameMode, setGameMode] = useState<GameMode>('vs-ai');
  const [selectedRank, setSelectedRank] = useState<Rank>('1D');
  const [playerColor, setPlayerColor] = useState<'B' | 'W'>('B');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Analysis State
  const [analysis, setAnalysis] = useState<EngineAnalysisResult | null>(null);
  const [playerLosses, setPlayerLosses] = useState<number[]>([]);
  const [winrateHistory, setWinrateHistory] = useState<number[]>([50]);
  const [scoreLeadHistory, setScoreLeadHistory] = useState<number[]>([0]);

  // AI Sensei Coach State
  const [coachAdvice, setCoachAdvice] = useState<CoachAdviceResponse | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);

  // Engine Status
  const [isEngineMock, setIsEngineMock] = useState<boolean>(true);

  // Refs for async bot execution safety
  const matchSavedRef = useRef<boolean>(false);
  const isAiThinkingRef = useRef<boolean>(false);

  // Check initial engine status
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
            playerColor,
            userRank: selectedRank,
          }),
        });

        if (res.ok) {
          const data: CoachAdviceResponse = await res.json();
          setCoachAdvice(data);
        }
      } catch {
        // Silently keep previous advice or fallback
      } finally {
        setIsCoachLoading(false);
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

  // Handle Play Move by User
  const handlePlayMove = async (point: Point) => {
    if (isAiThinkingRef.current) return;

    const result = playMove(gameState, point);
    if (!result.success) return;

    const nextState = result.state;
    setGameState(nextState);

    if (soundEnabled) {
      stoneSoundEngine.playStoneClick();
    }

    // In self-study mode, analyze position immediately.
    // In vs-ai mode, also trigger analysis for the player's move so the EvaluationBar updates immediately
    if (gameMode === 'self-study') {
      const evalResult = await requestAnalysis(nextState, selectedRank);
      if (evalResult) {
        setAnalysis(evalResult);
        setWinrateHistory(prev => [...prev, evalResult.winrate]);
        setScoreLeadHistory(prev => [...prev, evalResult.scoreLead]);
        requestCoachAdvice(nextState, evalResult);
      }
    } else {
      requestAnalysis(nextState, selectedRank).then(evalResult => {
        if (evalResult) {
          setAnalysis(evalResult);
          setWinrateHistory(prev => [...prev, evalResult.winrate]);
          setScoreLeadHistory(prev => [...prev, evalResult.scoreLead]);
          requestCoachAdvice(nextState, evalResult);
        }
      });
    }
  };

  // Bot Auto-Play Loop
  useEffect(() => {
    if (gameMode !== 'vs-ai' || gameState.isGameOver) return;

    const userColorNum = playerColor === 'B' ? BLACK : WHITE;
    const isBotTurn = gameState.turn !== userColorNum;

    if (!isBotTurn || isAiThinkingRef.current) return;

    let isEffectCancelled = false;

    const runBotTurn = async () => {
      isAiThinkingRef.current = true;
      setIsAiThinking(true);

      try {
        // Natural human-like thinking delay (400ms to 750ms)
        await new Promise(r => setTimeout(r, 450 + Math.random() * 300));
        if (isEffectCancelled) return;

        // 1. KataGo analysis for bot's move
        const botEval = await requestAnalysis(gameState, selectedRank);
        if (isEffectCancelled) return;

        if (botEval) {
          setAnalysis(botEval);
          setWinrateHistory(prev => [...prev, botEval.winrate]);
          setScoreLeadHistory(prev => [...prev, botEval.scoreLead]);
        }

        let nextState: GameState | null = null;

        if (botEval && botEval.suggestedMoves.length > 0) {
          const chosen = selectBotMove(botEval.suggestedMoves, selectedRank);
          const candidatesToTry = [
            chosen,
            ...botEval.suggestedMoves.filter(m => m !== chosen),
          ];

          for (const cand of candidatesToTry) {
            if (cand && cand.point) {
              const moveRes = playMove(gameState, cand.point);
              if (moveRes.success) {
                nextState = moveRes.state;
                break;
              }
            }
          }
        }

        // Fallback: If no candidate succeeded, scan for any legal board point
        if (!nextState) {
          for (let y = 0; y < gameState.boardSize; y++) {
            for (let x = 0; x < gameState.boardSize; x++) {
              if (gameState.board[y][x] === 0) {
                const res = playMove(gameState, { x, y });
                if (res.success) {
                  nextState = res.state;
                  break;
                }
              }
            }
            if (nextState) break;
          }
        }

        // Final fallback: Pass
        if (!nextState) {
          nextState = playMove(gameState, 'PASS').state;
        }

        if (soundEnabled && nextState.lastMove) {
          stoneSoundEngine.playStoneClick();
        }

        // Apply bot's move to board
        setGameState(nextState);

        // Record any score loss from bot if applicable
        if (botEval && botEval.scoreLoss > 0) {
          setPlayerLosses(prev => [...prev, botEval.scoreLoss]);
        }

        // Release AI thinking lock so player can immediately interact
        isAiThinkingRef.current = false;
        setIsAiThinking(false);

        // 2. Fetch analysis for the player's upcoming turn in background
        if (!nextState.isGameOver) {
          const playerEval = await requestAnalysis(nextState, selectedRank);
          if (!isEffectCancelled && playerEval) {
            setAnalysis(playerEval);
            setWinrateHistory(prev => [...prev, playerEval.winrate]);
            setScoreLeadHistory(prev => [...prev, playerEval.scoreLead]);
            requestCoachAdvice(nextState, playerEval);
          }
        }
      } catch {
        // Fallback pass on unexpected exception
        setGameState(prev => playMove(prev, 'PASS').state);
      } finally {
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
      }
    };

    runBotTurn();

    return () => {
      isEffectCancelled = true;
    };
  }, [
    gameState,
    gameMode,
    playerColor,
    selectedRank,
    soundEnabled,
    requestAnalysis,
    requestCoachAdvice,
  ]);

  // Handle Game Over: Save Match Record
  useEffect(() => {
    if (!gameState.isGameOver || matchSavedRef.current || gameMode !== 'vs-ai') {
      return;
    }

    matchSavedRef.current = true;
    const userColorNum = playerColor === 'B' ? BLACK : WHITE;
    const isUserWin = gameState.winner === userColorNum;
    const accuracy = calculateAccuracy(playerLosses);

    const record: MatchRecord = {
      id: `match_${Date.now()}`,
      date: new Date().toISOString(),
      boardSize: gameState.boardSize,
      playerColor,
      botRank: selectedRank,
      result: gameState.resignReason || (gameState.winner ? 'Game Complete' : 'Draw'),
      winner: gameState.winner === null ? 'Draw' : isUserWin ? 'Player' : 'AI',
      totalMoves: gameState.history.length,
      accuracyScore: accuracy,
      sgf: exportToSgf(
        gameState,
        playerColor === 'B' ? 'Player' : `KataGo (${selectedRank})`,
        playerColor === 'W' ? 'Player' : `KataGo (${selectedRank})`
      ),
      winrateHistory,
      scoreLeadHistory,
    };

    saveMatchRecord(record);
  }, [
    gameState,
    gameMode,
    playerColor,
    selectedRank,
    playerLosses,
    winrateHistory,
    scoreLeadHistory,
  ]);

  // Game Actions
  const handlePass = () => {
    if (isAiThinking || isAiThinkingRef.current) return;
    const result = playMove(gameState, 'PASS');
    if (result.success) setGameState(result.state);
  };

  const handleResign = () => {
    if (isAiThinking || isAiThinkingRef.current) return;
    const result = playMove(gameState, 'RESIGN');
    if (result.success) setGameState(result.state);
  };

  const handleUndo = () => {
    if (isAiThinking || isAiThinkingRef.current) return;
    // In vs-ai mode, undo 2 moves (both bot and player) to restore player's turn
    if (gameMode === 'vs-ai' && gameState.history.length >= 2) {
      setGameState(prev => undoMove(undoMove(prev)));
    } else {
      setGameState(prev => undoMove(prev));
    }
  };

  const handleReset = (size?: BoardSize) => {
    matchSavedRef.current = false;
    isAiThinkingRef.current = false;
    setIsAiThinking(false);
    setGameState(createInitialGameState(size || gameState.boardSize));
    setAnalysis(null);
    setCoachAdvice(null);
    setPlayerLosses([]);
    setWinrateHistory([50]);
    setScoreLeadHistory([0]);
  };

  const handleModeChange = (newMode: GameMode) => {
    if (newMode === gameMode) return;
    setGameMode(newMode);
    handleReset();
  };

  const handlePlayerColorChange = (newColor: 'B' | 'W') => {
    if (newColor === playerColor) return;
    setPlayerColor(newColor);
    handleReset();
  };

  // Convert suggested moves to Board overlay candidate format
  const candidateMoves: CandidateMove[] | null = analysis
    ? analysis.suggestedMoves
        .filter(m => m.point !== null)
        .map(m => ({
          point: m.point!,
          winrate: m.winrate,
          scoreLead: m.scoreLead,
          visits: m.visits,
          rank: m.rank,
        }))
    : null;

  return {
    gameState,
    setGameState,
    gameMode,
    setGameMode,
    selectedRank,
    setSelectedRank,
    playerColor,
    setPlayerColor,
    isAiThinking,
    analysis,
    candidateMoves,
    coachAdvice,
    isCoachLoading,
    isEngineMock,
    handlePlayMove,
    handlePass,
    handleResign,
    handleUndo,
    handleReset,
    handleModeChange,
    handlePlayerColorChange,
    requestCoachAdvice,
  };
}
