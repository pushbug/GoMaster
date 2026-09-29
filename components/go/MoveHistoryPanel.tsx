'use client';

import React, { useEffect, useRef } from 'react';
import { pointToString } from '@/lib/go/board';
import {
  calculateMoveScoreDelta,
  groupMovesIntoPairs,
  ScoreDeltaInfo,
} from '@/lib/go/history-analysis';
import { BLACK, GameState, MoveRecord, WHITE } from '@/lib/go/types';
import { History } from 'lucide-react';

interface MoveHistoryPanelProps {
  gameState: GameState;
  scoreLeadHistory?: number[];
  reviewStep?: number | null;
  onSelectStep?: (step: number) => void;
  className?: string;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
  gameState,
  scoreLeadHistory = [],
  reviewStep = null,
  onSelectStep,
  className = '',
}) => {
  const { history, boardSize } = gameState;
  const activeMoveRef = useRef<HTMLDivElement | null>(null);

  const movePairs = groupMovesIntoPairs(history);

  // Auto-scroll active move item into view when reviewStep changes
  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [reviewStep]);

  const renderMoveCell = (
    move: MoveRecord | null,
    delta: ScoreDeltaInfo | null
  ) => {
    if (!move) {
      return (
        <div className="flex-1 min-h-[36px] flex items-center justify-center text-zinc-600 font-mono text-[11px] rounded-lg bg-zinc-950/20 border border-transparent">
          -
        </div>
      );
    }

    const coordStr = move.isPass
      ? 'PASS'
      : move.isResign
      ? 'RESIGN'
      : move.point
      ? pointToString(move.point, boardSize)
      : '-';

    const isBlack = move.color === BLACK;
    const isActive =
      reviewStep !== null
        ? reviewStep === move.moveNumber
        : move.moveNumber === history.length;

    return (
      <div
        ref={isActive ? activeMoveRef : null}
        onClick={() => onSelectStep?.(move.moveNumber)}
        className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
          isActive
            ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 font-bold shadow-sm'
            : 'bg-zinc-950/40 border-zinc-800/40 hover:bg-zinc-800/80 hover:border-zinc-700/60 text-zinc-300'
        }`}
        title={`ตาเดิน #${move.moveNumber} (${coordStr}) — คลิกเพื่อดูย้อนหลัง`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-xs font-mono shrink-0 ${
              isActive ? 'text-amber-400 font-bold' : 'text-zinc-500'
            }`}
          >
            #{move.moveNumber}
          </span>
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
              isBlack
                ? 'bg-zinc-950 border-zinc-500 shadow-sm'
                : 'bg-zinc-100 border-zinc-400 shadow-sm'
            }`}
          />
          <span
            className={`text-sm font-mono font-bold truncate ${
              isActive ? 'text-amber-100' : 'text-zinc-200'
            }`}
          >
            {coordStr}
          </span>
        </div>

        {/* Score Delta Badge & Captures */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {move.capturedStones.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50 font-mono"
              title={`กินหมาก ${move.capturedStones.length} เม็ด`}
            >
              +{move.capturedStones.length}
            </span>
          )}

          {delta ? (
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded leading-none ${
                delta.isGain
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 font-bold'
                  : delta.isLoss
                  ? 'bg-rose-950/70 text-rose-400 border border-rose-800/50 font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
              title={`ผลกระทบต่อแต้ม: ${delta.formatted} แต้ม`}
            >
              {delta.formatted}
            </span>
          ) : (
            <span className="text-xs font-mono text-zinc-600">-</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl overflow-hidden ${className}`}
      data-testid="move-history-panel"
    >
      {/* Panel Top Title */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/70 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <span className="text-sm uppercase font-bold tracking-wider text-zinc-300">
            ประวัติการเดิน (Move History)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-zinc-400">
            รวม <strong className="text-amber-400">{history.length}</strong> เม็ด
          </span>
        </div>
      </div>

      {/* 2-Column Table Column Headers */}
      <div className="grid grid-cols-12 gap-1.5 px-3 py-2 bg-zinc-950/90 border-b border-zinc-800/80 text-xs font-semibold text-zinc-400">
        <div className="col-span-2 text-center text-zinc-500 font-mono">ตา</div>
        <div
          className="col-span-5 flex items-center justify-between px-2 text-zinc-200"
          data-testid="history-col-black"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-500" />
            <span>หมากดำ</span>
          </div>
          <span className="text-xs font-normal text-zinc-400">แต้ม (Δ)</span>
        </div>
        <div
          className="col-span-5 flex items-center justify-between px-2 text-zinc-200"
          data-testid="history-col-white"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-100 border border-zinc-400" />
            <span>หมากขาว</span>
          </div>
          <span className="text-xs font-normal text-zinc-400">แต้ม (Δ)</span>
        </div>
      </div>

      {/* Scrollable Move Rows */}
      <div className="flex-1 overflow-y-auto max-h-[380px] p-2 space-y-1.5">
        {history.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 italic">
            ยังไม่มีการเดินหมาก (คลิกบนกระดานเพื่อเริ่มเล่น)
          </div>
        ) : (
          movePairs.map(pair => {
            const blackDelta = pair.black
              ? calculateMoveScoreDelta(pair.black.moveNumber, BLACK, scoreLeadHistory)
              : null;
            const whiteDelta = pair.white
              ? calculateMoveScoreDelta(pair.white.moveNumber, WHITE, scoreLeadHistory)
              : null;

            return (
              <div
                key={pair.pairNumber}
                className="grid grid-cols-12 gap-1.5 items-center text-xs"
              >
                {/* Turn Pair Number */}
                <div className="col-span-2 text-center font-mono text-[11px] text-zinc-500">
                  {pair.pairNumber}.
                </div>

                {/* Black Move Column */}
                <div className="col-span-5 flex">
                  {renderMoveCell(pair.black, blackDelta)}
                </div>

                {/* White Move Column */}
                <div className="col-span-5 flex">
                  {renderMoveCell(pair.white, whiteDelta)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
