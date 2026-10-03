'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface EvaluationBarProps {
  winrate: number; // 0 to 100% (Black win probability)
  scoreLead: number; // Positive = Black leads, Negative = White leads
  blackScore?: number;
  whiteScore?: number;
  ownershipGrid?: number[][] | null;
  captures?: { black: number; white: number };
  komi?: number;
  isThinking?: boolean;
  gameMode?: 'vs-ai' | 'self-study';
  playerColor?: 'B' | 'W';
  selectedRank?: string;
  userName?: string;
  turn?: number; // BLACK = 1, WHITE = -1
  moveNumber?: number;
  lastMoveText?: string | null;
  lastMoveColor?: number | null;
  isGameOver?: boolean;
  winner?: number | 'DRAW' | null;
  resignReason?: string | null;
  boardSize?: number;
  zenMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface PlayerIdentityResult {
  black: {
    name: string;
    isUser: boolean;
    badgeText: string;
  };
  white: {
    name: string;
    isUser: boolean;
    badgeText: string;
  };
}

/**
 * Maps game mode, player color, and bot rank to user-facing player identity badges
 */
export function getPlayerIdentityLabels(
  gameMode: 'vs-ai' | 'self-study' = 'vs-ai',
  playerColor: 'B' | 'W' = 'B',
  selectedRank: string = '1D',
  userName = 'คุณ'
): PlayerIdentityResult {
  if (gameMode === 'self-study') {
    return {
      black: { name: 'ผู้เล่น (ดำ)', isUser: true, badgeText: 'เล่น 2 ฝ่าย' },
      white: { name: 'ผู้เล่น (ขาว)', isUser: true, badgeText: 'เล่น 2 ฝ่าย' },
    };
  }

  const isUserBlack = playerColor === 'B';
  const aiName = `KataGo (${selectedRank})`;

  return {
    black: {
      name: isUserBlack ? userName : aiName,
      isUser: isUserBlack,
      badgeText: isUserBlack ? 'ผู้เล่น' : `AI ${selectedRank}`,
    },
    white: {
      name: !isUserBlack ? userName : aiName,
      isUser: !isUserBlack,
      badgeText: !isUserBlack ? 'ผู้เล่น' : `AI ${selectedRank}`,
    },
  };
}

/**
 * Calculates estimated territory and points for Black and White
 */
