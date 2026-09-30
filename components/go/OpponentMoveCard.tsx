'use client';

import React from 'react';
import { ScoreDeltaInfo } from '@/lib/go/history-analysis';
import { BLACK, Stone } from '@/lib/go/types';
import { Compass, Crosshair, HelpCircle, TrendingDown, TrendingUp } from 'lucide-react';

export interface OpponentMoveCardProps {
  moveNumber?: number;
  lastMoveCoord?: string | null;
  lastMoveColor?: Stone | null;
  scoreDelta?: ScoreDeltaInfo | null;
  opponentIntent?: string | null;
  initiative?: 'Sente' | 'Gote' | 'Tenuki';
  initiativeThai?: string;
  className?: string;
}

export const OpponentMoveCard: React.FC<OpponentMoveCardProps> = ({
  moveNumber = 0,
  lastMoveCoord = null,
  lastMoveColor = null,
  scoreDelta = null,
  opponentIntent = null,
  initiative,
  initiativeThai,
  className = '',
}) => {
  const getInitiativeStyle = (init?: 'Sente' | 'Gote' | 'Tenuki') => {
    switch (init) {
      case 'Sente':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Gote':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Tenuki':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/60';
    }
  };

  const hasMove = Boolean(lastMoveCoord && moveNumber > 0);

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 shadow-xl flex flex-col gap-2.5 ${className}`}
      data-testid="opponent-move-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/70">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-sky-400">
          <Crosshair className="w-4 h-4 text-sky-400" />
          <span>วิเคราะห์หมากคู่แข่ง (Opponent Move)</span>
        </div>
        {hasMove && (
          <span className="text-[11px] font-mono text-zinc-400">
            {`ตาที่ #${moveNumber}`}
          </span>
        )}
      </div>

      {!hasMove ? (
        /* Empty / Initial State before opponent plays */
        <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex items-center gap-2.5 text-xs text-zinc-400">
          <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>ยังไม่มีการเดินหมากของคู่ต่อสู้ ระบบจะวิเคราะห์เจตนาเมื่อมีหมากใหม่</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Move Coordinates & Metrics Bar */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-2">
              {/* Stone Color Token */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs border shadow-xs ${
                  lastMoveColor === BLACK
                    ? 'bg-zinc-950 text-zinc-100 border-zinc-700'
                    : 'bg-zinc-100 text-zinc-950 border-zinc-300'
                }`}
                title={lastMoveColor === BLACK ? 'หมากดำ' : 'หมากขาว'}
              >
                {lastMoveColor === BLACK ? '●' : '○'}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono font-bold text-sm text-sky-300"
                    data-testid="opponent-move-coord"
                  >
                    {lastMoveCoord}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {lastMoveColor === BLACK ? 'หมากดำ' : 'หมากขาว'}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Delta & Initiative Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Sente / Gote Badge */}
              {initiativeThai && (
                <div
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${getInitiativeStyle(
                    initiative
                  )}`}
                  title={`จังหวะการเดิน: ${initiative ?? 'Normal'}`}
                >
                  <Compass className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[110px]">{initiativeThai}</span>
                </div>
              )}

              {/* Point Delta Badge */}
              {scoreDelta && (
                <div
                  className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                    scoreDelta.isGain
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : scoreDelta.isLoss
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700/60'
                  }`}
                  data-testid="opponent-score-delta"
                  title="การเปลี่ยนแปลงแต้มนำจากการเดินตานี้"
                >
                  {scoreDelta.isGain ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : scoreDelta.isLoss ? (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  ) : null}
                  <span>{`${scoreDelta.formatted} แต้ม`}</span>
                </div>
              )}
            </div>
          </div>

          {/* Strategic Intent Paragraph */}
          <div
            className="p-3 rounded-xl bg-zinc-950/70 border border-sky-900/30 flex items-start gap-2.5 text-xs text-sky-200/90"
            data-testid="move-intent-box"
          >
            <div className="min-w-0">
              <span className="font-semibold text-sky-300 block text-[11px] uppercase tracking-wider mb-1">
                เจตนาของหมากคู่แข่ง (Opponent Intent):
              </span>
              <p
                className="text-xs text-zinc-200 leading-relaxed font-normal"
                data-testid="opponent-intent-text"
              >
                {opponentIntent || 'รอการวิเคราะห์เชิงกลยุทธ์จากอาจารย์ 9 ดั้ง...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
