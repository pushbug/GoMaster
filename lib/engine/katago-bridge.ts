import fs from 'fs';
import path from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { stringToPoint } from '../go/board';
import { BoardSize } from '../go/types';
import { generateMockAnalysis } from './mock-engine';
import {
  CandidateMoveEvaluation,
  EngineAnalysisResult,
  KataGoAnalysisQuery,
  KataGoRawResponse,
} from './types';

export interface EngineStatusInfo {
  isAvailable: boolean;
  isMock: boolean;
  binaryPath: string | null;
  configPath: string | null;
  modelPath: string | null;
  pid: number | null;
}

function createAbortError(): Error {
  const error = new Error('Analysis request was cancelled');
  error.name = 'AbortError';
  return error;
}

/**
 * Transforms KataGo's raw JSON analysis output into a structured EngineAnalysisResult
 */
export function parseKataGoRawResponse(
  raw: KataGoRawResponse,
  boardSize: BoardSize,
  isMock = false
): EngineAnalysisResult {
  const currentPlayer = raw.rootInfo.currentPlayer;
  const isBlackToMove = currentPlayer === 'B';

  // Standardize winrate & scoreLead to Black's perspective:
  // KataGo rootInfo reports winrate and scoreLead from the perspective of currentPlayer.
  const rawWinrate = raw.rootInfo.winrate; // 0.0 to 1.0 for currentPlayer
  const rawLead = raw.rootInfo.scoreLead; // Points lead for currentPlayer

  const blackWinratePercent = Math.round(
    (isBlackToMove ? rawWinrate : 1.0 - rawWinrate) * 1000
  ) / 10;

  const blackScoreLead = Math.round(
    (isBlackToMove ? rawLead : -rawLead) * 10
  ) / 10;

  // Convert 1D ownership array (length = boardSize * boardSize) to 2D [y][x] grid
  // Normalize to Black's perspective: +1.0 = Black territory, -1.0 = White territory.
  // Under SIDETOMOVE, raw values are relative to currentPlayer, so negate when White to move.
  const ownershipGrid: number[][] = [];
  const ownershipSign = isBlackToMove ? 1 : -1;
  if (raw.ownership && raw.ownership.length === boardSize * boardSize) {
    for (let y = 0; y < boardSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < boardSize; x++) {
        row.push((raw.ownership[y * boardSize + x] ?? 0) * ownershipSign);
      }
      ownershipGrid.push(row);
    }
  } else {
    // Empty grid fallback
    for (let y = 0; y < boardSize; y++) {
      ownershipGrid.push(new Array(boardSize).fill(0));
    }
  }

  // Parse candidate moves (top 3)
  const sortedMoves = [...(raw.moveInfos || [])].sort((a, b) => a.order - b.order);
  const bestMoveLead = sortedMoves[0]?.scoreLead ?? 0;

  const suggestedMoves: CandidateMoveEvaluation[] = sortedMoves.slice(0, 3).map((m, idx) => {
    const pt = stringToPoint(m.move, boardSize);
    const moveWinratePercent = Math.round(m.winrate * 1000) / 10;
    const scoreLoss = m.scoreLoss !== undefined
      ? Math.max(0, Math.round(m.scoreLoss * 10) / 10)
      : Math.max(0, Math.round((bestMoveLead - m.scoreLead) * 10) / 10);

    return {
      point: pt,
      coord: m.move,
      winrate: moveWinratePercent,
      scoreLead: Math.round(m.scoreLead * 10) / 10,
      scoreLoss,
      pv: m.pv || [],
      visits: m.visits || 0,
      rank: idx + 1,
    };
  });

  return {
    id: raw.id,
    boardSize,
    currentPlayer,
    winrate: blackWinratePercent,
    scoreLead: blackScoreLead,
    scoreLoss: 0,
    ownershipGrid,
    suggestedMoves,
    isMock,
    timestamp: Date.now(),
  };
}

// Re-export tactical Go heuristic fallback
export { generateMockAnalysis } from './mock-engine';

/**
 * Checks whether a given path is a valid neural network model file (>1MB, valid extension)
 */
export function isValidModelFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const isExtensionValid =
    filePath.endsWith('.bin.gz') ||
    filePath.endsWith('.txt.gz') ||
    filePath.endsWith('.bin');
  if (!isExtensionValid) return false;
  try {
    const stat = fs.statSync(filePath);
    return stat.size >= 1024 * 1024; // Must be at least 1MB to reject XML/stub error files
  } catch {
    return false;
  }
}

/**
 * KataGo Subprocess Bridge Manager
 */
