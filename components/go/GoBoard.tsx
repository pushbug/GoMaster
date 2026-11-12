'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { stringToPoint } from '@/lib/go/board';
import { buildVariationSteps, renderGoBoard, VariationStep } from '@/lib/go/board-renderer';
import { HeatmapMode } from '@/lib/go/history-analysis';
import { validateMove } from '@/lib/go/rules';
import { EMPTY, GameState, Point } from '@/lib/go/types';

interface GoBoardProps {
  gameState: GameState;
  onPlayMove: (point: Point) => void;
  interactive?: boolean;
  showCoordinates?: boolean;
  showGhostStone?: boolean;
  soundEnabled?: boolean;
  boardTheme?: 'wood' | 'slate' | 'minimal';
  ownershipMap?: number[][] | null; // values from -1.0 (white) to 1.0 (black)
  heatmapMode?: HeatmapMode;
  previewCandidateCoord?: string | null;
  previewPvCoords?: string[] | null;
  variationPreview?: VariationStep[] | null;
  deadStoneKeys?: Set<string> | null;
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
  heatmapMode = 'both',
  previewCandidateCoord = null,
  previewPvCoords = null,
  variationPreview = null,
  deadStoneKeys = null,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<{ point: Point | null; valid: boolean }>({
    point: null,
    valid: false,
  });
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [isHoverValid, setIsHoverValid] = useState<boolean>(false);
  const [displaySize, setDisplaySize] = useState<number>(600);

  const { board, boardSize, turn, lastMove, isGameOver } = gameState;

  // Responsive container size observer with modern ResizeObserver
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const minDim = Math.min(rect.width, rect.height);
        if (minDim > 0) {
          setDisplaySize(Math.floor(minDim));
        }
      }
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Board layout geometry with defensive coordinate margin
  const coordMargin = showCoordinates
    ? Math.max(38, Math.floor(displaySize * 0.068))
    : 14;
  const boardAreaSize = displaySize - coordMargin * 2;
  const cellSize = boardAreaSize / (boardSize - 1);
  const stoneRadius = (cellSize * 0.94) / 2;

  const previewPoint = useMemo(
    () => previewCandidateCoord
      ? stringToPoint(previewCandidateCoord, boardSize)
      : null,
    [previewCandidateCoord, boardSize]
  );

  const previewPointIsValid = useMemo(
    () => previewPoint
      ? validateMove(gameState, previewPoint, turn).valid
      : false,
    [gameState, previewPoint, turn]
  );

  const effectiveVariation = useMemo(
    () => variationPreview && variationPreview.length > 0
      ? variationPreview
      : previewPvCoords && previewPvCoords.length > 0
      ? buildVariationSteps(previewPvCoords, turn, boardSize, board)
      : null,
    [variationPreview, previewPvCoords, turn, boardSize, board]
  );

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
    const pixelSize = Math.floor(displaySize * dpr);
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const effectiveHoverPoint = hoverPoint || previewPoint;
    const effectiveIsHoverValid = hoverPoint
      ? isHoverValid
      : previewPointIsValid;

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
      heatmapMode,
      hoverPoint: effectiveHoverPoint,
      isHoverValid: effectiveIsHoverValid,
      interactive,
      showGhostStone,
      isGameOver,
      deadStoneKeys,
      variationPreview: effectiveVariation,
    });
  }, [
    displaySize,
    boardSize,
    board,
    boardTheme,
    showCoordinates,
    lastMove,
    ownershipMap,
    heatmapMode,
    hoverPoint,
    isHoverValid,
    previewPoint,
    previewPointIsValid,
    effectiveVariation,
    turn,
    interactive,
    showGhostStone,
    isGameOver,
    deadStoneKeys,
    coordMargin,
    boardAreaSize,
    cellSize,
    stoneRadius,
  ]);

  // Handle Mouse Move for Hover Preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || isGameOver) return;
    const pt = getBoardPointFromEvent(e);
    pendingHoverRef.current = {
      point: pt,
      valid: Boolean(
        pt &&
        board[pt.y][pt.x] === EMPTY &&
        validateMove(gameState, pt, turn).valid
      ),
    };

    if (hoverFrameRef.current === null) {
      hoverFrameRef.current = window.requestAnimationFrame(() => {
        hoverFrameRef.current = null;
        const next = pendingHoverRef.current;
        setHoverPoint(current => {
          if (
            current?.x === next.point?.x &&
            current?.y === next.point?.y
          ) {
            return current;
          }
          return next.point;
        });
        setIsHoverValid(current => current === next.valid ? current : next.valid);
      });
    }
  };

  const handleMouseLeave = () => {
    pendingHoverRef.current = { point: null, valid: false };
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
      hoverFrameRef.current = null;
    }
    setHoverPoint(null);
    setIsHoverValid(false);
  };

  useEffect(() => {
    return () => {
      if (hoverFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverFrameRef.current);
      }
    };
  }, []);

  // Handle Stone Click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || isGameOver) return;
    const pt = getBoardPointFromEvent(e);
    if (!pt) return;

    if (board[pt.y][pt.x] === EMPTY) {
      const validation = validateMove(gameState, pt, turn);
      if (validation.valid) {
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
        className="absolute max-w-full max-h-full rounded-lg shadow-xl cursor-pointer touch-none transition-shadow duration-200"
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
        }}
      />
    </div>
  );
};
