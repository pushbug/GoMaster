'use client';

import React from 'react';
import { HeatmapMode } from '@/lib/go/history-analysis';
import { GameState } from '@/lib/go/types';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react';

interface GoControlsProps {
  gameState: GameState;
  onPass: () => void;
  onResign: () => void;
  onUndo: () => void;
  onOpenNewGame?: () => void;
  onOpenVictoryModal?: () => void;
  isAiThinking?: boolean;
  className?: string;

  // Heatmap Controls Props
  heatmapMode?: HeatmapMode;
  onToggleHeatmap?: () => void;
  onSelectHeatmapMode?: (mode: HeatmapMode) => void;

  // Replay & Step Navigation Props
  reviewStep?: number | null;
  isReviewing?: boolean;
  onStepPrev?: () => void;
  onStepNext?: () => void;
  onStepFirst?: () => void;
  onStepLast?: () => void;
  onReturnToLive?: () => void;
}

export const GoControls: React.FC<GoControlsProps> = ({
  gameState,
  onPass,
  onResign,
  onUndo,
  onOpenNewGame,
  onOpenVictoryModal,
  isAiThinking = false,
  className = '',
  heatmapMode = 'none',
  onToggleHeatmap,
  onSelectHeatmapMode,
  reviewStep = null,
  isReviewing = false,
  onStepPrev,
  onStepNext,
  onStepFirst,
  onStepLast,
  onReturnToLive,
}) => {
  const { history, isGameOver, winner, resignReason } = gameState;
  const totalMoves = history.length;
  const currentStepNum = reviewStep === null ? totalMoves : reviewStep;
  const isAtFirst = totalMoves === 0 || reviewStep === 0;
  const isAtLiveHead = reviewStep === null;

  const handleHeatmapModeClick = (mode: HeatmapMode) => {
    const nextMode = heatmapMode === mode ? 'none' : mode;
    if (onSelectHeatmapMode) {
      onSelectHeatmapMode(nextMode);
    } else if (onToggleHeatmap) {
      onToggleHeatmap();
    }
  };

  return (
    <div
      className={`w-full flex flex-col gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 shadow-xl ${className}`}
    >
      {/* Game Over Banner if ended */}
      {isGameOver && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">
              {winner === 'DRAW'
                ? 'ผลการแข่งขัน: เสมอ (Draw)'
                : `ผู้ชนะ: ${winner === 1 ? 'หมากดำ (Black)' : 'หมากขาว (White)'}`}
            </span>
            {resignReason && (
              <span className="text-zinc-400">({resignReason})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onOpenVictoryModal && (
              <button
                type="button"
                onClick={onOpenVictoryModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-medium transition-colors border border-zinc-700 cursor-pointer"
              >
                <span>🔍 ชันสูตรเกม / หมากตาย</span>
              </button>
            )}
            {onOpenNewGame && (
              <button
                onClick={onOpenNewGame}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>เริ่มเกมใหม่</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Controls Row: [Replay Navigation] [Heatmap Toggle] [In-Game Actions] */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Left: Replay Navigation Controls (OGS Style) */}
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 p-1 rounded-xl bg-zinc-950/60 border border-zinc-800 shrink-0">
          {/* 1. Jump to First Move */}
          <button
            onClick={onStepFirst}
            disabled={isAtFirst}
            data-testid="btn-replay-first"
            className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="ไปตาแรกสุด (Home)"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* 2. Step Backward */}
          <button
            onClick={onStepPrev}
            disabled={isAtFirst}
            data-testid="btn-replay-prev"
            className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="ย้อน 1 ตา (ArrowLeft)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 3. Step Counter Indicator */}
          <div
            data-testid="replay-step-indicator"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-sm font-mono select-none"
            title={`กำลังแสดงตาที่ ${currentStepNum} จากทั้งหมด ${totalMoves} ตา`}
          >
            <span
              className={`font-bold ${
                isReviewing ? 'text-amber-400' : 'text-zinc-200'
              }`}
            >
              #{currentStepNum}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{totalMoves}</span>
            {isReviewing ? (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-sans font-medium">
                ดูย้อน
              </span>
            ) : (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans font-medium">
                สด
              </span>
            )}
          </div>

          {/* 4. Step Forward */}
          <button
            onClick={onStepNext}
            disabled={isAtLiveHead}
            data-testid="btn-replay-next"
            className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="เดินหน้า 1 ตา (ArrowRight)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 5. Jump to Last Move / Live Head */}
          <button
            onClick={onStepLast}
            disabled={isAtLiveHead}
            data-testid="btn-replay-last"
            className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="ไปตาล่าสุด / กลับสู่เกม (End)"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center / Right: Heatmap Toggle & In-Game Actions [ย้อน] [ผ่าน] [ยอมแพ้] */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* Multi-mode Heatmap Segmented Switcher [All | ดำ ● | ขาว ○] */}
          {(onSelectHeatmapMode || onToggleHeatmap) && (
            <div
              data-testid="toggle-heatmap-mode"
              className="flex items-center p-0.5 rounded-xl bg-zinc-950/70 border border-zinc-800 shrink-0 text-xs font-semibold shadow-xs"
              title="เปิด/ปิด Heatmap อาณาเขต: All (ทั้งหมด), ดำ, ขาว (กดซ้ำเพื่อปิด)"
            >
              <button
                type="button"
                onClick={() => handleHeatmapModeClick('both')}
                data-testid="btn-heatmap-all"
                className={`px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                  heatmapMode === 'both'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                }`}
                title="แสดงพื้นที่ Heatmap ทั้งหมด (คลิกซ้ำเพื่อปิด)"
              >
                <span>All</span>
              </button>
              <button
                type="button"
                onClick={() => handleHeatmapModeClick('black')}
                data-testid="btn-heatmap-black"
                className={`px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                  heatmapMode === 'black'
                    ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-600 shadow-xs ring-1 ring-zinc-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                }`}
                title="แสดงเฉพาะพื้นที่หมากดำ (คลิกซ้ำเพื่อปิด)"
              >
                <span className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-500 shrink-0 inline-block" />
                <span>ดำ</span>
              </button>
              <button
                type="button"
                onClick={() => handleHeatmapModeClick('white')}
                data-testid="btn-heatmap-white"
                className={`px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                  heatmapMode === 'white'
                    ? 'bg-zinc-100 text-zinc-950 font-bold border border-zinc-300 shadow-xs ring-1 ring-zinc-400/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                }`}
                title="แสดงเฉพาะพื้นที่หมากขาว (คลิกซ้ำเพื่อปิด)"
              >
                <span className="w-2 h-2 rounded-full bg-zinc-100 border border-zinc-400 shrink-0 inline-block" />
                <span>ขาว</span>
              </button>
            </div>
          )}

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={totalMoves === 0 || isGameOver || isAiThinking || isReviewing}
            data-testid="btn-undo"
            className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/60 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0"
            title="ย้อนการเดินหมากตาที่แล้ว (Undo)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">ย้อน</span>
          </button>

          {/* Pass */}
          <button
            onClick={onPass}
            disabled={isGameOver || isAiThinking || isReviewing}
            data-testid="btn-pass"
            className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/60 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0"
            title={isReviewing ? 'ต้องกลับสู่ตาปัจจุบันก่อนจึงจะผ่านได้' : 'สละสิทธิ์การวางหมากในตานี้ (Pass)'}
          >
            <SkipForward className="w-3.5 h-3.5 text-zinc-400" />
            <span>ผ่าน</span>
          </button>

          {/* Resign */}
          <button
            onClick={onResign}
            disabled={isGameOver || isAiThinking || isReviewing}
            data-testid="btn-resign"
            className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0"
            title={isReviewing ? 'ต้องกลับสู่ตาปัจจุบันก่อนจึงจะยอมแพ้ได้' : 'ยอมแพ้ในเกมนี้ (Resign)'}
          >
            <Flag className="w-3.5 h-3.5 text-red-400" />
            <span>ยอมแพ้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
