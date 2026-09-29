'use client';

import React from 'react';
import { ALL_RANKS, getRankConfig, Rank } from '@/lib/engine/difficulty';
import { Bot, Eye, History, User } from 'lucide-react';

export type GameMode = 'self-study' | 'vs-ai';

interface GameModeSelectorProps {
  gameMode: GameMode;
  onChangeMode: (mode: GameMode) => void;
  selectedRank: Rank;
  onChangeRank: (rank: Rank) => void;
  playerColor: 'B' | 'W';
  onChangePlayerColor: (color: 'B' | 'W') => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  onOpenHistory: () => void;
  className?: string;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  gameMode,
  onChangeMode,
  selectedRank,
  onChangeRank,
  playerColor,
  onChangePlayerColor,
  showHeatmap,
  onToggleHeatmap,
  onOpenHistory,
  className = '',
}) => {
  const currentRankConfig = getRankConfig(selectedRank);

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl ${className}`}
    >
      {/* 1. Mode Switcher (Self-Study vs Play AI) */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
          โหมดการเล่น (Game Mode)
        </span>
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-amber-400 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          <span>ประวัติแข่ง & คะแนน</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChangeMode('self-study')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
            gameMode === 'self-study'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/10'
              : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>ศึกษาหมาก (คนเล่น 2 ฝ่าย)</span>
        </button>

        <button
          onClick={() => onChangeMode('vs-ai')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
            gameMode === 'vs-ai'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/10'
              : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>สู้กับ AI (KataGo Bot)</span>
        </button>
      </div>

      {/* 2. Play vs AI Settings (Visible when vs-ai is active) */}
      {gameMode === 'vs-ai' && (
        <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-3">
          {/* Player Color Choice */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">คุณเล่นเป็น:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onChangePlayerColor('B')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  playerColor === 'B'
                    ? 'bg-zinc-800 text-zinc-100 border-amber-500/60'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-500" />
                <span>หมากดำ (เดินก่อน)</span>
              </button>

              <button
                onClick={() => onChangePlayerColor('W')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  playerColor === 'W'
                    ? 'bg-zinc-800 text-zinc-100 border-amber-500/60'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-zinc-100 border border-zinc-400" />
                <span>หมากขาว (AI เริ่มก่อน)</span>
              </button>
            </div>
          </div>

          {/* AI Difficulty Rank Dropdown */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">ระดับฝีมือ AI:</span>
              <span className="font-semibold text-amber-400 font-mono">
                {currentRankConfig.labelThai}
              </span>
            </div>

            <select
              value={selectedRank}
              onChange={e => onChangeRank(e.target.value as Rank)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-500"
            >
              <optgroup label="ระดับคิว (Kyu Ranks - ผู้เริ่มต้นถึงเตรียมดั้ง)">
                {ALL_RANKS.filter(r => r.endsWith('k')).map(r => (
                  <option key={r} value={r}>
                    {r.toUpperCase()} — {getRankConfig(r).labelThai}
                  </option>
                ))}
              </optgroup>
              <optgroup label="ระดับดั้ง (Dan Ranks - ระดับสูงถึงมืออาชีพ)">
                {ALL_RANKS.filter(r => r.endsWith('D')).map(r => (
                  <option key={r} value={r}>
                    {r.toUpperCase()} — {getRankConfig(r).labelThai}
                  </option>
                ))}
              </optgroup>
            </select>

            <p className="text-[11px] text-zinc-400 leading-tight pt-1">
              {currentRankConfig.description}
            </p>
          </div>
        </div>
      )}

      {/* 3. Heatmap Overlay Toggle */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>แผนที่กรรมสิทธิ์พื้นที่ (Heatmap):</span>
        </div>
        <button
          onClick={onToggleHeatmap}
          data-testid="toggle-heatmap"
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            showHeatmap
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-zinc-950 text-zinc-500 border-zinc-800'
          }`}
        >
          {showHeatmap ? 'เปิดแสดง' : 'ปิด'}
        </button>
      </div>
    </div>
  );
};
