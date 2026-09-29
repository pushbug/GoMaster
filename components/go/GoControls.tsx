'use client';

import React from 'react';
import { HeatmapMode } from '@/lib/go/history-analysis';
import { GameState } from '@/lib/go/types';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
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
  isAiThinking?: boolean;
  className?: string;

  // Heatmap Controls Props
  heatmapMode?: HeatmapMode;
  onToggleHeatmap?: () => void;

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
  isAiThinking = false,
  className = '',
  heatmapMode = 'none',
  onToggleHeatmap,
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
      )}

      {/* Main Controls Row: [Replay Navigation] [Heatmap Toggle] [In-Game Actions] */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Left: Replay Navigation Controls (OGS Style) */}
        <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 p-1 rounded-xl bg-zinc-950/60 border border-zinc-800">
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
            title="ไปตาล่าสุด (End)"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* 6. Return to Live Head Button (when reviewing during ongoing game) */}
          {isReviewing && !isGameOver && (
            <button
              onClick={onReturnToLive}
              data-testid="btn-replay-live"
              className="flex items-center gap-1 ml-1 px-3 py-1.5 rounded-lg bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              title="กลับสู่ตาปัจจุบันเพื่อเล่นต่อ"
            >
              <span>กลับสู่เกม</span>
            </button>
          )}
        </div>

        {/* Center / Right: Heatmap Toggle & In-Game Actions [ย้อน] [ผ่าน] [ยอมแพ้] */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Multi-mode Heatmap Toggle */}
          {onToggleHeatmap && (
            <button
              onClick={onToggleHeatmap}
              data-testid="toggle-heatmap-mode"
              className={`flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl border text-sm font-semibold transition-all shadow-sm active:scale-95 ${
                heatmapMode === 'none'
                  ? 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  : heatmapMode === 'both'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : heatmapMode === 'black'
                  ? 'bg-zinc-950 text-zinc-100 border-zinc-600'
                  : 'bg-zinc-100 text-zinc-900 border-zinc-300 font-bold'
              }`}
              title="สลับโหมด Heatmap: ปิด -> ทั้งหมด -> เฉพาะดำ -> เฉพาะขาว"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {heatmapMode === 'none'
                  ? 'Heatmap: ปิด'
                  : heatmapMode === 'both'
                  ? 'Heatmap: ทั้งหมด'
                  : heatmapMode === 'black'
                  ? 'Heatmap: ดำ'
                  : 'Heatmap: ขาว'}
              </span>
            </button>
          )}

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={totalMoves === 0 || isGameOver || isAiThinking || isReviewing}
            data-testid="btn-undo"
            className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/60 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm font-semibold transition-all shadow-sm"
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
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/60 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm font-semibold transition-all shadow-sm"
            title={isReviewing ? 'ต้องกลับสู่ตาปัจจุบันก่อนจึงจะผ่านได้' : 'สละสิทธิ์การวางหมากในตานี้'}
          >
            <SkipForward className="w-3.5 h-3.5 text-zinc-400" />
            <span>ผ่าน (Pass)</span>
          </button>

          {/* Resign */}
          <button
            onClick={onResign}
            disabled={isGameOver || isAiThinking || isReviewing}
            data-testid="btn-resign"
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm font-semibold transition-all shadow-sm"
            title={isReviewing ? 'ต้องกลับสู่ตาปัจจุบันก่อนจึงจะยอมแพ้ได้' : 'ยอมแพ้ในเกมนี้'}
          >
            <Flag className="w-3.5 h-3.5 text-red-400" />
            <span>ยอมแพ้ (Resign)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
