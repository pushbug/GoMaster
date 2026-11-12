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
  compact?: boolean;
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
  compact = false,
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
      className={`rounded-2xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 shadow-xl flex flex-col ${compact ? 'p-2 gap-1.5' : 'p-3.5 gap-2.5 min-h-[220px]'} ${className}`}
      data-testid="candidate-moves-card"
    >
      {/* Header with Persistent Height and Non-Shifting Thinking State */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800/70 min-h-[26px]">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>3 ทางเลือกหมากแนะนำ (KataGo)</span>
        </div>
        {isAiThinking ? (
          <div
            className="flex items-center gap-1.5 text-xs text-amber-300 font-medium animate-pulse"
            data-testid="candidate-thinking-state"
          >
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>คู่ต่อสู้กำลังเดินหมาก...</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-400 font-mono">คลิกเดิน / ชี้ดูสายหมาก</span>
        )}
      </div>

      {/* Candidate List */}
      {topThree.length === 0 ? (
        !isAiThinking && (
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-center text-xs text-zinc-500 italic min-h-[120px] flex items-center justify-center">
            เดินหมากเพื่อดู 3 ตัวเลือกกลยุทธ์จาก KataGo
          </div>
        )
      ) : (
        <div
          className={`flex flex-col ${compact ? 'gap-1' : 'gap-2.5'} transition-opacity duration-200 ${
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
                className={`rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-amber-500/40 transition-all grid grid-cols-[minmax(0,1fr)_auto] items-center group ${compact ? 'p-2 gap-x-2 gap-y-1' : 'p-3 gap-x-3 gap-y-1.5'}`}
                data-testid="candidate-move-item"
              >
                {/* First row: candidate and variation preview */}
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
                  className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-mono font-bold text-sm text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                    {move.coord}
                  </div>
                  <span
                    className={`min-w-0 max-w-full text-[11px] px-2 py-1 rounded-md border font-medium truncate ${tag.badgeClass}`}
                  >
                    {tag.label}
                  </span>
                </button>

                {/* Variation Preview Button */}
                {move.pv && move.pv.length > 0 ? (
                  <button
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => onPreviewVariation?.(isPreviewingThis ? null : move.pv)}
                    onMouseEnter={() => onPreviewVariation?.(move.pv)}
                    onMouseLeave={() => onPreviewVariation?.(null)}
                    className={`justify-self-end px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border transition-colors cursor-pointer shrink-0 ${
                      isPreviewingThis
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-amber-300 hover:border-zinc-700'
                    }`}
                    data-testid="candidate-pv-preview-btn"
                    title="ดูสายหมากจำลองบนกระดาน"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูสายหมาก</span>
                  </button>
                ) : (
                  <span />
                )}

                {/* Second row: metrics below the variation preview */}
                <div className="col-start-2 flex items-baseline justify-end gap-2 whitespace-nowrap pr-0.5">
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {`${move.winrate}%`}
                  </span>
                  <span
                    className={`font-mono text-[11px] ${
                      isLeadPositive ? 'text-zinc-300' : 'text-rose-400'
                    }`}
                  >
                    {isLeadPositive ? `+${move.scoreLead}` : move.scoreLead} แต้ม
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
