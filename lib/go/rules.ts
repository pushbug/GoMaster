import {
  arePointsEqual,
  boardToHash,
  cloneBoard,
  createEmptyBoard,
} from './board';
import {
  BLACK,
  BoardSize,
  EMPTY,
  GameState,
  Group,
  MoveRecord,
  MoveValidationResult,
  PlayerColor,
  Point,
  Stone,
  WHITE,
} from './types';

/**
 * Returns orthogonal adjacent points (up, down, left, right) within board boundaries
 */
export function getAdjacentPoints(point: Point, size: BoardSize): Point[] {
  const neighbors: Point[] = [];
  const { x, y } = point;

  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < size - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < size - 1) neighbors.push({ x, y: y + 1 });

  return neighbors;
}

/**
 * Finds all connected stones of the same group and their liberties using BFS
 */
export function findGroup(board: Stone[][], start: Point): Group | null {
  const size = board.length as BoardSize;
  const color = board[start.y]?.[start.x];

  if (color === undefined || color === EMPTY) {
    return null;
  }

  const stones: Point[] = [];
  const visitedStones = new Set<string>();
  const visitedLiberties = new Set<string>();
  const liberties: Point[] = [];

  const queue: Point[] = [start];
  visitedStones.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    stones.push(current);

    const neighbors = getAdjacentPoints(current, size);
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      const neighborColor = board[neighbor.y][neighbor.x];

      if (neighborColor === EMPTY) {
        if (!visitedLiberties.has(neighborKey)) {
          visitedLiberties.add(neighborKey);
          liberties.push(neighbor);
        }
      } else if (neighborColor === color) {
        if (!visitedStones.has(neighborKey)) {
          visitedStones.add(neighborKey);
          queue.push(neighbor);
        }
      }
    }
  }

  return {
    color: color as PlayerColor,
    stones,
    liberties,
  };
}

/**
 * Validates a move at the specified point for the given color
 */
export function validateMove(
  gameState: GameState,
  point: Point,
  color: PlayerColor
): MoveValidationResult {
  const { board, boardSize, isGameOver, koPoint } = gameState;

  if (isGameOver) {
    return { valid: false, reason: 'GAME_OVER' };
  }

  if (point.x < 0 || point.x >= boardSize || point.y < 0 || point.y >= boardSize) {
    return { valid: false, reason: 'OUT_OF_BOUNDS' };
  }

  if (board[point.y][point.x] !== EMPTY) {
    return { valid: false, reason: 'OCCUPIED' };
  }

  // Check Simple Ko point restriction
  if (koPoint && arePointsEqual(point, koPoint)) {
    return { valid: false, reason: 'KO_VIOLATION' };
  }

  const opponentColor: PlayerColor = color === BLACK ? WHITE : BLACK;

  // Tentatively place stone on cloned board
  const tempBoard = cloneBoard(board);
  tempBoard[point.y][point.x] = color;

  // Check which adjacent opponent groups are captured
  const capturedStones: Point[] = [];
  const neighbors = getAdjacentPoints(point, boardSize);
  const checkedOpponentGroups = new Set<string>();

  for (const neighbor of neighbors) {
    if (tempBoard[neighbor.y][neighbor.x] === opponentColor) {
      const groupKey = `${neighbor.x},${neighbor.y}`;
      if (!checkedOpponentGroups.has(groupKey)) {
        const group = findGroup(tempBoard, neighbor);
        if (group) {
          group.stones.forEach(s => checkedOpponentGroups.add(`${s.x},${s.y}`));
          if (group.liberties.length === 0) {
            capturedStones.push(...group.stones);
          }
        }
      }
    }
  }

  // Remove captured stones on the tentative board
  for (const captured of capturedStones) {
    tempBoard[captured.y][captured.x] = EMPTY;
  }

  // Check liberties of the newly placed stone's group
  const newGroup = findGroup(tempBoard, point);
  if (!newGroup || newGroup.liberties.length === 0) {
    // Suicide move: placing a stone with zero liberties without capturing opponent stones
    return { valid: false, reason: 'SUICIDE' };
  }

  // Check Positional Superko / Board Repetition
  const newBoardHash = boardToHash(tempBoard);
  if (gameState.history.length > 0) {
    // Check previous board state (Simple Ko)
    const prevMove = gameState.history[gameState.history.length - 1];
    if (gameState.history.length >= 2) {
      const stateBeforePrevMove = gameState.history[gameState.history.length - 2];
      if (stateBeforePrevMove.boardHash === newBoardHash) {
        return { valid: false, reason: 'KO_VIOLATION' };
      }
    }
  }

  return {
    valid: true,
    capturedStones,
  };
}

