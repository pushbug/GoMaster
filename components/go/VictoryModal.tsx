'use client';

import React from 'react';
import { DeadStonesSummary } from '@/lib/go/dead-stones';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

export interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGame: () => void;
  winner: 'B' | 'W' | 'DRAW' | null;
  playerColor: 'B' | 'W';
  resignReason?: string;
  consecutivePasses?: number;
  scoreLead: number;
  captures: {
    black: number;
    white: number;
  };
  deadStonesSummary: DeadStonesSummary | null;
  showDeadStones: boolean;
  onToggleDeadStones: () => void;
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  onNewGame,
  winner,
  playerColor,
  resignReason,
  scoreLead,
  captures,
  deadStonesSummary,
  showDeadStones,
  onToggleDeadStones,
  showHeatmap = false,
  onToggleHeatmap,
}) => {
  if (!isOpen) return null;

  const isPlayerWinner = winner === playerColor;
  const isDraw = winner === 'DRAW';

  const winnerThai = isDraw
    ? 'เสมอ (Draw)'
    : winner === 'B'
    ? 'หมากดำ (Black)'
    : 'หมากขาว (White)';

  const absScoreLead = Math.abs(Math.round(scoreLead * 10) / 10);
  const largestDragon = deadStonesSummary?.largestDeadDragon;
  const opponentDeadCount =
    playerColor === 'B'
      ? deadStonesSummary?.whiteDeadCount ?? 0
      : deadStonesSummary?.blackDeadCount ?? 0;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      data-testid="modal-victory"
    >
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-4 relative overflow-hidden">
        {/* Glow accent */}
        <div
          className={`absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
            isPlayerWinner ? 'bg-amber-500/20' : 'bg-rose-500/15'
          }`}
        />

        {/* Close / Inspect Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          title="ปิดเพื่อตรวจดูกระดาน"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Winner & Title */}
        <div className="flex items-center gap-3.5 pr-8">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isPlayerWinner
                ? 'bg-linear-to-tr from-amber-600 to-amber-400 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold">
                สรุปผลการแข่งขัน (Match Result)
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {isPlayerWinner
                ? '🎉 ชัยชนะเป็นของคุณ!'
                : isDraw
                ? 'ผลการแข่งขัน: เสมอกัน'
                : `ผู้ชนะ: ${winnerThai}`}
            </h2>
          </div>
        </div>

        {/* Outcome Description */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-sm space-y-1">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs text-zinc-400">สถานะการจบเกม:</span>
            <span className="font-medium text-amber-300">
              {resignReason || (isDraw ? 'เสมอกัน' : 'จบเกมจากการนับแต้ม')}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-xs text-zinc-400">ส่วนต่างคะแนน KataGo:</span>
            <span className="font-mono font-bold text-emerald-400">
              {scoreLead >= 0 ? `+${scoreLead}` : `${scoreLead}`} แต้ม (ห่าง {absScoreLead} แต้ม)
            </span>
          </div>
        </div>

        {/* Dragon Autopsy Card (ชันสูตรกลุ่มมังกรตาย) */}
        <div
          className="p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/25 space-y-2.5 shadow-inner"
          data-testid="dragon-summary-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>ชันสูตรจุดชี้ขาด (Dragon Autopsy)</span>
            </div>
            {largestDragon && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono">
                {largestDragon.regionLabelThai}
              </span>
            )}
          </div>

          {largestDragon ? (
            <div className="space-y-1.5 text-sm">
              <p className="text-zinc-200 leading-relaxed">
                พบกลุ่มมังกร
                <strong className={largestDragon.color === 2 ? 'text-zinc-300' : 'text-zinc-400'}>
                  {largestDragon.color === 2 ? 'หมากขาว' : 'หมากดำ'}
                </strong>{' '}
                ขนาดใหญ่จำนวน{' '}
                <span className="text-rose-400 font-bold font-mono text-base">
                  {largestDragon.stoneCount} เม็ด
                </span>{' '}
                บริเวณ<strong>{largestDragon.regionLabelThai}</strong> (ศูนย์กลางพิกัด{' '}
                <span className="font-mono text-amber-300">{largestDragon.centerCoord}</span>) ตายสนิท
                เนื่องจากไม่สามารถสร้าง 2 เบ้าตา (Two Eyes) ได้
              </p>
              <p className="text-xs text-zinc-400">
                รวมหมากตายบนกระดานทั้งหมด:{' '}
                <span className="text-zinc-200 font-medium">
                  ขาวตาย {deadStonesSummary?.whiteDeadCount ?? 0} เม็ด / ดำตาย{' '}
                  {deadStonesSummary?.blackDeadCount ?? 0} เม็ด
                </span>{' '}
                ทำให้แต้มขาดลอยจนนำไปสู่ชัยชนะ
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 leading-relaxed">
              ไม่พบกลุ่มมังกรตายขนาดใหญ่ เกมนี้เป็นการขับเคี่ยวชิงแต้มพื้นที่อย่างละเอียดรอบกระดาน
            </p>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-1">
            <span className="text-zinc-400">หมากที่กินจริงระหว่างเกม</span>
            <span className="text-sm font-bold text-zinc-200 font-mono">
              ดำกิน {captures.black} เม็ด / ขาวกิน {captures.white} เม็ด
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-1">
            <span className="text-zinc-400">หมากคู่แข่งตายในพื้นที่</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              +{opponentDeadCount} เม็ด (+{opponentDeadCount * 2} แต้ม)
            </span>
          </div>
        </div>

        {/* Interactive Inspection Toggles */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onToggleDeadStones}
            data-testid="btn-toggle-dead-stones"
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              showDeadStones
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {showDeadStones ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>ไฮไลต์หมากตาย (✕)</span>
          </button>

          {onToggleHeatmap && (
            <button
              type="button"
              onClick={onToggleHeatmap}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                showHeatmap
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>แผนผังพื้นที่ (Heatmap)</span>
            </button>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-victory-replay"
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors cursor-pointer text-center"
          >
            ตรวจดูกระดาน / Replay
          </button>
          <button
            type="button"
            onClick={onNewGame}
            data-testid="btn-victory-new-game"
            className="flex-1 py-2.5 px-4 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เริ่มเกมใหม่</span>
          </button>
        </div>
      </div>
    </div>
  );
};
