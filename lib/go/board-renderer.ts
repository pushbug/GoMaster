import { COLUMN_LETTERS, getStarPoints, stringToPoint } from './board';
import { HeatmapMode } from './history-analysis';
import { BLACK, BoardSize, EMPTY, Point, Stone, WHITE } from './types';

export interface BoardThemeColors {
  background: string;
  gridLine: string;
  starPoint: string;
  coordText: string;
  border: string;
}

export interface VariationStep {
  point: Point;
  color: Stone;
  stepNumber: number;
}

export interface BoardRenderParams {
  ctx: CanvasRenderingContext2D;
  displaySize: number;
  dpr: number;
  boardSize: BoardSize;
  board: Stone[][];
  boardTheme: 'wood' | 'slate' | 'minimal';
  showCoordinates: boolean;
  coordMargin: number;
  boardAreaSize: number;
  cellSize: number;
  stoneRadius: number;
  turn: Stone;
  lastMove: Point | null;
  ownershipMap?: number[][] | null;
  heatmapMode?: HeatmapMode;
  hoverPoint: Point | null;
  isHoverValid: boolean;
  interactive: boolean;
  showGhostStone: boolean;
  isGameOver: boolean;
  deadStoneKeys?: Set<string> | null;
  variationPreview?: VariationStep[] | null;
}

/**
 * Calculates canvas pixel position from board grid coordinates
 */
export function getCanvasCoords(
  x: number,
  y: number,
  coordMargin: number,
  cellSize: number
): { cx: number; cy: number } {
  return {
    cx: coordMargin + x * cellSize,
    cy: coordMargin + y * cellSize,
  };
}

/**
 * Draws an elegant red cross marker (✕) over a dead stone
 */
