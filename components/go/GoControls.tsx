'use client';

import React from 'react';
import { exportToSgf } from '@/lib/go/sgf';
import { BLACK, BoardSize, GameState, WHITE } from '@/lib/go/types';
import {
  Download,
  Flag,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface GoControlsProps {
  gameState: GameState;
  onPass: () => void;
  onResign: () => void;
  onUndo: () => void;
  onReset: (size?: BoardSize) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  boardTheme: 'wood' | 'slate' | 'minimal';
  onChangeTheme: (theme: 'wood' | 'slate' | 'minimal') => void;
  className?: string;
}

export const GoControls: React.FC<GoControlsProps> = ({
  gameState,
  onPass,
  onResign,
  onUndo,
  onReset,
  soundEnabled,
  onToggleSound,
  boardTheme,
  onChangeTheme,
  className = '',
}) => {
  const { turn, captures, history, isGameOver, winner, resignReason } = gameState;

  const handleExportSgf = () => {
    const sgfText = exportToSgf(gameState);
    const blob = new Blob([sgfText], { type: 'application/x-go-sgf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gomaster_game_${new Date().toISOString().slice(0, 10)}.sgf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl ${className}`}
    >
      {/* 1. Header & Game Status */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded-full border-2 shadow-inner transition-colors duration-200 ${
              turn === BLACK
                ? 'bg-zinc-950 border-zinc-500 shadow-black'
                : 'bg-zinc-100 border-zinc-400 shadow-zinc-400'
            }`}
          />
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              สถานะเกม (Status)
            </div>
            <div className="text-base font-bold" data-testid="turn-indicator">
              {isGameOver
                ? winner === 'DRAW'
                  ? 'เสมอ (Draw)'
                  : `ผู้ชนะ: ${winner === BLACK ? 'หมากดำ (Black)' : 'หมากขาว (White)'}`
                : `ตาเดิน: ${turn === BLACK ? 'หมากดำ (Black)' : 'หมากขาว (White)'}`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            จำนวนเม็ด (Move)
          </div>
          <div className="text-base font-mono font-bold text-amber-400">
            #{history.length}
          </div>
        </div>
      </div>

      {isGameOver && resignReason && (
        <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-sm font-medium text-center">
          {resignReason}
        </div>
      )}

      {/* 2. Captures Counters */}
      <div className="grid grid-cols-2 gap-3">
        {/* Black Player Box */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
            turn === BLACK && !isGameOver
              ? 'bg-zinc-800/90 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-zinc-950/60 border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-zinc-950 border border-zinc-600" />
            <span className="text-sm font-medium text-zinc-300">หมากดำ</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">กิน:</span>
            <span
              className="text-base font-bold font-mono text-zinc-100"
              data-testid="counter-black-captures"
            >
              {captures.black}
            </span>
          </div>
        </div>

        {/* White Player Box */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
            turn === WHITE && !isGameOver
              ? 'bg-zinc-800/90 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-zinc-950/60 border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-zinc-100 border border-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">หมากขาว</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">กิน:</span>
            <span
              className="text-base font-bold font-mono text-zinc-100"
              data-testid="counter-white-captures"
            >
              {captures.white}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onPass}
          disabled={isGameOver}
          data-testid="btn-pass"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm font-medium transition-all"
        >
          <SkipForward className="w-4 h-4 text-zinc-400" />
          <span>ผ่าน (Pass)</span>
        </button>

        <button
          onClick={onUndo}
          disabled={history.length === 0 || isGameOver}
          data-testid="btn-undo"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm font-medium transition-all"
        >
          <RotateCcw className="w-4 h-4 text-zinc-400" />
          <span>ย้อน (Undo)</span>
        </button>

        <button
          onClick={onResign}
          disabled={isGameOver}
          data-testid="btn-resign"
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm font-medium transition-all"
        >
          <Flag className="w-4 h-4 text-red-400" />
          <span>ยอมแพ้</span>
        </button>
      </div>

      {/* 4. Configuration & Tools */}
      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Board Size Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <span className="text-zinc-500 px-1 font-semibold">ขนาด:</span>
          {([19, 13, 9] as BoardSize[]).map(size => (
            <button
              key={size}
              onClick={() => onReset(size)}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                gameState.boardSize === size
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {size}x{size}
            </button>
          ))}
        </div>

        {/* Theme and Sound Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const nextTheme =
                boardTheme === 'wood' ? 'slate' : boardTheme === 'slate' ? 'minimal' : 'wood';
              onChangeTheme(nextTheme);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium capitalize"
          >
            ธีม: {boardTheme === 'wood' ? 'ไม้ Kaya' : boardTheme === 'slate' ? 'Slate ดำ' : 'ขาว'}
          </button>

          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          <button
            onClick={handleExportSgf}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            title="ดาวน์โหลด SGF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
