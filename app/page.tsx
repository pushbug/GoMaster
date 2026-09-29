'use client';

import React, { useState } from 'react';
import { CoachAdviceCard } from '@/components/go/CoachAdviceCard';
import { EngineStatusBadge } from '@/components/go/EngineStatusBadge';
import { EvaluationBar } from '@/components/go/EvaluationBar';
import { GameModeSelector } from '@/components/go/GameModeSelector';
import { GoBoard } from '@/components/go/GoBoard';
import { GoControls } from '@/components/go/GoControls';
import { MatchHistoryModal } from '@/components/go/MatchHistoryModal';
import { MoveHistoryPanel } from '@/components/go/MoveHistoryPanel';
import { pointToString } from '@/lib/go/board';
import { useGoGame } from '@/lib/hooks/useGoGame';
import { Info, Layers } from 'lucide-react';

export default function HomePage() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [boardTheme, setBoardTheme] = useState<'wood' | 'slate' | 'minimal'>('wood');
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const {
    gameState,
    gameMode,
    selectedRank,
    setSelectedRank,
    playerColor,
    isAiThinking,
    analysis,
    candidateMoves,
    coachAdvice,
    isCoachLoading,
    isEngineMock,
    handlePlayMove,
    handlePass,
    handleResign,
    handleUndo,
    handleReset,
    handleModeChange,
    handlePlayerColorChange,
    requestCoachAdvice,
  } = useGoGame({ soundEnabled });

  return (
    <main className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* 1. Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Layers className="w-5 h-5 text-zinc-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight bg-linear-to-r from-zinc-100 via-zinc-200 to-amber-400 bg-clip-text text-transparent">
                GoMaster
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                1 Dan Target
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              ฝึกหมากล้อมเพื่อก้าวสู่ระดับ 1 ดั้ง ด้วยพลัง KataGo + Gemini AI Coach
            </p>
          </div>
        </div>

        {/* Status Indicators & Settings */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setShowCoordinates(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showCoordinates
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            พิกัด A-T: {showCoordinates ? 'เปิด' : 'ปิด'}
          </button>

          <EngineStatusBadge isMock={analysis ? analysis.isMock : isEngineMock} />
        </div>
      </header>

      {/* 2. Workspace Body */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Go Board & Evaluation Bar (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-zinc-900/30 p-4 sm:p-6 rounded-3xl border border-zinc-800/60 shadow-2xl relative">
          <div className="w-full max-w-[min(100%,75vh)] flex flex-col items-center gap-4">
            {/* Live Evaluation Bar with matching width */}
            <EvaluationBar
              winrate={analysis?.winrate ?? 50.0}
              scoreLead={analysis?.scoreLead ?? 0.0}
              ownershipGrid={analysis?.ownershipGrid}
              captures={gameState.captures}
              komi={6.5}
              isThinking={isAiThinking}
              className="w-full"
            />

            <GoBoard
              gameState={gameState}
              onPlayMove={handlePlayMove}
              interactive={!gameState.isGameOver && !isAiThinking}
              showCoordinates={showCoordinates}
              showGhostStone={!isAiThinking}
              soundEnabled={soundEnabled}
              boardTheme={boardTheme}
              ownershipMap={showHeatmap ? analysis?.ownershipGrid : null}
              candidateMoves={candidateMoves}
              className="w-full flex justify-center"
            />

            {/* Quick Board Info Footer */}
            <div className="w-full flex items-center justify-between text-xs text-zinc-400 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>
                  เม็ดล่าสุด:{' '}
                  <strong className="text-zinc-200 font-mono">
                    {gameState.lastMove
                      ? pointToString(gameState.lastMove, gameState.boardSize)
                      : '-'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Game Mode, Controls, Coach, History (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Mode Selector & AI Difficulty Picker */}
          <GameModeSelector
            gameMode={gameMode}
            onChangeMode={handleModeChange}
            selectedRank={selectedRank}
            onChangeRank={setSelectedRank}
            playerColor={playerColor}
            onChangePlayerColor={handlePlayerColorChange}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(prev => !prev)}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />

          {/* Game Controls Panel */}
          <GoControls
            gameState={gameState}
            onPass={handlePass}
            onResign={handleResign}
            onUndo={handleUndo}
            onReset={handleReset}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
            boardTheme={boardTheme}
            onChangeTheme={setBoardTheme}
          />

          {/* AI Sensei Coach Card */}
          <CoachAdviceCard
            advice={coachAdvice}
            isLoading={isCoachLoading}
            gameMode={gameMode}
            selectedRank={selectedRank}
            onRequestAdvice={() => requestCoachAdvice(gameState, analysis)}
          />

          {/* Move History Panel */}
          <MoveHistoryPanel gameState={gameState} />

          {/* Quick Go Rules Cheat Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50 text-xs text-zinc-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-zinc-300">กฎกติกาที่ตรวจจับอัตโนมัติ:</div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                • คำนวณลมหายใจ (Liberties) และตรวจจับการล้อมกินกลุ่มหมาก (Group Capture)
                <br />
                • ป้องกันการวางหมากฆ่าตัวตาย (Suicide Rule) เว้นแต่เป็นการจับกินหมากฝ่ายตรงข้าม
                <br />
                • บังคับใช้กฎโคะ (Simple Ko Rule) ห้ามแย่งกินคืนทันทีในรูปซ้ำเดิม
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match History Modal */}
      <MatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </main>
  );
}
