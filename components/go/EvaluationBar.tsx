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
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Calculates estimated territory and points for Black and White
 */
export function calculateEstimatedScores(
  ownershipGrid?: number[][] | null,
  scoreLead = 0,
  komi = 6.5,
  captures = { black: 0, white: 0 }
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
    const basePoints = 35;
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
  captures,
  komi = 6.5,
  isThinking = false,
  className = '',
  style,
}) => {
  // Clamp winrate between 1 and 99 for smooth visualization
  const clampedWinrate = Math.max(1, Math.min(99, Math.round(winrate * 10) / 10));
  const whiteWinrate = Math.round((100 - clampedWinrate) * 10) / 10;

  // Resolve scores
  const derivedScores = calculateEstimatedScores(ownershipGrid, scoreLead, komi, captures);
  const displayBlackScore = blackScore !== undefined ? blackScore : derivedScores.blackScore;
  const displayWhiteScore = whiteScore !== undefined ? whiteScore : derivedScores.whiteScore;

  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 shadow-xl ${className}`}
      style={style}
      data-testid="eval-bar"
    >
      {/* Header with Black & White Scores and Winrate % */}
      <div className="flex items-center justify-between text-xs font-mono font-bold px-1">
        {/* Left: Black Stone, Points, Winrate */}
        <div className="flex items-center gap-2 text-zinc-100" data-testid="eval-black-score">
          <div className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-600 shadow-sm" />
          <span className="text-zinc-200">
            หมากดำ: <strong className="text-amber-400 font-bold">{displayBlackScore}</strong> แต้ม
          </span>
          <span className="text-zinc-400 text-[11px]">({clampedWinrate}%)</span>
        </div>

        {/* Center: Thinking indicator if busy */}
        {isThinking && (
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden sm:inline">กำลังคำนวณ...</span>
          </div>
        )}

        {/* Right: White Winrate, Points, White Stone */}
        <div className="flex items-center gap-2 text-zinc-100" data-testid="eval-white-score">
          <span className="text-zinc-400 text-[11px]">({whiteWinrate}%)</span>
          <span className="text-zinc-200">
            หมากขาว: <strong className="text-zinc-100 font-bold">{displayWhiteScore}</strong> แต้ม
          </span>
          <div className="w-3.5 h-3.5 rounded-full bg-zinc-100 border border-zinc-400 shadow-sm" />
        </div>
      </div>

      {/* Dual Bar Progress */}
      <div className="relative h-4 w-full rounded-full overflow-hidden bg-zinc-950 border border-zinc-700/60 flex shadow-inner">
        {/* Black Share (Left) */}
        <div
          className="h-full bg-gradient-to-r from-zinc-950 to-zinc-800 transition-all duration-500 ease-out flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-zinc-400"
          style={{ width: `${clampedWinrate}%` }}
        />
        {/* White Share (Right) */}
        <div
          className="h-full bg-gradient-to-r from-zinc-200 to-zinc-50 transition-all duration-500 ease-out flex items-center pl-2 text-[10px] font-mono font-bold text-zinc-800"
          style={{ width: `${100 - clampedWinrate}%` }}
        />
        {/* 50% Equilibrium Center Mark */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-500/80 -translate-x-1/2 z-10" />
      </div>
    </div>
  );
};

