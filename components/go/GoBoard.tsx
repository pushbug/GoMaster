'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CandidateMove, renderGoBoard } from '@/lib/go/board-renderer';
import { validateMove } from '@/lib/go/rules';
import { stoneSoundEngine } from '@/lib/go/sound';
import { EMPTY, GameState, Point } from '@/lib/go/types';

export type { CandidateMove };

interface GoBoardProps {
  gameState: GameState;
  onPlayMove: (point: Point) => void;
  interactive?: boolean;
  showCoordinates?: boolean;
  showGhostStone?: boolean;
  soundEnabled?: boolean;
  boardTheme?: 'wood' | 'slate' | 'minimal';
  ownershipMap?: number[][] | null; // values from -1.0 (white) to 1.0 (black)
  candidateMoves?: CandidateMove[] | null;
  className?: string;
}

export const GoBoard: React.FC<GoBoardProps> = ({
  gameState,
  onPlayMove,
  interactive = true,
  showCoordinates = true,
  showGhostStone = true,
  soundEnabled = true,
  boardTheme = 'wood',
  ownershipMap = null,
  candidateMoves = null,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [isHoverValid, setIsHoverValid] = useState<boolean>(false);
  const [displaySize, setDisplaySize] = useState<number>(600);

  const { board, boardSize, turn, lastMove, isGameOver } = gameState;

  // Responsive container size observer
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const minDim = Math.min(rect.width, window.innerHeight * 0.75);
        if (minDim > 0) {
          setDisplaySize(Math.floor(minDim));
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Board layout geometry with defensive coordinate margin
  const coordMargin = showCoordinates
    ? Math.max(38, Math.floor(displaySize * 0.068))
    : 14;
  const boardAreaSize = displaySize - coordMargin * 2;
  const cellSize = boardAreaSize / (boardSize - 1);
  const stoneRadius = (cellSize * 0.94) / 2;

  const getBoardPointFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find closest intersection
      const x = Math.round((mouseX - coordMargin) / cellSize);
      const y = Math.round((mouseY - coordMargin) / cellSize);

      if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
        return { x, y };
      }
      return null;
    },
    [coordMargin, cellSize, boardSize]
  );

  // Canvas drawing loop delegated to board-renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    ctx.scale(dpr, dpr);

    renderGoBoard({
      ctx,
      displaySize,
      dpr,
      boardSize,
      board,
      boardTheme,
      showCoordinates,
      coordMargin,
      boardAreaSize,
      cellSize,
      stoneRadius,
      turn,
      lastMove,
      ownershipMap,
      candidateMoves,
      hoverPoint,
      isHoverValid,
      interactive,
      showGhostStone,
      isGameOver,
    });
  }, [
    displaySize,
    boardSize,
    board,
    boardTheme,
    showCoordinates,
    lastMove,
    ownershipMap,
    candidateMoves,
    hoverPoint,
    isHoverValid,
    turn,
    interactive,
    showGhostStone,
    isGameOver,
    coordMargin,
    boardAreaSize,
    cellSize,
    stoneRadius,
  ]);

  // Handle Mouse Move for Hover Preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || isGameOver) return;
    const pt = getBoardPointFromEvent(e);
    if (!pt) {
      setHoverPoint(null);
      return;
    }

    if (!hoverPoint || hoverPoint.x !== pt.x || hoverPoint.y !== pt.y) {
      setHoverPoint(pt);
      if (board[pt.y][pt.x] === EMPTY) {
        const validation = validateMove(gameState, pt, turn);
        setIsHoverValid(validation.valid);
      } else {
        setIsHoverValid(false);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  // Handle Stone Click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || isGameOver) return;
    const pt = getBoardPointFromEvent(e);
    if (!pt) return;

    if (board[pt.y][pt.x] === EMPTY) {
      const validation = validateMove(gameState, pt, turn);
      if (validation.valid) {
        if (soundEnabled) {
          stoneSoundEngine.playStoneClick();
        }
        onPlayMove(pt);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      data-testid="go-board-wrapper"
    >
      <canvas
        ref={canvasRef}
        data-testid="go-board"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-lg shadow-xl cursor-pointer touch-none transition-shadow duration-200"
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
        }}
      />
    </div>
  );
};
