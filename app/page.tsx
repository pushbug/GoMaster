'use client';

import React, { useMemo, useState } from 'react';
import { AnalysisPanel, AnalysisTab } from '@/components/go/AnalysisPanel';
import { AppHeader } from '@/components/go/AppHeader';
import { EvaluationBar } from '@/components/go/EvaluationBar';
import { GoBoard } from '@/components/go/GoBoard';
import { GoControls } from '@/components/go/GoControls';
import { GameWorkspace } from '@/components/go/GameWorkspace';
import { MatchHistoryModal } from '@/components/go/MatchHistoryModal';
import { getHandicapPoints, NewGameConfig, NewGameModal } from '@/components/go/NewGameModal';
import { VictoryModal } from '@/components/go/VictoryModal';
import { pointToString } from '@/lib/go/board';
import { calculateMoveScoreDelta, getNextHeatmapMode, HeatmapMode } from '@/lib/go/history-analysis';
import { useGoGame } from '@/lib/hooks/useGoGame';

export default function HomePage() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [boardTheme, setBoardTheme] = useState<'wood' | 'slate' | 'minimal'>('wood');
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none');
  const [activeRightTab, setActiveRightTab] = useState<AnalysisTab>('coach');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isNewGameOpen, setIsNewGameOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [zenMode, setZenMode] = useState<boolean>(false);
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
    winrateHistory,
    coachAdvice,
    isCoachLoading,
    previewCandidateCoord,
    setPreviewCandidateCoord,
    previewPvCoords,
    setPreviewPvCoords,
    isEngineMock,
    deadStonesSummary,
    showDeadStones,
    toggleShowDeadStones,
    effectiveDeadStoneKeys,
    isVictoryModalOpen,
    setIsVictoryModalOpen,
    handlePlayMove,
    handlePass,
    handleResign,
    handleUndo,
    handleReset,
    requestCoachAdvice,
  } = useGoGame({ soundEnabled, zenMode });

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

  // Synchronize EvaluationBar during replay review vs live game
  const isReplayActive = isReviewing && reviewStep !== null;
  const clampedReviewIndex = isReplayActive
    ? Math.min(Math.max(0, reviewStep), Math.max(0, winrateHistory.length - 1))
    : 0;

  const displayWinrate = isReplayActive
    ? (winrateHistory[clampedReviewIndex] ?? 50.0)
    : (analysis?.winrate ?? 50.0);

  const displayScoreLead = isReplayActive
    ? (scoreLeadHistory[clampedReviewIndex] ?? 0.0)
    : (analysis?.scoreLead ?? 0.0);

  const displayIsGameOver = isReplayActive ? false : gameState.isGameOver;
  const displayWinner = isReplayActive ? null : gameState.winner;
  const displayResignReason = isReplayActive ? null : gameState.resignReason;

  const lastMoveRecord = displayGameState.history.length > 0
    ? displayGameState.history[displayGameState.history.length - 1]
    : null;

  const opponentScoreDelta = useMemo(() => {
    if (!lastMoveRecord) return null;
    return calculateMoveScoreDelta(lastMoveRecord.moveNumber, lastMoveRecord.color, scoreLeadHistory);
  }, [lastMoveRecord, scoreLeadHistory]);

  return (
    <main className="h-dvh flex flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <AppHeader
        showCoordinates={showCoordinates}
        zenMode={zenMode}
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        isEngineMock={analysis ? analysis.isMock : isEngineMock}
        onOpenNewGame={() => setIsNewGameOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onToggleCoordinates={() => setShowCoordinates(value => !value)}
        onToggleZenMode={() => setZenMode(value => !value)}
        onToggleSidebar={() => setIsSidebarOpen(value => !value)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(value => !value)}
      />

      <GameWorkspace
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        board={(
          <div className="mx-auto h-full w-full max-w-[1020px] flex flex-col items-center gap-2.5">
            {/* Top of Board: Evaluation Bar with Dual-Player Identity Badges */}
            <EvaluationBar
              winrate={displayWinrate}
              scoreLead={displayScoreLead}
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
              isGameOver={displayIsGameOver}
              winner={displayWinner}
              resignReason={displayResignReason}
              zenMode={zenMode}
              className="w-full shrink-0"
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
              ownershipMap={!zenMode && heatmapMode !== 'none' ? analysis?.ownershipGrid : null}
              heatmapMode={zenMode ? 'none' : heatmapMode}
              previewCandidateCoord={zenMode ? null : previewCandidateCoord}
              previewPvCoords={zenMode ? [] : previewPvCoords}
              deadStoneKeys={effectiveDeadStoneKeys}
              className="w-full flex-1 min-h-[200px]"
            />

            {/* Bottom of Board: In-Game Action Bar [Replay] [Heatmap Toggle] [ผ่าน] [ยอมแพ้] */}
            <GoControls
              gameState={gameState}
              onPass={handlePass}
              onResign={handleResign}
              onUndo={handleUndo}
              onOpenNewGame={() => setIsNewGameOpen(true)}
              onOpenVictoryModal={() => setIsVictoryModalOpen(true)}
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
              className="w-full shrink-0"
            />
          </div>
        )}
        analysisPanel={(
          <AnalysisPanel
            isSidebarOpen={isSidebarOpen}
            isMobileSidebarOpen={isMobileSidebarOpen}
            activeTab={activeRightTab}
            onChangeTab={setActiveRightTab}
            gameState={gameState}
            displayGameState={displayGameState}
            analysis={analysis}
            coachAdvice={coachAdvice}
            isCoachLoading={isCoachLoading}
            isAiThinking={isAiThinking}
            gameMode={gameMode}
            selectedRank={selectedRank}
            scoreLeadHistory={scoreLeadHistory}
            reviewStep={reviewStep}
            opponentScoreDelta={opponentScoreDelta}
            previewPvCoords={previewPvCoords}
            onRequestAdvice={() => requestCoachAdvice(gameState, analysis)}
            onPlayMove={point => {
              setPreviewCandidateCoord(null);
              setPreviewPvCoords(null);
              handlePlayMove(point);
            }}
            onHoverCandidate={setPreviewCandidateCoord}
            onPreviewVariation={setPreviewPvCoords}
            onSelectHistoryStep={handleSelectStep}
          />
        )}
      />

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

      {/* Post-Match Victory & Dragon Autopsy Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen && gameState.isGameOver}
        onClose={() => setIsVictoryModalOpen(false)}
        onNewGame={() => {
          setIsVictoryModalOpen(false);
          setIsNewGameOpen(true);
        }}
        winner={gameState.winner === null ? null : gameState.winner === 1 ? 'B' : 'W'}
        playerColor={playerColor}
        resignReason={gameState.resignReason}
        scoreLead={analysis?.scoreLead ?? 0}
        captures={gameState.captures}
        deadStonesSummary={deadStonesSummary}
        showDeadStones={showDeadStones}
        onToggleDeadStones={toggleShowDeadStones}
        showHeatmap={heatmapMode !== 'none'}
        onToggleHeatmap={() => setHeatmapMode(prev => getNextHeatmapMode(prev))}
      />
    </main>
  );
}
