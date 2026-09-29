'use client';

import React, { useEffect, useState } from 'react';
import { ALL_RANKS, getRankConfig, Rank } from '@/lib/engine/difficulty';
import { BoardSize, Point } from '@/lib/go/types';
import { Bot, Play, Sparkles, User, Volume2, VolumeX, X } from 'lucide-react';

export interface NewGameConfig {
  boardSize: BoardSize;
  gameMode: 'self-study' | 'vs-ai';
  playerColor: 'B' | 'W';
  selectedRank: Rank;
  handicap: number;
  komi: number;
  boardTheme: 'wood' | 'slate' | 'minimal';
  soundEnabled: boolean;
}

export const DEFAULT_NEW_GAME_CONFIG: NewGameConfig = {
  boardSize: 19,
  gameMode: 'vs-ai',
  playerColor: 'B',
  selectedRank: '1D',
  handicap: 0,
  komi: 6.5,
  boardTheme: 'wood',
  soundEnabled: true,
};

import { getHandicapPoints, resolveKomi } from '@/lib/go/handicap';

export { getHandicapPoints, resolveKomi };

/**
 * Validates and merges partial config with defaults
 */
export function validateNewGameConfig(partial: Partial<NewGameConfig>): NewGameConfig {
  const handicap = partial.handicap ?? DEFAULT_NEW_GAME_CONFIG.handicap;
  return {
    boardSize: partial.boardSize ?? DEFAULT_NEW_GAME_CONFIG.boardSize,
    gameMode: partial.gameMode ?? DEFAULT_NEW_GAME_CONFIG.gameMode,
    playerColor: partial.playerColor ?? DEFAULT_NEW_GAME_CONFIG.playerColor,
    selectedRank: partial.selectedRank ?? DEFAULT_NEW_GAME_CONFIG.selectedRank,
    handicap,
    komi: partial.komi !== undefined ? partial.komi : resolveKomi(handicap),
    boardTheme: partial.boardTheme ?? DEFAULT_NEW_GAME_CONFIG.boardTheme,
    soundEnabled: partial.soundEnabled ?? DEFAULT_NEW_GAME_CONFIG.soundEnabled,
  };
}

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: NewGameConfig) => void;
  currentConfig?: Partial<NewGameConfig>;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentConfig,
}) => {
  const [boardSize, setBoardSize] = useState<BoardSize>(19);
  const [gameMode, setGameMode] = useState<'self-study' | 'vs-ai'>('vs-ai');
  const [playerColor, setPlayerColor] = useState<'B' | 'W'>('B');
  const [selectedRank, setSelectedRank] = useState<Rank>('1D');
  const [handicap, setHandicap] = useState<number>(0);
  const [boardTheme, setBoardTheme] = useState<'wood' | 'slate' | 'minimal'>('wood');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const wasOpenRef = React.useRef<boolean>(false);

  // Sync state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (currentConfig?.boardSize) setBoardSize(currentConfig.boardSize);
      if (currentConfig?.gameMode) setGameMode(currentConfig.gameMode);
      if (currentConfig?.playerColor) setPlayerColor(currentConfig.playerColor);
      if (currentConfig?.selectedRank) setSelectedRank(currentConfig.selectedRank);
      if (currentConfig?.handicap !== undefined) setHandicap(currentConfig.handicap);
      if (currentConfig?.boardTheme) setBoardTheme(currentConfig.boardTheme);
      if (currentConfig?.soundEnabled !== undefined) setSoundEnabled(currentConfig.soundEnabled);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      boardSize,
      gameMode,
      playerColor,
      selectedRank,
      handicap,
      komi: resolveKomi(handicap),
      boardTheme,
      soundEnabled,
    });
    onClose();
  };

  const maxHandicap = boardSize === 19 ? 9 : 5;
  const currentRankConfig = getRankConfig(selectedRank);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      data-testid="modal-new-game"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] text-zinc-100 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-950">
              <Sparkles className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                เริ่มเกมใหม่ (Start New Game)
              </h2>
              <p className="text-xs text-zinc-400">
                กำหนดขนาดกระดาน โหมดการเล่น และระดับความท้าทาย
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-5">
          {/* 1. Board Size */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              1. ขนาดกระดาน (Board Size)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { size: 19 as BoardSize, label: '19x19', desc: 'มาตรฐานสากล' },
                { size: 13 as BoardSize, label: '13x13', desc: 'ซ้อมกลางเกม' },
                { size: 9 as BoardSize, label: '9x9', desc: 'กระชับ/มือใหม่' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.size}
                  onClick={() => {
                    setBoardSize(opt.size);
                    if (handicap > (opt.size === 19 ? 9 : 5)) {
                      setHandicap(opt.size === 19 ? 9 : 5);
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                    boardSize === opt.size
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/10 font-bold'
                      : 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-sm font-bold font-mono">{opt.label}</span>
                  <span
                    className={`text-[10px] ${
                      boardSize === opt.size ? 'text-zinc-900' : 'text-zinc-500'
                    }`}
                  >
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Game Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              2. โหมดการเล่น (Game Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGameMode('vs-ai')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  gameMode === 'vs-ai'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-bold'
                    : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>สู้กับ AI (KataGo)</span>
              </button>

              <button
                type="button"
                onClick={() => setGameMode('self-study')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  gameMode === 'self-study'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-bold'
                    : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>ศึกษาหมาก (เล่น 2 ฝ่าย)</span>
              </button>
            </div>
          </div>

          {/* 3. Player Color & AI Rank (when vs-ai is selected) */}
          {gameMode === 'vs-ai' && (
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl space-y-4">
              {/* Player Color Choice */}
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400 font-medium">สีหมากของคุณ:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlayerColor('B')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      playerColor === 'B'
                        ? 'bg-zinc-800 text-zinc-100 border-amber-500/70 shadow-sm'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-500 shadow-sm" />
                    <span>หมากดำ (เดินก่อน)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlayerColor('W')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      playerColor === 'W'
                        ? 'bg-zinc-800 text-zinc-100 border-amber-500/70 shadow-sm'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-zinc-100 border border-zinc-400 shadow-sm" />
                    <span>หมากขาว (AI เริ่มก่อน)</span>
                  </button>
                </div>
              </div>

              {/* AI Difficulty Rank Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">ระดับฝีมือ AI:</span>
                  <span className="font-semibold text-amber-400 font-mono">
                    {currentRankConfig.labelThai}
                  </span>
                </div>
                <select
                  value={selectedRank}
                  onChange={e => setSelectedRank(e.target.value as Rank)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-medium focus:outline-none focus:border-amber-500"
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
              </div>
            </div>
          )}

          {/* 4. Handicap & Komi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold uppercase tracking-wider text-zinc-400">
                3. ต่อหมาก & แต้มต่อ (Handicap & Komi)
              </label>
              <span className="text-amber-400 font-mono font-medium">
                {handicap === 0 ? 'เสมอภาค (Komi 6.5)' : `ต่อ ${handicap} เม็ด (Komi 0.5)`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHandicap(0)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  handicap === 0
                    ? 'bg-amber-500 text-zinc-950 border-amber-400'
                    : 'bg-zinc-950/60 text-zinc-400 border-zinc-800'
                }`}
              >
                ไม่มีต่อหมาก
              </button>
              {Array.from({ length: maxHandicap - 1 }, (_, i) => i + 2).map(h => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHandicap(h)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    handicap === h
                      ? 'bg-amber-500 text-zinc-950 border-amber-400'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {h} เม็ด
                </button>
              ))}
            </div>
          </div>

          {/* 5. Theme & Sound Preferences */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              4. ความชอบ (Preferences)
            </label>
            <div className="flex items-center justify-between gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              {/* Board Theme */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400">ธีม:</span>
                {[
                  { id: 'wood' as const, label: 'ไม้ Kaya' },
                  { id: 'slate' as const, label: 'Slate ดำ' },
                  { id: 'minimal' as const, label: 'ขาว' },
                ].map(th => (
                  <button
                    type="button"
                    key={th.id}
                    onClick={() => setBoardTheme(th.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      boardTheme === th.id
                        ? 'bg-zinc-800 text-amber-400 border border-amber-500/50'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(prev => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  soundEnabled
                    ? 'bg-zinc-800 text-amber-400 border-zinc-700'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>เสียงเปิด</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>เสียงปิด</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              data-testid="btn-start-game"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>เริ่มเล่นเกมใหม่</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
