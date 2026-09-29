'use client';

import React from 'react';
import { CoachAdviceResponse } from '@/lib/coach/gemini-coach';
import {
  BrainCircuit,
  Compass,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  Trophy,
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
  const getInitiativeStyle = (initiative?: 'Sente' | 'Gote' | 'Tenuki') => {
    switch (initiative) {
      case 'Sente':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
      case 'Gote':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
      case 'Tenuki':
        return 'bg-purple-950/40 text-purple-300 border-purple-800/40';
      default:
        return 'bg-zinc-950/40 text-zinc-400 border-zinc-800/60';
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-linear-to-b from-zinc-900 to-zinc-900/90 border border-zinc-800 text-zinc-200 shadow-xl flex flex-col gap-3 relative overflow-hidden ${className}`}
      data-testid="coach-advice-card"
    >
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 font-bold tracking-wider text-amber-400 uppercase">
          <BrainCircuit className="w-4 h-4 text-amber-400" />
          <span>AI Sensei (อาจารย์ 9 ดั้งอาชีพ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {advice?.isAiGenerated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Gemini Flash
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {gameMode === 'vs-ai' ? `คู่ต่อสู้: ${selectedRank}` : 'โหมดวิเคราะห์'}
          </span>
        </div>
      </div>

      {/* Advice Body */}
      {isLoading ? (
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col items-center justify-center gap-2 py-6 text-zinc-400 text-xs">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="animate-pulse text-zinc-300">
            อาจารย์ 9 ดั้งกำลังพิจารณารูปหมากตามผลประเมิน KataGo...
          </span>
        </div>
      ) : advice ? (
        <div className="space-y-3">
          {/* Tactical Feedback Box */}
          <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold text-xs tracking-tight">
                {advice.evaluationTitle}
              </span>
              {onRequestAdvice && (
                <button
                  onClick={onRequestAdvice}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-400 transition-colors"
                  title="ขอคำแนะนำใหม่อีกครั้ง"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>วิเคราะห์ซ้ำ</span>
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-normal">
              {advice.tacticalAdvice}
            </p>

            {advice.suggestedAction && (
              <div className="flex items-center gap-2 text-[11px] text-amber-200/90 pt-1 border-t border-zinc-800/60">
                <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-medium">{advice.suggestedAction}</span>
              </div>
            )}
          </div>

          {/* Key Principle / Concept Card */}
          {advice.keyConcept && (
            <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-start gap-2 text-xs text-amber-200/90">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300 block text-[11px] uppercase tracking-wider mb-0.5">
                  หลักการสำคัญ (Key Concept):
                </span>
                <span className="text-[11px] leading-relaxed italic text-zinc-300">
                  &ldquo;{advice.keyConcept}&rdquo;
                </span>
              </div>
            </div>
          )}

          {/* Bottom Badges: Initiative & Target Goal */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div
              className={`p-2 rounded-lg border flex items-center gap-1.5 font-medium ${getInitiativeStyle(
                advice.initiative
              )}`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{advice.initiativeThai}</span>
            </div>

            <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60 flex items-center gap-1.5 text-zinc-400 font-medium">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>เป้าหมาย: สู่ระดับ 1 ดั้ง</span>
            </div>
          </div>
        </div>
      ) : (
        /* Welcome / Default State */
        <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>เริ่มต้นการฝึกฝนหมากล้อม</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            ยินดีต้อนรับสู่ GoMaster! ในช่วงเปิดเกม (Fuseki) ให้เน้นยึดมุม (Corner) ก่อนขยายสู่ริมกระดาน (Side)
            และระวังอย่าเพิ่งเข้าปะทะกลางกระดานจนกว่ากลุ่มหมากจะมีฐานที่มั่นคง
          </p>
        </div>
      )}
    </div>
  );
};
