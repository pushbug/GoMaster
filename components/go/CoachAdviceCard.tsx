'use client';

import React from 'react';
import { CoachAdviceResponse } from '@/lib/coach/gemini-coach';
import {
  BrainCircuit,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

interface CoachAdviceCardProps {
  advice: CoachAdviceResponse | null;
  isLoading?: boolean;
  gameMode: 'self-study' | 'vs-ai';
  selectedRank: string;
  onRequestAdvice?: () => void;
  className?: string;
}

export const CoachAdviceCard: React.FC<CoachAdviceCardProps> = ({
  advice,
  isLoading = false,
  gameMode,
  selectedRank,
  onRequestAdvice,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-2xl bg-linear-to-b from-zinc-900 to-zinc-900/90 border border-zinc-800 text-zinc-200 shadow-xl flex flex-col gap-3 relative overflow-hidden min-h-[220px] ${className}`}
      data-testid="coach-advice-card"
    >
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between text-sm pb-1.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 font-bold tracking-wider text-amber-400 uppercase">
          <BrainCircuit className="w-4 h-4 text-amber-400" />
          <span>AI Sensei (อาจารย์ 9 ดั้งอาชีพ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLoading && (
            <div
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse"
              data-testid="coach-silent-loader"
              title="อาจารย์ 9 ดั้งกำลังพิจารณารูปหมากตามผลประเมิน..."
            >
              <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
              <span>กำลังวิเคราะห์...</span>
            </div>
          )}
          {advice?.isAiGenerated && !isLoading && (
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Gemini Flash
            </span>
          )}
          <span className="text-xs px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
            {gameMode === 'vs-ai' ? `คู่ต่อสู้: ${selectedRank}` : 'โหมดวิเคราะห์'}
          </span>
        </div>
      </div>

      {/* Advice Body with In-Place Smooth Transition */}
      <div className={`flex-1 flex flex-col transition-opacity duration-200 ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
        {advice ? (
          <div className="space-y-3">
            {/* Tactical Feedback Box */}
            <div className="p-3.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold text-sm tracking-tight">
                  {advice.evaluationTitle}
                </span>
                {onRequestAdvice && (
                  <button
                    onClick={onRequestAdvice}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="ขอคำแนะนำใหม่อีกครั้ง"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>วิเคราะห์ซ้ำ</span>
                  </button>
                )}
              </div>

              <p className="text-sm text-zinc-200 leading-relaxed font-normal min-h-[40px]">
                {advice.tacticalAdvice}
              </p>

              {advice.suggestedAction && (
                <div className="flex items-center justify-between gap-2 text-sm text-amber-200/90 pt-1.5 border-t border-zinc-800/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Target className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-medium truncate">{advice.suggestedAction}</span>
                  </div>
                  {advice.suggestedMoveCategoryThai && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 font-medium">
                      {advice.suggestedMoveCategoryThai}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Key Principle / Concept Card */}
            {advice.keyConcept && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-start gap-2.5 text-sm text-amber-200/90">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300 block text-xs uppercase tracking-wider mb-1">
                    หลักการสำคัญ (Key Concept):
                  </span>
                  <span className="text-[13.5px] leading-relaxed italic text-zinc-200">
                    &ldquo;{advice.keyConcept}&rdquo;
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Welcome / Default State */
          <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2.5 text-sm flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>เริ่มต้นการฝึกฝนหมากล้อม</span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed font-normal">
              ยินดีต้อนรับสู่ GoMaster! ในช่วงเปิดเกม (Fuseki) ให้เน้นยึดมุม (Corner) ก่อนขยายสู่ริมกระดาน (Side)
              และระวังอย่าเพิ่งเข้าปะทะกลางกระดานจนกว่ากลุ่มหมากจะมีฐานที่มั่นคง
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
