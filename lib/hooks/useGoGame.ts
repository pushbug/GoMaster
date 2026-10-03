'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameMode } from '@/components/go/GameModeSelector';
import { Rank } from '@/lib/engine/difficulty';
import { EngineAnalysisResult } from '@/lib/engine/types';
import { getDisplayState } from '@/lib/go/replay';
import {
  createHandicapGameState,
  createInitialGameState,
  playMove,
  undoMove,
} from '@/lib/go/rules';
import { exportToSgf } from '@/lib/go/sgf';
import { stoneSoundEngine } from '@/lib/go/sound';
import { BLACK, BoardSize, GameState, Point, WHITE } from '@/lib/go/types';
import { calculateAccuracy, MatchRecord, saveMatchRecord } from '@/lib/storage/match-history';
import { useBotTurn } from './useBotTurn';
import { useDeadStonesDetection } from './useDeadStonesDetection';
import { useGameAnalysis } from './useGameAnalysis';
import { useReplayNavigation } from './useReplayNavigation';

export interface UseGoGameOptions {
  initialBoardSize?: BoardSize;
  soundEnabled?: boolean;
  zenMode?: boolean;
}

/**
 * Main coordinator hook composing game state, replay navigation,
 * KataGo analysis, Gemini coaching, and bot AI auto-play loop.
 */
