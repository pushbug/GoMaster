'use client';

import React, { useMemo, useState } from 'react';
import { CoachAdviceCard } from '@/components/go/CoachAdviceCard';
import { EngineStatusBadge } from '@/components/go/EngineStatusBadge';
import { EvaluationBar } from '@/components/go/EvaluationBar';
import { GoBoard } from '@/components/go/GoBoard';
import { GoControls } from '@/components/go/GoControls';
import { MatchHistoryModal } from '@/components/go/MatchHistoryModal';
import { MoveHistoryPanel } from '@/components/go/MoveHistoryPanel';
import { getHandicapPoints, NewGameConfig, NewGameModal } from '@/components/go/NewGameModal';
import { pointToString } from '@/lib/go/board';
import { getNextHeatmapMode, HeatmapMode } from '@/lib/go/history-analysis';
import { useGoGame } from '@/lib/hooks/useGoGame';
import { History, Layers, PlusCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [boardTheme, setBoardTheme] = useState<'wood' | 'slate' | 'minimal'>('wood');
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none');
  const [activeRightTab, setActiveRightTab] = useState<'coach' | 'history'>('coach');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isNewGameOpen, setIsNewGameOpen] = useState<boolean>(false);
  const [handicap, setHandicap] = useState<number>(0);
  const [komi, setKomi] = useState<number>(6.5);

  const {
    gameState,
    displayGameState,
    reviewStep,
    isReviewing,
    handleStepPrev,
    handleStepNext,
    handleStepFirst,
    handleStepLast,
    handleReturnToLive,
    handleSelectStep,
    gameMode,
    setGameMode,
    selectedRank,
    setSelectedRank,
    playerColor,
    setPlayerColor,
    isAiThinking,
    analysis,
    scoreLeadHistory,
    coachAdvice,
    isCoachLoading,
    isEngineMock,
    handlePlayMove,
    handlePass,
    handleResign,
    handleUndo,
    handleReset,
    requestCoachAdvice,
  } = useGoGame({ soundEnabled });

  const handleStartNewGame = (config: NewGameConfig) => {
    setBoardTheme(config.boardTheme);
    setSoundEnabled(config.soundEnabled);
    setGameMode(config.gameMode);
    setSelectedRank(config.selectedRank);
    setPlayerColor(config.playerColor);
    setHandicap(config.handicap);
    setKomi(config.komi);

    const handicapPts = getHandicapPoints(config.boardSize, config.handicap);
    handleReset(config.boardSize, handicapPts);
  };

  const currentConfig = useMemo<NewGameConfig>(
    () => ({
      boardSize: gameState.boardSize,
      gameMode,
      playerColor,
      selectedRank,
      handicap,
      komi,
      boardTheme,
      soundEnabled,
    }),
    [gameState.boardSize, gameMode, playerColor, selectedRank, handicap, komi, boardTheme, soundEnabled]
  );

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
          </div>
        </div>

        {/* Action Buttons & Status Indicators */}
        <div className="flex items-center gap-2.5 text-sm">
          {/* Start New Game Button */}
          <button
            onClick={() => setIsNewGameOpen(true)}
            data-testid="btn-new-game"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all text-sm"
            title="เริ่มเกมใหม่และปรับตั้งค่า"
          >
            <PlusCircle className="w-4 h-4 fill-current text-zinc-950" />
            <span>เริ่มเกมใหม่</span>
          </button>

          {/* Match History & SGF Trigger Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700/70 font-semibold transition-all shadow-sm active:scale-95 text-sm"
            title="เปิดประวัติการแข่งขันและดาวน์โหลด SGF"
          >
            <History className="w-3.5 h-3.5" />
            <span>ประวัติแข่ง & SGF</span>
          </button>

          {/* Coordinates Toggle */}
          <button
            onClick={() => setShowCoordinates(prev => !prev)}
            className={`hidden sm:flex px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              showCoordinates
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            พิกัด: {showCoordinates ? 'เปิด' : 'ปิด'}
          </button>

          <EngineStatusBadge isMock={analysis ? analysis.isMock : isEngineMock} />
        </div>
      </header>

      {/* 2. Workspace Body */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Go Board & Evaluation Surroundings (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-zinc-900/30 p-4 sm:p-6 rounded-3xl border border-zinc-800/60 shadow-2xl relative">
          <div className="w-full max-w-[min(100%,75vh)] flex flex-col items-center gap-3.5">
            {/* Top of Board: Evaluation Bar with Dual-Player Identity Badges */}
            <EvaluationBar
              winrate={analysis?.winrate ?? 50.0}
              scoreLead={analysis?.scoreLead ?? 0.0}
              ownershipGrid={analysis?.ownershipGrid}
              captures={displayGameState.captures}
              komi={komi}
              isThinking={isAiThinking}
              gameMode={gameMode}
              playerColor={playerColor}
              selectedRank={selectedRank}
              turn={displayGameState.turn}
              moveNumber={displayGameState.history.length}
              lastMoveText={
                displayGameState.lastMove
                  ? pointToString(displayGameState.lastMove, displayGameState.boardSize)
                  : null
              }
              lastMoveColor={
                displayGameState.history.length > 0
                  ? displayGameState.history[displayGameState.history.length - 1].color
                  : null
              }
              isGameOver={gameState.isGameOver}
              winner={gameState.winner}
              resignReason={gameState.resignReason}
              className="w-full"
            />

            {/* Center: Interactive Go Board (Displays review snapshot when reviewing, read-only) */}
            <GoBoard
              gameState={displayGameState}
              onPlayMove={handlePlayMove}
              interactive={!gameState.isGameOver && !isAiThinking && !isReviewing}
              showCoordinates={showCoordinates}
              showGhostStone={!isAiThinking && !isReviewing}
              soundEnabled={soundEnabled}
              boardTheme={boardTheme}
              ownershipMap={heatmapMode !== 'none' ? analysis?.ownershipGrid : null}
              heatmapMode={heatmapMode}
              className="w-full flex justify-center"
            />

            {/* Bottom of Board: In-Game Action Bar [Replay] [Heatmap Toggle] [ผ่าน] [ยอมแพ้] */}
            <GoControls
              gameState={gameState}
              onPass={handlePass}
              onResign={handleResign}
              onUndo={handleUndo}
              onOpenNewGame={() => setIsNewGameOpen(true)}
              isAiThinking={isAiThinking}
              heatmapMode={heatmapMode}
              onSelectHeatmapMode={setHeatmapMode}
              onToggleHeatmap={() => setHeatmapMode(prev => getNextHeatmapMode(prev))}
              reviewStep={reviewStep}
              isReviewing={isReviewing}
              onStepPrev={handleStepPrev}
              onStepNext={handleStepNext}
              onStepFirst={handleStepFirst}
              onStepLast={handleStepLast}
              onReturnToLive={handleReturnToLive}
              className="w-full"
            />
          </div>
        </div>

        {/* Right Column: 2-Tab Panel [คำแนะนำ AI] / [ประวัติการเดิน] (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Tab Navigation Controls */}
          <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-semibold shadow-lg">
            <button
              onClick={() => setActiveRightTab('coach')}
              data-testid="tab-coach"
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeRightTab === 'coach'
                  ? 'bg-linear-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>คำแนะนำ AI (Sensei)</span>
            </button>

            <button
              onClick={() => setActiveRightTab('history')}
              data-testid="tab-history"
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeRightTab === 'history'
                  ? 'bg-linear-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ประวัติการเดิน</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  activeRightTab === 'history'
                    ? 'bg-zinc-950/40 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {gameState.history.length}
              </span>
            </button>
          </div>

          {/* Active Tab Body */}
          {activeRightTab === 'coach' ? (
            <CoachAdviceCard
              advice={coachAdvice}
              isLoading={isCoachLoading}
              gameMode={gameMode}
              selectedRank={selectedRank}
              onRequestAdvice={() => requestCoachAdvice(gameState, analysis)}
            />
          ) : (
            <MoveHistoryPanel
              gameState={gameState}
              scoreLeadHistory={scoreLeadHistory}
              reviewStep={reviewStep}
              onSelectStep={handleSelectStep}
            />
          )}
        </div>
      </div>

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
        onStartGame={handleStartNewGame}
        currentConfig={currentConfig}
      />

      {/* Match History Modal (Contains SGF Download for each match) */}
      <MatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </main>
  );
}