/**
 * Initializes a new clean GameState
 */
export function createInitialGameState(boardSize: BoardSize = 19): GameState {
  const emptyBoard = createEmptyBoard(boardSize);
  const initialHash = boardToHash(emptyBoard);

  return {
    board: emptyBoard,
    boardSize,
    turn: BLACK,
    captures: {
      black: 0,
      white: 0,
    },
    history: [],
    boardHashes: new Set([initialHash]),
    koPoint: null,
    lastMove: null,
    consecutivePasses: 0,
    isGameOver: false,
    winner: null,
  };
}

/**
 * Initializes a new GameState with handicap stones placed on star points
 */
export function createHandicapGameState(
  boardSize: BoardSize = 19,
  handicapPoints: Point[] = []
): GameState {
  const initial = createInitialGameState(boardSize);
  if (!handicapPoints || handicapPoints.length < 2) return initial;

  const nextBoard = cloneBoard(initial.board);
  for (const pt of handicapPoints) {
    if (pt.y >= 0 && pt.y < boardSize && pt.x >= 0 && pt.x < boardSize) {
      nextBoard[pt.y][pt.x] = BLACK;
    }
  }

  const hash = boardToHash(nextBoard);
  return {
    ...initial,
    board: nextBoard,
    turn: WHITE, // In handicap Go, White plays the first move
    boardHashes: new Set([hash]),
  };
}

/**
 * Executes a move, pass, or resignation, returning the new immutable GameState
 */