export function drawDeadStoneMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  stoneRadius: number
): void {
  ctx.save();
  ctx.strokeStyle = '#ef4444'; // Red-500
  ctx.lineWidth = Math.max(2, stoneRadius * 0.18);
  ctx.lineCap = 'round';
  const r = stoneRadius * 0.4;

  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the board background texture, gradient, and outer bevel border
 */
export function drawBoardBackground(
  ctx: CanvasRenderingContext2D,
  displaySize: number,
  boardTheme: 'wood' | 'slate' | 'minimal'
): void {
  if (boardTheme === 'wood') {
    const woodGrad = ctx.createLinearGradient(0, 0, displaySize, displaySize);
    woodGrad.addColorStop(0, '#e8c078');
    woodGrad.addColorStop(0.5, '#deb066');
    woodGrad.addColorStop(1, '#d4a456');
    ctx.fillStyle = woodGrad;
  } else if (boardTheme === 'slate') {
    ctx.fillStyle = '#27272a'; // zinc-800
  } else {
    ctx.fillStyle = '#f4f4f5'; // zinc-100
  }
  ctx.fillRect(0, 0, displaySize, displaySize);
}

/**
 * Draws alphanumeric coordinates (A-T without I, and 1-N) around the board edges
 */
export function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  displaySize: number,
  boardSize: BoardSize,
  boardTheme: 'wood' | 'slate' | 'minimal',
  coordMargin: number,
  cellSize: number
): void {
  ctx.font = `600 ${Math.max(10, Math.floor(cellSize * 0.36))}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = boardTheme === 'slate' ? '#a1a1aa' : '#573d1c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const labelOffset = Math.round(coordMargin * 0.38);

  for (let i = 0; i < boardSize; i++) {
    const { cx, cy } = getCanvasCoords(i, i, coordMargin, cellSize);
    const colLetter = COLUMN_LETTERS[i];
    const rowNum = String(boardSize - i);

    // Top & Bottom Column Letters
    ctx.fillText(colLetter, cx, labelOffset);
    ctx.fillText(colLetter, cx, displaySize - labelOffset);

    // Left & Right Row Numbers
    ctx.fillText(rowNum, labelOffset, cy);
    ctx.fillText(rowNum, displaySize - labelOffset, cy);
  }
}

/**
 * Draws grid lines and star points (hoshi)
 */
export function drawGridAndStars(
  ctx: CanvasRenderingContext2D,
  boardSize: BoardSize,
  boardTheme: 'wood' | 'slate' | 'minimal',
  coordMargin: number,
  cellSize: number
): void {
  // Grid Lines
  ctx.strokeStyle = boardTheme === 'slate' ? '#52525b' : '#452f13';
  ctx.lineWidth = 1;

  for (let i = 0; i < boardSize; i++) {
    const pStart = getCanvasCoords(i, 0, coordMargin, cellSize);
    const pEnd = getCanvasCoords(i, boardSize - 1, coordMargin, cellSize);
    ctx.beginPath();
    ctx.moveTo(pStart.cx, pStart.cy);
    ctx.lineTo(pEnd.cx, pEnd.cy);
    ctx.stroke();

    const hStart = getCanvasCoords(0, i, coordMargin, cellSize);
    const hEnd = getCanvasCoords(boardSize - 1, i, coordMargin, cellSize);
    ctx.beginPath();
    ctx.moveTo(hStart.cx, hStart.cy);
    ctx.lineTo(hEnd.cx, hEnd.cy);
    ctx.stroke();
  }

  // Star Points (Hoshi)
  const starPoints = getStarPoints(boardSize);
  ctx.fillStyle = boardTheme === 'slate' ? '#71717a' : '#3d2910';
  const starRadius = boardSize === 19 ? 3.5 : 3;

  for (const pt of starPoints) {
    const { cx, cy } = getCanvasCoords(pt.x, pt.y, coordMargin, cellSize);
    ctx.beginPath();
    ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws KataGo territory ownership heatmap boxes
 */
export function drawOwnershipHeatmap(
  ctx: CanvasRenderingContext2D,
  ownershipMap: number[][],
  boardSize: BoardSize,
  coordMargin: number,
  cellSize: number,
  heatmapMode: HeatmapMode = 'both'
): void {
  if (heatmapMode === 'none') return;

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const val = ownershipMap[y]?.[x] ?? 0;
      if (Math.abs(val) > 0.05) {
        if (heatmapMode === 'black' && val <= 0.05) continue;
        if (heatmapMode === 'white' && val >= -0.05) continue;

        const { cx, cy } = getCanvasCoords(x, y, coordMargin, cellSize);
        const boxR = cellSize * 0.42;
        ctx.fillStyle =
          val > 0
            ? `rgba(0, 0, 0, ${Math.min(0.6, val * 0.6)})`
            : `rgba(255, 255, 255, ${Math.min(0.6, -val * 0.6)})`;
        ctx.fillRect(cx - boxR, cy - boxR, boxR * 2, boxR * 2);
      }
    }
  }
}

/**
 * Draws a single Go stone with realistic drop shadow and 3D radial lighting
 */
export function drawStone(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  stoneRadius: number,
  stoneColor: Stone,
  opacity = 1
): void {
  ctx.save();
  ctx.globalAlpha = opacity;

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = Math.max(3, stoneRadius * 0.25);
  ctx.shadowOffsetX = stoneRadius * 0.1;
  ctx.shadowOffsetY = stoneRadius * 0.15;

  ctx.beginPath();
  ctx.arc(cx, cy, stoneRadius, 0, Math.PI * 2);

  if (stoneColor === BLACK) {
    // Black Stone with subtle top-left radial reflection
    const grad = ctx.createRadialGradient(
      cx - stoneRadius * 0.3,
      cy - stoneRadius * 0.35,
      stoneRadius * 0.1,
      cx,
      cy,
      stoneRadius
    );
    grad.addColorStop(0, '#404040');
    grad.addColorStop(0.4, '#1c1c1c');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
  } else {
    // White Stone with soft pearlescent shell gradient
    const grad = ctx.createRadialGradient(
      cx - stoneRadius * 0.3,
      cy - stoneRadius * 0.35,
      stoneRadius * 0.1,
      cx,
      cy,
      stoneRadius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.7, '#f4f4f5');
    grad.addColorStop(1, '#d4d4d8');
    ctx.fillStyle = grad;
  }

  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Outline ring for white stones
  if (stoneColor === WHITE) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws all placed stones on the board
 */
export function drawStones(
  ctx: CanvasRenderingContext2D,
  board: Stone[][],
  boardSize: BoardSize,
  coordMargin: number,
  cellSize: number,
  stoneRadius: number,
  deadStoneKeys?: Set<string> | null
): void {
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const stone = board[y][x];
      if (stone !== EMPTY) {
        const { cx, cy } = getCanvasCoords(x, y, coordMargin, cellSize);
        const isDead = deadStoneKeys?.has(`${x},${y}`) ?? false;
        drawStone(ctx, cx, cy, stoneRadius, stone, isDead ? 0.35 : 1);
        if (isDead) {
          drawDeadStoneMarker(ctx, cx, cy, stoneRadius);
        }
      }
    }
  }
}

/**
 * Draws last-move indicator ring
 */
export function drawLastMoveMarker(
  ctx: CanvasRenderingContext2D,
  lastMove: Point,
  board: Stone[][],
  coordMargin: number,
  cellSize: number,
  stoneRadius: number
): void {
  if (board[lastMove.y]?.[lastMove.x] === EMPTY) return;

  const { cx, cy } = getCanvasCoords(lastMove.x, lastMove.y, coordMargin, cellSize);
  const isBlack = board[lastMove.y][lastMove.x] === BLACK;
  const markerRadius = stoneRadius * 0.38;

  ctx.beginPath();
  ctx.arc(cx, cy, markerRadius, 0, Math.PI * 2);
  ctx.strokeStyle = isBlack ? '#ffffff' : '#09090b';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

/**
 * Draws ghost stone preview on hover or red cross if invalid move
 */
export function drawGhostStone(
  ctx: CanvasRenderingContext2D,
  hoverPoint: Point,
  isHoverValid: boolean,
  turn: Stone,
  coordMargin: number,
  cellSize: number,
  stoneRadius: number
): void {
  const { cx, cy } = getCanvasCoords(hoverPoint.x, hoverPoint.y, coordMargin, cellSize);

  if (isHoverValid) {
    drawStone(ctx, cx, cy, stoneRadius, turn, 0.5);
  } else {
    // Red cross / invalid indicator
    const crossSize = stoneRadius * 0.5;
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy - crossSize);
    ctx.lineTo(cx + crossSize, cy + crossSize);
    ctx.moveTo(cx + crossSize, cy - crossSize);
    ctx.lineTo(cx - crossSize, cy + crossSize);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Helper to construct sequential variation steps from PV coordinate strings
 */
export function buildVariationSteps(
  pvCoords: string[],
  initialTurn: Stone,
  boardSize: BoardSize,
  board: Stone[][]
): VariationStep[] {
  if (!pvCoords || pvCoords.length === 0) return [];
  const steps: VariationStep[] = [];
  let currentTurn = initialTurn;

  for (let i = 0; i < pvCoords.length; i++) {
    const coord = pvCoords[i];
    if (!coord || coord.toLowerCase() === 'pass') continue;
    const pt = stringToPoint(coord, boardSize);
    if (!pt) continue;
    // Don't draw over an already occupied intersection on the real board
    if (board[pt.y]?.[pt.x] !== EMPTY) continue;

    steps.push({
      point: pt,
      color: currentTurn,
      stepNumber: i + 1,
    });
    currentTurn = currentTurn === BLACK ? WHITE : BLACK;
  }
  return steps;
}

/**
 * Draws sequential ghost stones with numbered badges (1, 2, 3...) for PV candidate preview
 */
export function drawVariationSequence(
  ctx: CanvasRenderingContext2D,
  variation: VariationStep[],
  coordMargin: number,
  cellSize: number,
  stoneRadius: number
): void {
  if (!variation || variation.length === 0) return;

  for (const step of variation) {
    const { cx, cy } = getCanvasCoords(step.point.x, step.point.y, coordMargin, cellSize);

    ctx.save();
    // 1. Draw semi-transparent ghost stone with a crisp outline ring
    drawStone(ctx, cx, cy, stoneRadius, step.color, 0.72);

    ctx.beginPath();
    ctx.arc(cx, cy, stoneRadius, 0, Math.PI * 2);
    ctx.strokeStyle = step.color === BLACK ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = Math.max(1.5, stoneRadius * 0.12);
    ctx.stroke();

    // 2. Draw badge with step number
    const fontSize = Math.max(10, Math.round(stoneRadius * 0.95));
    ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = step.color === BLACK ? '#f8fafc' : '#0f172a';
    ctx.fillText(`${step.stepNumber}`, cx, cy);

    ctx.restore();
  }
}

/**
 * Main coordinator that executes complete Canvas 2D render pipeline
 */
export function renderGoBoard(params: BoardRenderParams): void {
  const {
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
    heatmapMode = 'both',
    hoverPoint,
    isHoverValid,
    interactive,
    showGhostStone,
    isGameOver,
    deadStoneKeys,
    variationPreview,
  } = params;

  ctx.clearRect(0, 0, displaySize * dpr, displaySize * dpr);

  // 1. Board Background
  drawBoardBackground(ctx, displaySize, boardTheme);

  // 2. Coordinate Labels
  if (showCoordinates) {
    drawCoordinates(ctx, displaySize, boardSize, boardTheme, coordMargin, cellSize);
  }

  // 3. Grid Lines & Star Points
  drawGridAndStars(ctx, boardSize, boardTheme, coordMargin, cellSize);

  // 4. KataGo Ownership Heatmap
  if (ownershipMap && heatmapMode !== 'none') {
    drawOwnershipHeatmap(ctx, ownershipMap, boardSize, coordMargin, cellSize, heatmapMode);
  }

  // 5. Placed Stones
  drawStones(ctx, board, boardSize, coordMargin, cellSize, stoneRadius, deadStoneKeys);

  // 6. Last Move Marker
  if (lastMove) {
    drawLastMoveMarker(ctx, lastMove, board, coordMargin, cellSize, stoneRadius);
  }

  // 7. Variation Sequence Preview (PV Ghost Stones with numbers)
  if (variationPreview && variationPreview.length > 0) {
    drawVariationSequence(ctx, variationPreview, coordMargin, cellSize, stoneRadius);
  }

  // 8. Ghost Stone Hover Preview
  if (
    interactive &&
    showGhostStone &&
    !isGameOver &&
    hoverPoint &&
    board[hoverPoint.y]?.[hoverPoint.x] === EMPTY
  ) {
    drawGhostStone(ctx, hoverPoint, isHoverValid, turn, coordMargin, cellSize, stoneRadius);
  }
}
