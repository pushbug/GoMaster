import { NextResponse } from 'next/server';
import { KataGoBridge } from '@/lib/engine/katago-bridge';
import { validateAndSanitizeRequest } from '@/lib/engine/validator';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    // Validate and sanitize incoming moves and board parameters
    const validation = validateAndSanitizeRequest(body);
    if (!validation.valid || !validation.sanitizedQuery) {
      return NextResponse.json(
        { error: validation.error || 'Invalid analysis request' },
        { status: 400 }
      );
    }

    // Dispatch query to KataGo subprocess bridge (or fallback mock)
    const bridge = KataGoBridge.getInstance();
    const result = await bridge.analyze(validation.sanitizedQuery);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal analysis engine error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