export function playMove(
  gameState: GameState,
  move: Point | 'PASS' | 'RESIGN'
): { success: boolean; state: GameState; error?: string } {
  if (gameState.isGameOver) {
    return { success: false, state: gameState, error: 'Game is already over' };
  }

  const { board, boardSize, turn, captures, history, consecutivePasses } = gameState;
  const opponentColor: PlayerColor = turn === BLACK ? WHITE : BLACK;

  // Handle Resignation
  if (move === 'RESIGN') {
    const newState: GameState = {
      ...gameState,
      isGameOver: true,
      winner: opponentColor,
      resignReason: `${turn === BLACK ? 'Black' : 'White'} resigned`,
      history: [
        ...history,
        {
          moveNumber: history.length + 1,
          color: turn,
          point: null,
          isResign: true,
          capturedStones: [],
          boardHash: boardToHash(board),
        },
      ],
    };
    return { success: true, state: newState };
  }

  // Handle Pass
  if (move === 'PASS') {
    const newConsecutivePasses = consecutivePasses + 1;
    const isGameOver = newConsecutivePasses >= 2;

    const record: MoveRecord = {
      moveNumber: history.length + 1,
      color: turn,
      point: null,
      isPass: true,
      capturedStones: [],
      boardHash: boardToHash(board),
    };

    const newState: GameState = {
      ...gameState,
      turn: opponentColor,
      consecutivePasses: newConsecutivePasses,
      isGameOver,
      resignReason: isGameOver ? (gameState.resignReason || 'จบเกมด้วยการผ่านหมากทั้งสองฝ่าย') : undefined,
      koPoint: null, // Passing clears Ko restrictions
      lastMove: null,
      history: [...history, record],
    };

    return { success: true, state: newState };
  }

  // Handle Stone Placement
  const validation = validateMove(gameState, move, turn);
  if (!validation.valid) {
    const errorMessages: Record<string, string> = {
      OCCUPIED: 'Intersection is already occupied',
      OUT_OF_BOUNDS: 'Coordinate is outside board boundaries',
      SUICIDE: 'Suicide move is not permitted',
      KO_VIOLATION: 'Illegal move due to Ko rule (immediate board repetition)',
      GAME_OVER: 'Game is already finished',
    };
    return {
      success: false,
      state: gameState,
      error: errorMessages[validation.reason || ''] || 'Invalid move',
    };
  }

  const capturedStones = validation.capturedStones || [];
  const nextBoard = cloneBoard(board);
  nextBoard[move.y][move.x] = turn;

  for (const captured of capturedStones) {
    nextBoard[captured.y][captured.x] = EMPTY;
  }

  const nextCaptures = {
    black: captures.black + (turn === BLACK ? capturedStones.length : 0),
    white: captures.white + (turn === WHITE ? capturedStones.length : 0),
  };

  // Determine Ko Point:
  // If exactly 1 stone was captured AND the newly played stone now has exactly 1 liberty,
  // then that single captured intersection is a potential Ko point on the next turn.
  let nextKoPoint: Point | null = null;
  if (capturedStones.length === 1) {
    const playedGroup = findGroup(nextBoard, move);
    if (playedGroup && playedGroup.stones.length === 1 && playedGroup.liberties.length === 1) {
      nextKoPoint = capturedStones[0];
    }
  }

  const newHash = boardToHash(nextBoard);
  const nextHashes = new Set(gameState.boardHashes);
  nextHashes.add(newHash);

  const record: MoveRecord = {
    moveNumber: history.length + 1,
    color: turn,
    point: move,
    capturedStones,
    boardHash: newHash,
  };

  const newState: GameState = {
    board: nextBoard,
    boardSize,
    turn: opponentColor,
    captures: nextCaptures,
    history: [...history, record],
    boardHashes: nextHashes,
    koPoint: nextKoPoint,
    lastMove: move,
    consecutivePasses: 0,
    isGameOver: false,
    winner: null,
  };

  return { success: true, state: newState };
}

/**
 * Undoes the last move, returning the reconstructed prior state.
 * Accepts an optional initialState to faithfully preserve handicap stones across undos.
 */
export function undoMove(gameState: GameState, initialState?: GameState): GameState {
  if (gameState.history.length === 0) {
    return gameState;
  }

  // Replay from initial state to history.length - 1
  const initial = initialState ?? createInitialGameState(gameState.boardSize);
  const targetHistory = gameState.history.slice(0, -1);

  let current = initial;
  for (const record of targetHistory) {
    if (record.isResign) {
      current = playMove(current, 'RESIGN').state;
    } else if (record.isPass || record.point === null) {
      current = playMove(current, 'PASS').state;
    } else {
      current = playMove(current, record.point).state;
    }
  }

  return current;
}

/**
 * Resolves winner and descriptive Thai reason for a game concluded by dual passes
 */
export function resolveDualPassWinner(
  gameState: GameState,
  scoreLead?: number
): GameState {
  if (!gameState.isGameOver || gameState.consecutivePasses < 2) {
    return gameState;
  }

  let winner: PlayerColor | 'DRAW' | null = null;
  let reason = 'จบเกมด้วยการผ่านหมากทั้งสองฝ่าย';

  if (typeof scoreLead === 'number') {
    if (scoreLead > 0.05) {
      winner = BLACK;
      reason = `จบเกมด้วยการผ่านหมากทั้งสองฝ่าย (หมากดำนำ ${scoreLead.toFixed(1)} แต้ม)`;
    } else if (scoreLead < -0.05) {
      winner = WHITE;
      reason = `จบเกมด้วยการผ่านหมากทั้งสองฝ่าย (หมากขาวนำ ${Math.abs(scoreLead).toFixed(1)} แต้ม)`;
    } else {
      winner = 'DRAW';
      reason = 'จบเกมด้วยการผ่านหมากทั้งสองฝ่าย (คะแนนเสมอกัน)';
    }
  }

  return {
    ...gameState,
    winner,
    resignReason: reason,
  };
}

