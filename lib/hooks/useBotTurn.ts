'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameMode } from '@/components/go/GameModeSelector';
import {
  evaluateBotPass,
  evaluateBotResignation,
  isPositionHopeless,
} from '../engine/bot-policy';
import { Rank, selectBotMove } from '../engine/difficulty';
import { EngineAnalysisResult } from '../engine/types';
import { playMove, resolveDualPassWinner } from '../go/rules';
import { stoneSoundEngine } from '../go/sound';
import { BLACK, GameState, WHITE } from '../go/types';

export interface UseBotTurnOptions {
  gameMode: GameMode;
  gameState: GameState;
  playerColor: 'B' | 'W';
  selectedRank: Rank;
  soundEnabled: boolean;
  requestAnalysis: (state: GameState, rank: Rank) => Promise<EngineAnalysisResult | null>;
  requestCoachAdvice: (state: GameState, analysisResult: EngineAnalysisResult | null) => Promise<void>;
  onBotMove: (nextState: GameState, scoreLoss?: number) => void;
  onRecordHistoryEvaluation?: (winrate: number, scoreLead: number) => void;
  onPlayerTurnAnalysis?: (evalResult: EngineAnalysisResult) => void;
  zenMode?: boolean;
}

export interface UseBotTurnReturn {
  isAiThinking: boolean;
  isAiThinkingRef: React.RefObject<boolean>;
  botTurnSeqRef: React.RefObject<number>;
  botHopelessTurnsRef: React.RefObject<number>;
  resetBotTurn: () => void;
}

/**
 * Custom hook encapsulating the Bot AI auto-play loop, thinking delay,
 * resignation/pass policies, and post-move player analysis trigger.
 */