export function useGoGame(options: UseGoGameOptions = {}) {
  const { initialBoardSize = 19, soundEnabled = true, zenMode = false } = options;

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(initialBoardSize)
  );

  // History Snapshots & Replay Navigation Sub-Hook
  const [historySnapshots, setHistorySnapshots] = useState<GameState[]>(() => [
    createInitialGameState(initialBoardSize),
  ]);

  const {
    reviewStep,
    setReviewStep,
    isReviewing,
    handleStepPrev,
    handleStepNext,
    handleStepFirst,
    handleStepLast,
    handleReturnToLive,
    handleSelectStep,
  } = useReplayNavigation({
    totalMoves: gameState.history.length,
    soundEnabled,
  });

  const displayGameState = getDisplayState(gameState, historySnapshots, reviewStep);

  // Game Mode & Player Preferences
  const [gameMode, setGameMode] = useState<GameMode>('vs-ai');
  const [selectedRank, setSelectedRank] = useState<Rank>('1D');
  const [playerColor, setPlayerColor] = useState<'B' | 'W'>('B');
  const [playerLosses, setPlayerLosses] = useState<number[]>([]);
  const matchSavedRef = useRef<boolean>(false);

  // Sub-Hook 1: KataGo Analysis & Gemini Coach Feedback
  const {
    analysis,
    setAnalysis,
    isEngineMock,
    winrateHistory,
    setWinrateHistory,
    scoreLeadHistory,
    setScoreLeadHistory,
    coachAdvice,
    setCoachAdvice,
    isCoachLoading,
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
  } = useGameAnalysis({
    playerColor,
    selectedRank,
  });

  // Sub-Hook 2: Dead Stones Detection & Post-Match Victory Modal
  const {
    deadStonesSummary,
    showDeadStones,
    setShowDeadStones,
    toggleShowDeadStones,
    effectiveDeadStoneKeys,
    isVictoryModalOpen,
    setIsVictoryModalOpen,
    resetDeadStones,
  } = useDeadStonesDetection({
    gameState,
    analysis,
    isReviewing,
    reviewStep,
    historyLength: historySnapshots.length,
  });

  // Callbacks for Bot AI Turn sub-hook
  const handleBotMove = useCallback((nextState: GameState, scoreLoss?: number) => {
    setGameState(nextState);
    setHistorySnapshots(prev => [...prev, nextState]);
    if (typeof scoreLoss === 'number' && scoreLoss > 0) {
      setPlayerLosses(prev => [...prev, scoreLoss]);
    }
  }, []);

  const handleRecordHistoryEvaluation = useCallback((winrate: number, scoreLead: number) => {
    setWinrateHistory(prev => [...prev, winrate]);
    setScoreLeadHistory(prev => [...prev, scoreLead]);
  }, [setWinrateHistory, setScoreLeadHistory]);

  const handlePlayerTurnAnalysis = useCallback((evalResult: EngineAnalysisResult) => {
    setAnalysis(evalResult);
    setWinrateHistory(prev => [...prev, evalResult.winrate]);
    setScoreLeadHistory(prev => [...prev, evalResult.scoreLead]);
  }, [setAnalysis, setWinrateHistory, setScoreLeadHistory]);

  // Sub-Hook 3: Bot AI Auto-Play Loop & Policies
  const {
    isAiThinking,
    isAiThinkingRef,
    resetBotTurn,
  } = useBotTurn({
    gameMode,
    gameState,
    playerColor,
    selectedRank,
    soundEnabled,
    requestAnalysis,
    requestCoachAdvice,
    onBotMove: handleBotMove,
    onRecordHistoryEvaluation: handleRecordHistoryEvaluation,
    onPlayerTurnAnalysis: handlePlayerTurnAnalysis,
    zenMode,
  });

  // User Move Action
  const handlePlayMove = async (point: Point) => {
    if (isAiThinkingRef.current) return;
    if (isReviewing) return;

    const result = playMove(gameState, point);
    if (!result.success) return;

    const nextState = result.state;
    setGameState(nextState);
    setHistorySnapshots(prev => [...prev, nextState]);

    if (soundEnabled) {
      stoneSoundEngine.playStoneClick();
    }

    if (gameMode === 'self-study') {
      const seq = ++analysisSeqRef.current;
      const evalResult = await requestAnalysis(nextState, selectedRank);
      if (seq === analysisSeqRef.current && evalResult) {
        setAnalysis(evalResult);
        setWinrateHistory(prev => [...prev, evalResult.winrate]);
        setScoreLeadHistory(prev => [...prev, evalResult.scoreLead]);
        if (!zenMode) {
          requestCoachAdvice(nextState, evalResult);
        }
      }
    } else {
      invalidateInflightAnalysis();
    }
  };

  // Handle Game Over: Save Match Record to localStorage
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

  // Game Control Actions
  const handlePass = () => {
    if (isAiThinking || isAiThinkingRef.current || isReviewing) return;
    const result = playMove(gameState, 'PASS');
    if (result.success) {
      let finalState = result.state;
      if (finalState.isGameOver && !finalState.winner && analysis) {
        const winnerColor =
          analysis.scoreLead > 0
            ? BLACK
            : analysis.scoreLead < 0
            ? WHITE
            : 'DRAW';
        finalState = {
          ...finalState,
          winner: winnerColor,
          resignReason: 'จบเกมด้วยการผ่านหมากทั้งสองฝ่าย',
        };
      }
      setGameState(finalState);
      setHistorySnapshots(prev => [...prev, finalState]);
    }
  };

  const handleResign = () => {
    if (isAiThinking || isAiThinkingRef.current || isReviewing) return;
    const result = playMove(gameState, 'RESIGN');
    if (result.success) {
      setGameState(result.state);
      setHistorySnapshots(prev => [...prev, result.state]);
    }
  };

  const handleUndo = () => {
    if (isAiThinking || isAiThinkingRef.current) return;
    resetBotTurn();
    const seq = ++analysisSeqRef.current;
    coachSeqRef.current++;
    const undoCount = gameMode === 'vs-ai' && gameState.history.length >= 2 ? 2 : 1;
    const targetIndex = Math.max(0, gameState.history.length - undoCount);

    let nextState: GameState;
    if (historySnapshots[targetIndex]) {
      nextState = historySnapshots[targetIndex];
    } else {
      nextState = undoMove(gameState, historySnapshots[0]);
    }

    setGameState(nextState);
    setHistorySnapshots(prev => prev.slice(0, targetIndex + 1));
    setReviewStep(null);

    // Refresh analysis for the restored position
    if (!nextState.isGameOver && nextState.history.length > 0) {
      requestAnalysis(nextState, selectedRank).then(evalResult => {
        if (seq === analysisSeqRef.current && evalResult) {
          setAnalysis(evalResult);
          if (!zenMode) {
            requestCoachAdvice(nextState, evalResult);
          }
        }
      });
    } else if (nextState.history.length === 0) {
      setAnalysis(null);
      setCoachAdvice(null);
    }
  };

  const handleReset = (size?: BoardSize, handicapPoints?: Point[]) => {
    matchSavedRef.current = false;
    resetBotTurn();
    resetAnalysis();
    resetDeadStones();
    setPlayerLosses([]);

    const targetSize = size || gameState.boardSize;
    const initial =
      handicapPoints && handicapPoints.length >= 2
        ? createHandicapGameState(targetSize, handicapPoints)
        : createInitialGameState(targetSize);

    setGameState(initial);
    setHistorySnapshots([initial]);
    setReviewStep(null);
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

  return {
    gameState,
    setGameState,
    displayGameState,
    reviewStep,
    setReviewStep,
    isReviewing,
    historySnapshots,
    handleStepPrev,
    handleStepNext,
    handleStepFirst,
    handleStepLast,
    handleReturnToLive,
    handleSelectStep,
    gameMode,
    setGameMode,
    selectedRank,
    setSelectedRank,
    playerColor,
    setPlayerColor,
    isAiThinking,
    analysis,
    scoreLeadHistory,
    winrateHistory,
    coachAdvice,
    isCoachLoading,
    previewCandidateCoord,
    setPreviewCandidateCoord,
    previewPvCoords,
    setPreviewPvCoords,
    isEngineMock,
    deadStonesSummary,
    showDeadStones,
    setShowDeadStones,
    toggleShowDeadStones,
    effectiveDeadStoneKeys,
    isVictoryModalOpen,
    setIsVictoryModalOpen,
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
