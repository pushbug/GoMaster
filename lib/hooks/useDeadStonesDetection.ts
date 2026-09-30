import { useEffect, useMemo, useState } from 'react';
import { EngineAnalysisResult } from '../engine/types';
import { DeadStonesSummary, summarizeDeadStones } from '../go/dead-stones';
import { GameState } from '../go/types';

export interface UseDeadStonesOptions {
  gameState: GameState;
  analysis: EngineAnalysisResult | null;
  isReviewing?: boolean;
  reviewStep?: number | null;
  historyLength?: number;
}

export interface UseDeadStonesReturn {
  deadStonesSummary: DeadStonesSummary | null;
  showDeadStones: boolean;
  setShowDeadStones: React.Dispatch<React.SetStateAction<boolean>>;
  toggleShowDeadStones: () => void;
  effectiveDeadStoneKeys: Set<string> | null;
  isVictoryModalOpen: boolean;
  setIsVictoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resetDeadStones: () => void;
}

/**
 * Custom hook isolating post-game dead stone detection, canvas highlight keys,
 * and VictoryModal presentation state.
 */
export function useDeadStonesDetection(options: UseDeadStonesOptions): UseDeadStonesReturn {
  const {
    gameState,
    analysis,
    isReviewing = false,
    reviewStep = null,
    historyLength = 0,
  } = options;

  const [showDeadStones, setShowDeadStones] = useState<boolean>(true);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);

  // Automatically open Victory Modal when game concludes
  useEffect(() => {
    if (gameState.isGameOver) {
      setIsVictoryModalOpen(true);
    }
  }, [gameState.isGameOver]);

  // Compute Dead Stones on Game Over using KataGo ownership polarity
  const deadStonesSummary = useMemo<DeadStonesSummary | null>(() => {
    if (!gameState.isGameOver || !analysis?.ownershipGrid) return null;
    return summarizeDeadStones(
      gameState.board,
      analysis.ownershipGrid,
      gameState.boardSize
    );
  }, [gameState.isGameOver, gameState.board, gameState.boardSize, analysis?.ownershipGrid]);

  // Effective dead stone keys for board canvas (hidden during historical move replay)
  const effectiveDeadStoneKeys = useMemo<Set<string> | null>(() => {
    if (!showDeadStones || !gameState.isGameOver || !deadStonesSummary) return null;
    if (isReviewing && reviewStep !== null && reviewStep !== historyLength - 1) {
      return null;
    }
    return deadStonesSummary.deadStoneKeys;
  }, [showDeadStones, gameState.isGameOver, deadStonesSummary, isReviewing, reviewStep, historyLength]);

  const resetDeadStones = () => {
    setIsVictoryModalOpen(false);
    setShowDeadStones(true);
  };

  const toggleShowDeadStones = () => {
    setShowDeadStones(prev => !prev);
  };

  return {
    deadStonesSummary,
    showDeadStones,
    setShowDeadStones,
    toggleShowDeadStones,
    effectiveDeadStoneKeys,
    isVictoryModalOpen,
    setIsVictoryModalOpen,
    resetDeadStones,
  };
}