export function calculateEstimatedScores(
  ownershipGrid?: number[][] | null,
  scoreLead = 0,
  komi = 6.5,
  captures = { black: 0, white: 0 },
  boardSize = 19
): { blackScore: number; whiteScore: number } {
  if (ownershipGrid && ownershipGrid.length > 0) {
    let blackTerritory = 0;
    let whiteTerritory = 0;
    for (const row of ownershipGrid) {
      for (const val of row) {
        if (val > 0.2) blackTerritory += val;
        else if (val < -0.2) whiteTerritory += Math.abs(val);
      }
    }
    const bScore = Math.round((blackTerritory + captures.black) * 10) / 10;
    const wScore = Math.round((whiteTerritory + captures.white + komi) * 10) / 10;
    return { blackScore: bScore, whiteScore: wScore };
  }

  // Fallback calculation using scoreLead if ownershipGrid is not yet populated
  if (scoreLead !== 0) {
    const basePoints = Math.round(boardSize * boardSize * 0.1);
    const halfLead = scoreLead / 2;
    const bScore = Math.max(0, Math.round((basePoints + halfLead + captures.black) * 10) / 10);
    const wScore = Math.max(0, Math.round((basePoints - halfLead + captures.white + komi) * 10) / 10);
    return { blackScore: bScore, whiteScore: wScore };
  }

  return {
    blackScore: captures.black,
    whiteScore: Math.round((komi + captures.white) * 10) / 10,
  };
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  winrate,
  scoreLead,
  blackScore,
  whiteScore,
  ownershipGrid,
  captures = { black: 0, white: 0 },
  komi = 6.5,
  isThinking = false,
  gameMode = 'vs-ai',
  playerColor = 'B',
  selectedRank = '1D',
  userName = 'คุณ',
  turn = 1,
  moveNumber = 0,
  lastMoveText = null,
  lastMoveColor = null,
  isGameOver = false,
  winner = null,
  resignReason = null,
  boardSize = 19,
  zenMode = false,
  className = '',
  style,
}) => {
  // Clamp winrate between 1 and 99 for smooth visualization
  const clampedWinrate = Math.max(1, Math.min(99, Math.round(winrate * 10) / 10));
  const whiteWinrate = Math.round((100 - clampedWinrate) * 10) / 10;

  // Resolve scores
  const derivedScores = calculateEstimatedScores(ownershipGrid, scoreLead, komi, captures, boardSize);
  const displayBlackScore = blackScore !== undefined ? blackScore : derivedScores.blackScore;
  const displayWhiteScore = whiteScore !== undefined ? whiteScore : derivedScores.whiteScore;

  const isBlackTurn = turn === 1;
  const identity = getPlayerIdentityLabels(gameMode, playerColor, selectedRank, userName);

  return (
    <div
      className={`flex flex-col gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-zinc-900/95 border border-zinc-800 text-zinc-100 shadow-xl ${className}`}
      style={style}
      data-testid="eval-bar"
    >
      {/* 1. Top Meta Row: Turn Indicator, Move #, and Last Move */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80 text-sm">
        {/* Left: Active Turn Indicator or Winner */}
        <div className="flex items-center gap-2" data-testid="turn-indicator">
          {isGameOver ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-red-200 font-bold text-sm">
              <span>
                {winner === 'DRAW'
                  ? 'จบเกม: เสมอ (Draw)'
                  : `ผู้ชนะ: ${winner === 1 ? 'หมากดำ (Black)' : 'หมากขาว (White)'}`}
              </span>
              {resignReason && <span className="text-xs text-red-400 font-normal">({resignReason})</span>}
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-xl border transition-all ${
                isBlackTurn
                  ? 'bg-zinc-950/90 border-amber-500/70 shadow-sm shadow-amber-500/10'
                  : 'bg-zinc-800/80 border-amber-500/70 shadow-sm shadow-amber-500/10'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border shadow-sm ${
                  isBlackTurn
                    ? 'bg-zinc-950 border-zinc-500'
                    : 'bg-zinc-100 border-zinc-400'
                }`}
              />
              <span className="font-semibold text-sm text-zinc-100">
                ตาเดิน: {isBlackTurn ? 'หมากดำ (Black)' : 'หมากขาว (White)'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 text-zinc-400 font-mono text-xs">
            <span className="text-zinc-500">ตาที่</span>
            <strong className="text-amber-400 font-bold text-sm">#{moveNumber}</strong>
          </div>
        </div>

        {/* Center / Right: Thinking indicator & Last Move */}
        <div className="flex items-center gap-3">
          {isThinking && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังคำนวณ...</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1 rounded-lg border border-zinc-800">
            <span className="text-zinc-500">เม็ดล่าสุด:</span>
            {lastMoveText ? (
              <div className="flex items-center gap-1 font-mono font-bold text-sm text-zinc-200">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    lastMoveColor === -1 ? 'bg-zinc-200' : 'bg-zinc-900 border border-zinc-600'
                  }`}
                />
                <span>{lastMoveText}</span>
              </div>
            ) : (
              <span className="font-mono text-zinc-600">-</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Score & Player Identity Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-mono font-bold px-1">
        {/* Left: Black Player Identity, Points, Winrate & Black Captures */}
        <div className="flex items-center gap-2 text-zinc-100" data-testid="eval-black-score">
          <div className="flex items-center gap-1.5" data-testid="eval-player-black">
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-600 shadow-sm" />
            <span className="font-sans font-bold text-sm text-zinc-100">
              {identity.black.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-sans font-semibold border ${
                identity.black.isUser
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-mono'
              }`}
            >
              {identity.black.badgeText}
            </span>
          </div>
          <span className="text-zinc-600 font-normal">|</span>
          {!zenMode && (
            <>
              <span className="text-zinc-200 text-sm">
                <strong className="text-amber-400 font-bold">{displayBlackScore}</strong> แต้ม
              </span>
              <span className="text-zinc-400 text-xs">({clampedWinrate}%)</span>
            </>
          )}
          <span
            className="text-xs font-normal text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded-md border border-zinc-800"
            data-testid="counter-black-captures"
          >
            กิน: <strong className="text-zinc-200 font-bold">{captures.black}</strong>
          </span>
        </div>

        {/* Right: White Captures, Winrate, Points, White Player Identity */}
        <div className="flex items-center gap-2 text-zinc-100" data-testid="eval-white-score">
          <span
            className="text-xs font-normal text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded-md border border-zinc-800"
            data-testid="counter-white-captures"
          >
            กิน: <strong className="text-zinc-200 font-bold">{captures.white}</strong>
          </span>
          {!zenMode && (
            <>
              <span className="text-zinc-400 text-xs">({whiteWinrate}%)</span>
              <span className="text-zinc-200 text-sm">
                <strong className="text-zinc-100 font-bold">{displayWhiteScore}</strong> แต้ม
              </span>
              <span className="text-zinc-600 font-normal">|</span>
            </>
          )}
          <div className="flex items-center gap-1.5" data-testid="eval-player-white">
            <span
              className={`text-xs px-2 py-0.5 rounded font-sans font-semibold border ${
                identity.white.isUser
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-mono'
              }`}
            >
              {identity.white.badgeText}
            </span>
            <span className="font-sans font-bold text-sm text-zinc-100">
              {identity.white.name}
            </span>
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-100 border border-zinc-400 shadow-sm" />
          </div>
        </div>
      </div>

      {/* 3. Dual Bar Progress (Concealed in Zen Mode) */}
      {!zenMode && (
        <div className="relative h-3.5 w-full rounded-full overflow-hidden bg-zinc-950 border border-zinc-700/60 flex shadow-inner">
          {/* Black Share (Left) */}
          <div
            className="h-full bg-linear-to-r from-zinc-950 to-zinc-800 transition-all duration-500 ease-out flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-zinc-400"
            style={{ width: `${clampedWinrate}%` }}
          />
          {/* White Share (Right) */}
          <div
            className="h-full bg-linear-to-r from-zinc-200 to-zinc-50 transition-all duration-500 ease-out flex items-center pl-2 text-[10px] font-mono font-bold text-zinc-800"
            style={{ width: `${100 - clampedWinrate}%` }}
          />
          {/* 50% Equilibrium Center Mark */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-500/80 -translate-x-1/2 z-10" />
        </div>
      )}
    </div>
  );
};
