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
  const ownershipGrid: number[][] = [];
  if (raw.ownership && raw.ownership.length === boardSize * boardSize) {
    for (let y = 0; y < boardSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < boardSize; x++) {
        // KataGo ownership is 1.0 (Black) to -1.0 (White)
        row.push(raw.ownership[y * boardSize + x] ?? 0);
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
  private static instance: KataGoBridge | null = null;
  private process: ChildProcessWithoutNullStreams | null = null;
  private isAvailable = false;
  private stdoutBuffer = '';
  private discoveredBinary: string | null = null;
  private discoveredConfig: string | null = null;
  private discoveredModel: string | null = null;
  private pendingQueries = new Map<
    string,
    {
      resolve: (value: EngineAnalysisResult) => void;
      reject: (reason: Error) => void;
      boardSize: BoardSize;
      timer: NodeJS.Timeout;
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
      });

      this.process.on('exit', () => {
        this.isAvailable = false;
        this.process = null;
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
          clearTimeout(pending.timer);
          this.pendingQueries.delete(raw.id);
          const parsed = parseKataGoRawResponse(raw, pending.boardSize, false);
          pending.resolve(parsed);
        }
      } catch {
        // Discard unparseable diagnostic lines
      }
    }
  }

  async analyze(query: KataGoAnalysisQuery): Promise<EngineAnalysisResult> {
    // If real KataGo is not available, return high-fidelity mock analysis immediately
    if (!this.isAvailable || !this.process) {
      return generateMockAnalysis(query);
    }

    return new Promise((resolve, reject) => {
      const queryId = query.id;
      const timeoutMs = 12000; // 12 seconds query timeout

      const timer = setTimeout(() => {
        this.pendingQueries.delete(queryId);
        // Fallback to mock on timeout rather than hard failing
        resolve(generateMockAnalysis(query));
      }, timeoutMs);

      this.pendingQueries.set(queryId, {
        resolve,
        reject,
        boardSize: query.boardXSize as BoardSize,
        timer,
      });

      try {
        const queryJson = JSON.stringify(query) + '\n';
        this.process?.stdin.write(queryJson);
      } catch (err) {
        clearTimeout(timer);
        this.pendingQueries.delete(queryId);
        resolve(generateMockAnalysis(query));
      }
    });
  }

  destroy() {
    if (this.process) {
      try {
        this.process.kill();
      } catch {
        // Process might already be dead
      }
      this.process = null;
      this.isAvailable = false;
    }
  }
}
