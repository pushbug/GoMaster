'use client';

import React, { useRef } from 'react';
import { History, Loader2, Sparkles } from 'lucide-react';
import { CoachAdviceResponse } from '@/lib/coach/gemini-coach';
import { Rank } from '@/lib/engine/difficulty';
import { EngineAnalysisResult } from '@/lib/engine/types';
import { pointToString } from '@/lib/go/board';
import { ScoreDeltaInfo } from '@/lib/go/history-analysis';
import { GameState, Point } from '@/lib/go/types';
import { GameMode } from './GameModeSelector';
import { CandidateMovesCard } from './CandidateMovesCard';
import { CoachAdviceCard } from './CoachAdviceCard';
import { GamePhaseBar } from './GamePhaseBar';
import { MoveHistoryPanel } from './MoveHistoryPanel';
import { OpponentMoveCard } from './OpponentMoveCard';

export type AnalysisTab = 'coach' | 'history';

interface AnalysisPanelProps {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  activeTab: AnalysisTab;
  onChangeTab: (tab: AnalysisTab) => void;
  gameState: GameState;
  displayGameState: GameState;
  analysis: EngineAnalysisResult | null;
  coachAdvice: CoachAdviceResponse | null;
  isCoachLoading: boolean;
  isAiThinking: boolean;
  gameMode: GameMode;
  selectedRank: Rank;
  scoreLeadHistory: number[];
  reviewStep: number | null;
  opponentScoreDelta: ScoreDeltaInfo | null;
  previewPvCoords: string[] | null;
  onRequestAdvice: () => void;
  onPlayMove: (point: Point) => void;
  onHoverCandidate: (coord: string | null) => void;
  onPreviewVariation: (pv: string[] | null) => void;
  onSelectHistoryStep: (step: number) => void;
}

export function AnalysisPanel({
  isSidebarOpen,
  isMobileSidebarOpen,
  activeTab,
  onChangeTab,
  gameState,
  displayGameState,
  analysis,
  coachAdvice,
  isCoachLoading,
  isAiThinking,
  gameMode,
  selectedRank,
  scoreLeadHistory,
  reviewStep,
  opponentScoreDelta,
  previewPvCoords,
  onRequestAdvice,
  onPlayMove,
  onHoverCandidate,
  onPreviewVariation,
  onSelectHistoryStep,
}: AnalysisPanelProps) {
  const adviceDetailsRef = useRef<HTMLDialogElement>(null);
  const lastMoveRecord = displayGameState.history.at(-1) ?? null;
  const lastMoveCoord = displayGameState.lastMove
    ? pointToString(displayGameState.lastMove, displayGameState.boardSize)
    : null;

  return (
    <div
      id="game-analysis"
      className={`${isMobileSidebarOpen ? 'flex' : 'hidden'} ${isSidebarOpen ? 'lg:flex' : 'lg:hidden'} lg:col-span-4 min-h-0 min-w-0 flex-col gap-3`}
    >
      <div className="flex shrink-0 items-center p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-semibold shadow-lg">
        <button
          onClick={() => onChangeTab('coach')}
          data-testid="tab-coach"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'coach'
              ? 'bg-linear-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>คำแนะนำ AI (Sensei)</span>
        </button>

        <button
          onClick={() => onChangeTab('history')}
          data-testid="tab-history"
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-linear-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>ประวัติการเดิน</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            activeTab === 'history'
              ? 'bg-zinc-950/40 text-zinc-950 font-bold'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {gameState.history.length}
          </span>
        </button>
      </div>

      <div className={activeTab === 'coach' ? 'advice-viewport min-h-0 flex-1' : 'min-h-0 overflow-y-auto overscroll-contain'}>
        {activeTab === 'coach' ? (
          <div className="advice-overview flex flex-col gap-2">
            <GamePhaseBar
              moveNumber={displayGameState.history.length}
              boardSize={displayGameState.boardSize}
              className="advice-phase w-full"
            />

            <button
              type="button"
              onClick={() => adviceDetailsRef.current?.showModal()}
              className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-left text-sm hover:border-amber-500/50"
            >
              <span className="flex items-center justify-between gap-2 text-amber-400">
                <span className="flex items-center gap-2 font-bold">
                  AI Sensei
                  <span className="grid size-4 place-items-center" role="status">
                    {isCoachLoading && (
                      <>
                        <Loader2 aria-hidden="true" className="size-3 motion-safe:animate-spin" />
                        <span className="sr-only">กำลังวิเคราะห์</span>
                      </>
                    )}
                  </span>
                </span>
                <span className="text-xs">อ่านคำแนะนำฉบับเต็ม</span>
              </span>
              <span className="advice-summary mt-1 line-clamp-2 break-words">
                {coachAdvice?.tacticalAdvice ?? 'เริ่มต้นการฝึกฝนหมากล้อม'}
              </span>
            </button>

            {lastMoveRecord && lastMoveCoord && (
              <button
                type="button"
                onClick={() => adviceDetailsRef.current?.showModal()}
                className="advice-opponent rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-left text-xs text-sky-300 hover:border-sky-500/50"
              >
                หมากล่าสุดของคู่แข่ง {lastMoveCoord}
              </button>
            )}

            <dialog
              ref={adviceDetailsRef}
              aria-label="รายละเอียดคำแนะนำและหมากคู่แข่ง"
              className="fixed inset-0 m-auto max-h-[90dvh] w-[min(94vw,36rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-100 backdrop:bg-black/70"
            >
              <form method="dialog" className="sticky top-0 z-10 mb-2 flex justify-end bg-zinc-950">
                <button autoFocus className="rounded-lg bg-zinc-800 px-3 py-1.5">ปิด</button>
              </form>
              <div className="flex flex-col gap-2">
                <GamePhaseBar
                  moveNumber={displayGameState.history.length}
                  boardSize={displayGameState.boardSize}
                />
                <CoachAdviceCard
                  advice={coachAdvice}
                  isLoading={isCoachLoading}
                  gameMode={gameMode}
                  selectedRank={selectedRank}
                  onRequestAdvice={onRequestAdvice}
                />
                <OpponentMoveCard
                  moveNumber={lastMoveRecord?.moveNumber ?? 0}
                  lastMoveCoord={lastMoveCoord}
                  lastMoveColor={lastMoveRecord?.color ?? null}
                  scoreDelta={opponentScoreDelta}
                  opponentIntent={coachAdvice?.opponentMoveIntent ?? null}
                  initiative={coachAdvice?.initiative}
                  initiativeThai={coachAdvice?.initiativeThai}
                />
              </div>
            </dialog>

            <CandidateMovesCard
              compact
              candidates={analysis?.suggestedMoves ?? []}
              explanations={coachAdvice?.candidateExplanations}
              isAiThinking={isAiThinking}
              activePreviewPv={previewPvCoords}
              onSelectMove={(_coord, point) => onPlayMove(point)}
              onHoverMove={onHoverCandidate}
              onPreviewVariation={onPreviewVariation}
            />
          </div>
        ) : (
          <MoveHistoryPanel
            gameState={gameState}
            scoreLeadHistory={scoreLeadHistory}
            reviewStep={reviewStep}
            onSelectStep={onSelectHistoryStep}
          />
        )}
      </div>
    </div>
  );
}