export class KataGoBridge {
  private static readonly MAX_QUEUED_QUERIES = 8;
  private static instance: KataGoBridge | null = null;
  private process: ChildProcessWithoutNullStreams | null = null;
  private isAvailable = false;
  private stdoutBuffer = '';
  private discoveredBinary: string | null = null;
  private discoveredConfig: string | null = null;
  private discoveredModel: string | null = null;
  private activeQueryId: string | null = null;
  private queuedQueries: Array<{
    query: KataGoAnalysisQuery;
    resolve: (value: EngineAnalysisResult) => void;
    reject: (reason: Error) => void;
    signal?: AbortSignal;
    abortHandler?: () => void;
  }> = [];
  private pendingQueries = new Map<
    string,
    {
      resolve: (value: EngineAnalysisResult) => void;
      reject: (reason: Error) => void;
      boardSize: BoardSize;
      query: KataGoAnalysisQuery;
      timer: NodeJS.Timeout;
      signal?: AbortSignal;
      abortHandler?: () => void;
    }
  >();

  private constructor() {
    this.initProcess();
  }

  static getInstance(): KataGoBridge {
    if (!KataGoBridge.instance) {
      KataGoBridge.instance = new KataGoBridge();
    }
    return KataGoBridge.instance;
  }

  getEngineStatus(): EngineStatusInfo {
    return {
      isAvailable: this.isAvailable,
      isMock: !this.isAvailable,
      binaryPath: this.discoveredBinary,
      configPath: this.discoveredConfig,
      modelPath: this.discoveredModel,
      pid: this.process?.pid ?? null,
    };
  }

  private initProcess() {
    // 1. Locate KataGo binary
    const potentialBinaries = [
      process.env.KATAGO_PATH,
      '/opt/homebrew/bin/katago',
      '/usr/local/bin/katago',
      '/usr/bin/katago',
    ].filter(Boolean) as string[];

    for (const bin of potentialBinaries) {
      if (fs.existsSync(bin)) {
        this.discoveredBinary = bin;
        break;
      }
    }

    // 2. Locate KataGo configuration
    const potentialConfigs = [
      process.env.KATAGO_CONFIG,
      path.join(process.cwd(), 'engine/config/analysis.cfg'),
    ].filter(Boolean) as string[];

    for (const cfg of potentialConfigs) {
      if (fs.existsSync(cfg)) {
        this.discoveredConfig = cfg;
        break;
      }
    }

    // 3. Locate KataGo model
    if (process.env.KATAGO_MODEL && isValidModelFile(process.env.KATAGO_MODEL)) {
      this.discoveredModel = process.env.KATAGO_MODEL;
    } else {
      const modelsDir = path.join(process.cwd(), 'engine/models');
      if (fs.existsSync(modelsDir)) {
        try {
          const files = fs.readdirSync(modelsDir);
          const validModels = files
            .map(f => path.join(modelsDir, f))
            .filter(isValidModelFile)
            .sort((a, b) => {
              try {
                return fs.statSync(b).size - fs.statSync(a).size;
              } catch {
                return 0;
              }
            });

          if (validModels.length > 0) {
            this.discoveredModel = validModels[0];
          }
        } catch {
          // Ignore read error
        }
      }
    }

    if (!this.discoveredBinary || !this.discoveredConfig || !this.discoveredModel) {
      // KataGo components not found; stay in mock fallback mode
      this.isAvailable = false;
      return;
    }

    // In automated test environments, avoid spawning real KataGo background subprocesses
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      this.isAvailable = false;
      return;
    }

