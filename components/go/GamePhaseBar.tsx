'use client';

import React from 'react';
import { calculateGamePhase, GamePhase } from '@/lib/go/game-phase';
import { BoardSize } from '@/lib/go/types';
import { Compass, Flame, ShieldCheck } from 'lucide-react';

interface GamePhaseBarProps {
  moveNumber: number;
  boardSize: BoardSize;
  className?: string;
}

export const GamePhaseBar: React.FC<GamePhaseBarProps> = ({
  moveNumber,
  boardSize,
  className = '',
}) => {
  const phaseInfo = calculateGamePhase(moveNumber, boardSize);

  const getPhaseIcon = (phase: GamePhase) => {
    switch (phase) {
      case 'opening':
        return <Compass className="w-3.5 h-3.5 text-amber-400" />;
      case 'middle':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'endgame':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getPhaseColor = (phase: GamePhase) => {
    switch (phase) {
      case 'opening':
        return 'from-amber-500 to-amber-400';
      case 'middle':
        return 'from-rose-500 to-amber-500';
      case 'endgame':
        return 'from-emerald-500 to-teal-400';
    }
  };

  const progressPercent = Math.min(100, Math.max(0, phaseInfo.progressPercent));

  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 shadow-md flex flex-col gap-2 ${className}`}
      data-testid="game-phase-bar"
    >
      {/* Top Meta Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
          {getPhaseIcon(phaseInfo.phase)}
          <span>{phaseInfo.phaseThai}</span>
          <span className="text-[11px] font-mono text-zinc-400 font-normal">({phaseInfo.stageName})</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
          <span>{`ตาที่ #${moveNumber}`}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-400/90 font-medium">{`${progressPercent}%`}</span>
        </div>
      </div>

      {/* Unified Progress Bar Track */}
      <div className="relative w-full h-2.5 bg-zinc-950/80 rounded-full overflow-hidden border border-zinc-800/80 p-0.5">
        <div
          className={`h-full rounded-full bg-linear-to-r ${getPhaseColor(
            phaseInfo.phase
          )} transition-all duration-300 shadow-xs`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Sleek Phase Zone Markers */}
      <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-500 px-0.5">
        <span className={phaseInfo.phase === 'opening' ? 'text-amber-400 font-medium' : ''}>
          เปิดเกม (Fuseki)
        </span>
        <span className={phaseInfo.phase === 'middle' ? 'text-rose-400 font-medium' : ''}>
          กลางเกม (Chuban)
        </span>
        <span className={phaseInfo.phase === 'endgame' ? 'text-emerald-400 font-medium' : ''}>
          ท้ายเกม (Yose)
        </span>
      </div>
    </div>
  );
};
