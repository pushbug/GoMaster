# Architectural Decision Records (ADRs)

### ADR 001: Next.js App Router + TypeScript + Tailwind CSS
- **Context:** Need a modern, fast, type-safe web framework capable of handling both responsive UI rendering and server-side engine orchestration.
- **Decision:** Use Next.js 15 (App Router) with React, TypeScript, and Tailwind CSS.
- **Consequences:** Provides native API routes for KataGo subprocess bridging and Gemini API proxying while avoiding client-side secret leakage.

### ADR 002: Canvas/SVG Hybrid Architecture for Go Board
- **Context:** A 19x19 Go board has 361 intersections, star points, stones, hover ghost preview, territory heatmap, and coordinate labels.
- **Decision:** Implement board rendering using HTML5 Canvas for performance (or SVG for sharp scalable vectors) with a layered structure: static grid layer + dynamic stone layer + interactive overlay layer.
- **Consequences:** Ensures 60fps interaction during stone hovering, move playback, and smooth resizing on mobile devices.

### ADR 003: KataGo JSON Analysis Protocol
- **Context:** KataGo supports multiple communication modes (GTP, TCP, JSON Analysis pipe).
- **Decision:** Use KataGo's native JSON Analysis pipe (`katago analysis`) via standard input/output streams.
- **Consequences:** Highest performance, multi-query batching capability, direct access to board ownership grids (-1.0 to 1.0) and variation trees.

### ADR 004: Server-Side AI Coach Layer via Google Gemini Flash
- **Context:** Converting raw KataGo stats into Thai coaching advice requires an LLM with low latency, high reasoning quality, and cost efficiency.
- **Decision:** Use Gemini Flash API through a server-side route `/api/coach-explain` with structured JSON schema outputs.
- **Consequences:** Keeps `GEMINI_API_KEY` protected on server; Gemini Flash provides sub-second responses suitable for interactive move-by-move coaching.

### ADR 005: Handicap Undo State Preservation & Hook Decomposition
- **Context:** Replaying moves from an empty board stripped handicap stones on undo, and `useGoGame.ts` was becoming a monolithic hook handling unrelated concerns.
- **Decision:** Extract pure domain handicap calculations into `lib/go/handicap.ts`, update `undoMove` to accept initial states, restore undos from `historySnapshots` in O(1), and isolate step review/keyboard navigation in `useReplayNavigation`.
- **Consequences:** Solves handicap undo regressions, decouples domain logic from React UI, and eliminates duplicate audio triggers.