    try {
      this.process = spawn(this.discoveredBinary, [
        'analysis',
        '-config',
        this.discoveredConfig,
        '-model',
        this.discoveredModel,
      ]);

      if (this.process.pid) {
        this.isAvailable = true;
      }

      this.process.stdout.on('data', (chunk: Buffer) => {
        this.handleStdoutChunk(chunk.toString('utf-8'));
      });

      this.process.stderr.on('data', (data: Buffer) => {
        // KataGo logs diagnostic info to stderr
        const msg = data.toString('utf-8');
        if (
          msg.includes('Started, ready to begin handling requests') ||
          msg.includes('Started') ||
          msg.includes('Loaded model') ||
          msg.includes('using MPSGraph') ||
          msg.includes('GPU mode')
        ) {
          this.isAvailable = true;
        }
      });

      this.process.on('error', () => {
        this.isAvailable = false;
        this.settleAllWithFallback();
      });

      this.process.on('exit', () => {
        this.isAvailable = false;
        this.process = null;
        this.settleAllWithFallback();
      });

      // Cleanup on application exit
      process.on('exit', () => {
        this.destroy();
      });
    } catch {
      this.isAvailable = false;
    }
  }

  private handleStdoutChunk(chunk: string) {
    this.stdoutBuffer += chunk;
    const lines = this.stdoutBuffer.split('\n');

    // Keep incomplete last segment in buffer
    this.stdoutBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const raw = JSON.parse(trimmed) as KataGoRawResponse;
        const pending = this.pendingQueries.get(raw.id);
        if (pending) {
          const parsed = parseKataGoRawResponse(raw, pending.boardSize, false);
          this.settlePending(raw.id, parsed);
        }
      } catch {
        // Discard unparseable diagnostic lines
      }
    }
  }

  async analyze(
    query: KataGoAnalysisQuery,
    signal?: AbortSignal
  ): Promise<EngineAnalysisResult> {
    if (signal?.aborted) {
      throw createAbortError();
    }

    // If real KataGo is not available, return high-fidelity mock analysis immediately
    if (!this.isAvailable || !this.process) {
      return generateMockAnalysis(query);
    }

    return new Promise((resolve, reject) => {
      if (
        this.pendingQueries.has(query.id) ||
        this.queuedQueries.some(item => item.query.id === query.id)
      ) {
        reject(new Error(`Duplicate KataGo query id: ${query.id}`));
        return;
      }

      if (this.queuedQueries.length >= KataGoBridge.MAX_QUEUED_QUERIES) {
        resolve(generateMockAnalysis(query));
        return;
      }

      const queued = {
        query,
        resolve,
        reject,
        signal,
        abortHandler: undefined as (() => void) | undefined,
      };

      if (signal) {
        queued.abortHandler = () => this.cancelQuery(query.id);
        signal.addEventListener('abort', queued.abortHandler, { once: true });
      }

      this.queuedQueries.push(queued);
      this.pumpQueue();
    });
  }

  private pumpQueue() {
    if (this.activeQueryId || !this.process || !this.isAvailable) return;

    const queued = this.queuedQueries.shift();
    if (!queued) return;

    if (queued.signal?.aborted) {
      this.removeAbortListener(queued.signal, queued.abortHandler);
      queued.reject(createAbortError());
      this.pumpQueue();
      return;
    }

    const queryId = queued.query.id;
    this.activeQueryId = queryId;
    const timer = setTimeout(() => {
      this.settlePending(queryId, generateMockAnalysis(queued.query));
    }, 12000);

    this.pendingQueries.set(queryId, {
      resolve: queued.resolve,
      reject: queued.reject,
      boardSize: queued.query.boardXSize as BoardSize,
      query: queued.query,
      timer,
      signal: queued.signal,
      abortHandler: queued.abortHandler,
    });

    try {
      this.process.stdin.write(`${JSON.stringify(queued.query)}\n`);
    } catch {
      this.settlePending(queryId, generateMockAnalysis(queued.query));
    }
  }

  private cancelQuery(queryId: string) {
    const queuedIndex = this.queuedQueries.findIndex(item => item.query.id === queryId);
    if (queuedIndex >= 0) {
      const [queued] = this.queuedQueries.splice(queuedIndex, 1);
      this.removeAbortListener(queued.signal, queued.abortHandler);
      queued.reject(createAbortError());
      return;
    }

    const pending = this.pendingQueries.get(queryId);
    if (!pending) return;

    try {
      this.process?.stdin.write(`${JSON.stringify({
        id: `${queryId}_terminate`,
        action: 'terminate',
        terminateId: queryId,
      })}\n`);
    } catch {
      // The cancellation still settles locally if the subprocess pipe is closed.
    }

    this.settlePending(queryId, undefined, createAbortError());
  }

  private settlePending(
    queryId: string,
    result?: EngineAnalysisResult,
    error?: Error
  ) {
    const pending = this.pendingQueries.get(queryId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.removeAbortListener(pending.signal, pending.abortHandler);
    this.pendingQueries.delete(queryId);
    if (this.activeQueryId === queryId) {
      this.activeQueryId = null;
    }

    if (error) {
      pending.reject(error);
    } else {
      pending.resolve(result ?? generateMockAnalysis(pending.query));
    }
    this.pumpQueue();
  }

  private settleAllWithFallback() {
    for (const [queryId, pending] of [...this.pendingQueries]) {
      this.settlePending(queryId, generateMockAnalysis(pending.query));
    }

    const queued = this.queuedQueries.splice(0);
    for (const item of queued) {
      this.removeAbortListener(item.signal, item.abortHandler);
      item.resolve(generateMockAnalysis(item.query));
    }
    this.activeQueryId = null;
  }

  private removeAbortListener(signal?: AbortSignal, handler?: () => void) {
    if (signal && handler) {
      signal.removeEventListener('abort', handler);
    }
  }

  destroy() {
    this.isAvailable = false;
    this.settleAllWithFallback();
    if (this.process) {
      try {
        this.process.kill();
      } catch {
        // Process might already be dead
      }
      this.process = null;
    }
  }
}