export function useBotTurn(options: UseBotTurnOptions): UseBotTurnReturn {
  const {
    gameMode,
    gameState,
    playerColor,
    selectedRank,
    soundEnabled,
    requestAnalysis,
    requestCoachAdvice,
    onBotMove,
    onRecordHistoryEvaluation,
    onPlayerTurnAnalysis,
    zenMode = false,
  } = options;

  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const isAiThinkingRef = useRef<boolean>(false);
  const botTurnSeqRef = useRef<number>(0);
  const botHopelessTurnsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetBotTurn = useCallback(() => {
    botTurnSeqRef.current++;
    botHopelessTurnsRef.current = 0;
    isAiThinkingRef.current = false;
    setIsAiThinking(false);
  }, []);

  useEffect(() => {
    if (gameMode !== 'vs-ai' || gameState.isGameOver) return;

    const userColorNum = playerColor === 'B' ? BLACK : WHITE;
    const isBotTurn = gameState.turn !== userColorNum;

    if (!isBotTurn || isAiThinkingRef.current) return;

    const runBotTurn = async () => {
      const currentBotSeq = ++botTurnSeqRef.current;
      isAiThinkingRef.current = true;
      setIsAiThinking(true);

      try {
        // Natural human-like thinking delay (450ms to 750ms)
        await new Promise(r => setTimeout(r, 450 + Math.random() * 300));
        if (currentBotSeq !== botTurnSeqRef.current || !isMountedRef.current) return;

        // 1. KataGo analysis for bot's move
        const botEval = await requestAnalysis(gameState, selectedRank);
        if (currentBotSeq !== botTurnSeqRef.current || !isMountedRef.current) return;

        // Record winrate & score lead from bot's position evaluation without overwriting player candidate moves
        if (botEval && onRecordHistoryEvaluation) {
          onRecordHistoryEvaluation(botEval.winrate, botEval.scoreLead);
        }

        const botColorNum = userColorNum === BLACK ? WHITE : BLACK;

        // Track consecutive hopeless turns
        if (botEval) {
          const hopeless = isPositionHopeless(
            botColorNum,
            botEval.winrate,
            botEval.scoreLead,
            gameState.history.length,
            gameState.boardSize
          );
          if (hopeless) {
            botHopelessTurnsRef.current++;
          } else {
            botHopelessTurnsRef.current = 0;
          }
        }

        // 1a. Bot Resignation Check (Resign when hopelessly trailing)
        if (botEval) {
          const resignDecision = evaluateBotResignation({
            botColor: botColorNum,
            analysisWinrate: botEval.winrate,
            analysisScoreLead: botEval.scoreLead,
            moveNumber: gameState.history.length,
            boardSize: gameState.boardSize,
            hopelessTurnsCount: botHopelessTurnsRef.current,
          });

          if (resignDecision.shouldResign) {
            const resignRes = playMove(gameState, 'RESIGN');
            if (resignRes.success) {
              const resignedState: GameState = {
                ...resignRes.state,
                resignReason: resignDecision.reason || 'บอทยอมแพ้ (แต้มขาดลอย)',
              };
              onBotMove(resignedState);
              isAiThinkingRef.current = false;
              setIsAiThinking(false);
              return;
            }
          }
        }

        // 1b. Bot Smart Pass Check (in endgame or when opponent passed)
        if (botEval) {
          const passDecision = evaluateBotPass({
            botColor: botColorNum,
            gameState,
            suggestedMoves: botEval.suggestedMoves,
            analysisWinrate: botEval.winrate,
            analysisScoreLead: botEval.scoreLead,
            boardSize: gameState.boardSize,
          });

          if (passDecision.shouldPass) {
            const passRes = playMove(gameState, 'PASS');
            if (passRes.success) {
              const finalState = resolveDualPassWinner(passRes.state, botEval.scoreLead);
              onBotMove(finalState);
              isAiThinkingRef.current = false;
              setIsAiThinking(false);
              return;
            }
          }
        }

        let nextState: GameState | null = null;

        if (botEval && botEval.suggestedMoves.length > 0) {
          const chosen = selectBotMove(botEval.suggestedMoves, selectedRank, gameState);
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

        // Fallback: If no candidate succeeded, PASS cleanly (never loop blindly across board)
        if (!nextState) {
          const passRes = playMove(gameState, 'PASS');
          nextState = resolveDualPassWinner(passRes.state, botEval?.scoreLead);
        }

        if (soundEnabled && nextState.lastMove) {
          stoneSoundEngine.playStoneClick();
        }

        // Apply bot's move to board
        onBotMove(nextState, botEval && botEval.scoreLoss > 0 ? botEval.scoreLoss : undefined);

        // 2. Fetch analysis for the player's upcoming turn in background
        if (!nextState.isGameOver) {
          const playerEval = await requestAnalysis(nextState, selectedRank);
          if (
            isMountedRef.current &&
            currentBotSeq === botTurnSeqRef.current &&
            playerEval
          ) {
            if (onPlayerTurnAnalysis) {
              onPlayerTurnAnalysis(playerEval);
            }
            if (!zenMode) {
              requestCoachAdvice(nextState, playerEval);
            }
          }
        }
      } catch {
        // Fallback pass on unexpected exception
        if (isMountedRef.current && currentBotSeq === botTurnSeqRef.current) {
          const fallbackPass = playMove(gameState, 'PASS');
          onBotMove(fallbackPass.state);
        }
      } finally {
        if (isMountedRef.current && currentBotSeq === botTurnSeqRef.current) {
          isAiThinkingRef.current = false;
          setIsAiThinking(false);
        }
      }
    };

    runBotTurn();
  }, [
    gameState,
    gameMode,
    playerColor,
    selectedRank,
    soundEnabled,
    requestAnalysis,
    requestCoachAdvice,
    onBotMove,
    onRecordHistoryEvaluation,
    onPlayerTurnAnalysis,
  ]);

  return {
    isAiThinking,
    isAiThinkingRef,
    botTurnSeqRef,
    botHopelessTurnsRef,
    resetBotTurn,
  };
}
