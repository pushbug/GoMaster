import { NextResponse } from 'next/server';
import { KataGoBridge } from '@/lib/engine/katago-bridge';

export async function GET() {
  try {
    const bridge = KataGoBridge.getInstance();
    const status = bridge.getEngineStatus();

    return NextResponse.json(
      {
        connected: !status.isMock,
        isMock: status.isMock,
        engineName: status.isMock
          ? 'Smart Tactical Heuristic (Mock Engine)'
          : 'KataGo Neural Network Core',
        binaryPath: status.binaryPath,
        configPath: status.configPath,
        modelPath: status.modelPath,
        pid: status.pid,
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to query engine status';
    return NextResponse.json(
      { error: message, isMock: true, connected: false },
      { status: 500 }
    );
  }
}
