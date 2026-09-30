'use client';

import React from 'react';
import { CandidateExplanation } from '@/lib/coach/gemini-coach';
import { CandidateMoveEvaluation } from '@/lib/engine/types';
import { Point } from '@/lib/go/types';
import { Eye, Loader2, Sparkles } from 'lucide-react';

export interface CandidateMovesCardProps {
  candidates: CandidateMoveEvaluation[];
  explanations?: CandidateExplanation[];
  onSelectMove?: (coord: string, point: Point) => void;
  onHoverMove?: (coord: string | null) => void;
  onPreviewVariation?: (pv: string[] | null) => void;
  activePreviewPv?: string[] | null;
  isAiThinking?: boolean;
  className?: string;
}

export const CandidateMovesCard: React.FC<CandidateMovesCardProps> = ({
  candidates = [],
  explanations = [],
  onSelectMove,
  onHoverMove,
  onPreviewVariation,
  activePreviewPv = null,
  isAiThinking = false,
  className = '',
}) => {
  const getMoveTag = (rank: number, exp?: CandidateExplanation) => {
    if (exp?.tagThai) {
      const badgeClass =
        rank === 1
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : rank === 2
          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      return {
        label: exp.tagThai,
        badgeClass,
      };
    }
    switch (rank) {
      case 1:
        return {
          label: '⭐ ทางเลือก 1: ดีที่สุด (Best)',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 2:
        return {
          label: '🏃 ทางเลือก 2: เน้นหนาแน่น (Solid)',
          badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        };
      case 3:
      default:
        return {
          label: '⚔️ ทางเลือก 3: บุกชิงแต้ม (Active)',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
    }
  };

  const topThree = candidates.slice(0, 3);

  return (
    <div
      className={`p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 shadow-xl flex flex-col gap-2.5 ${className}`}
      data-testid="candidate-moves-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800/70">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>3 ทางเลือกหมากแนะนำ (KataGo + AI Coach)</span>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono">คลิกเดิน / ชี้ดูสายหมาก</span>
      </div>

      {/* AI Thinking Status Bar (Persistent, Non-Flickering) */}
      {isAiThinking && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs animate-pulse"
          data-testid="candidate-thinking-state"
        >
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="font-medium">คู่ต่อสู้กำลังเดินหมาก...</span>
        </div>
      )}

      {/* Candidate List */}
      {topThree.length === 0 ? (
        !isAiThinking && (
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-center text-xs text-zinc-500 italic">
            เดินหมากเพื่อดู 3 ตัวเลือกกลยุทธ์จาก KataGo
          </div>
        )
      ) : (
        <div
          className={`flex flex-col gap-2.5 transition-opacity duration-200 ${
            isAiThinking ? 'opacity-60 pointer-events-none select-none' : ''
          }`}
        >
          {topThree.map((move, idx) => {
            const exp = explanations.find(e => e.coord.toUpperCase() === move.coord.toUpperCase()) || explanations[idx];
            const tag = getMoveTag(idx + 1, exp);
            const isLeadPositive = move.scoreLead >= 0;
            const isPreviewingThis =
              activePreviewPv &&
              move.pv &&
              move.pv.length > 0 &&
              activePreviewPv[0] === move.pv[0];

            return (
              <div
                key={`${move.coord}-${idx}`}
                className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-amber-500/40 transition-all flex flex-col gap-2 group"
                data-testid="candidate-move-item"
              >
                {/* Header Row: Move action & Metrics */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => {
                      if (move.point) {
                        onSelectMove?.(move.coord, move.point);
                      }
                    }}
                    onMouseEnter={() => onHoverMove?.(move.coord)}
                    onMouseLeave={() => onHoverMove?.(null)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-mono font-bold text-sm text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                      {move.coord}
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded border font-medium truncate inline-block ${tag.badgeClass}`}
                      >
                        {tag.label}
                      </span>
                    </div>
                  </button>

                  {/* Variation Preview Button */}
                  {move.pv && move.pv.length > 0 && (
                    <button
                      type="button"
                      disabled={isAiThinking}
                      onClick={e => {
                        e.stopPropagation();
                        onPreviewVariation?.(isPreviewingThis ? null : move.pv);
                      }}
                      onMouseEnter={() => onPreviewVariation?.(move.pv)}
                      onMouseLeave={() => onPreviewVariation?.(null)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 border transition-colors cursor-pointer shrink-0 ${
                        isPreviewingThis
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-amber-300 hover:border-zinc-700'
                      }`}
                      data-testid="candidate-pv-preview-btn"
                      title="ดูสายหมากจำลองบนกระดาน"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูสายหมาก</span>
                    </button>
                  )}

                  {/* Metrics */}
                  <div className="flex flex-col items-end shrink-0 pl-1">
                    <div className="font-mono text-xs font-semibold text-emerald-400">
                      {`${move.winrate}%`}
                    </div>
                    <div
                      className={`font-mono text-[11px] ${
                        isLeadPositive ? 'text-zinc-300' : 'text-rose-400'
                      }`}
                    >
                      {isLeadPositive ? `+${move.scoreLead}` : move.scoreLead} แต้ม
                    </div>
                  </div>
                </div>

                {/* Pedagogical Tactical Explanation Box (Purpose, Self, Opponent) */}
                {exp && (
                  <div
                    className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 text-[11.5px] leading-relaxed space-y-1 text-zinc-300"
                    data-testid="candidate-explanation-box"
                  >
                    <div className="text-amber-200/90 font-medium">
                      <span className="text-amber-400 font-semibold">เป้าหมาย: </span>
                      {exp.purpose}
                    </div>
                    <div className="text-zinc-400">
                      <span className="text-emerald-400 font-medium">ผลต่อเรา: </span>
                      {exp.selfImpact}
                    </div>
                    <div className="text-zinc-400">
                      <span className="text-sky-400 font-medium">ผลต่อคู่แข่ง: </span>
                      {exp.opponentImpact}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
