'use client';

import React from 'react';
import { pointToString } from '@/lib/go/board';
import { BLACK, GameState } from '@/lib/go/types';
import { History } from 'lucide-react';

interface MoveHistoryPanelProps {
  gameState: GameState;
  className?: string;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
  gameState,
  className = '',
}) => {
  const { history, boardSize } = gameState;

  return (
    <div
      className={`flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-950/70 border-b border-zinc-800">
        <History className="w-4 h-4 text-amber-400" />
        <span className="text-xs uppercase font-bold tracking-wider text-zinc-300">
          ประวัติการเดิน (Move History)
        </span>
        <span className="ml-auto text-xs font-mono text-zinc-500">
          {history.length} เม็ด
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-56 p-2 space-y-1">
        {history.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 italic">
            ยังไม่มีการเดินหมาก (คลิกบนกระดานเพื่อเริ่มเล่น)
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            {history.map(record => {
              const coordStr = record.isPass
                ? 'PASS'
                : record.isResign
                ? 'RESIGN'
                : record.point
                ? pointToString(record.point, boardSize)
                : '-';

              const isBlack = record.color === BLACK;

              return (
                <div
                  key={record.moveNumber}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-950/40 hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[10px] w-5">
                      #{record.moveNumber}
                    </span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full border ${
                        isBlack
                          ? 'bg-zinc-950 border-zinc-500'
                          : 'bg-zinc-100 border-zinc-400'
                      }`}
                    />
                    <span className="font-semibold text-zinc-200">
                      {coordStr}
                    </span>
                  </div>
                  {record.capturedStones.length > 0 && (
                    <span className="text-[10px] text-red-400 font-sans font-medium">
                      +{record.capturedStones.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
