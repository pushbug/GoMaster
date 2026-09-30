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

### ADR 006: GoControls Single-Line Action Bar & 3-Pill Heatmap Segmented Switcher
- **Context:** The under-board action controls suffered from layout wrapping (dropping "ยอมแพ้" to row 2) and dynamic container expansion when entering replay review mode ("กลับสู่เกม" button expanding the replay container). In addition, cycling through 4 heatmap states with a single toggle button was tedious for users.
- **Decision:**
  1. Trim English suffixes to concise Thai ("ผ่าน", "ยอมแพ้") and apply `shrink-0` to keep all buttons in a single responsive row without flex wrapping.
  2. Remove dynamic "กลับสู่เกม" button, utilizing the existing `>>` (`btn-replay-last`) button to jump to the live game, keeping replay controls at a fixed predictable width.
  3. Replace the single cycle button with a 3-pill Segmented Control `[ All | ดำ ● | ขาว ○ ]` supporting direct 1-click mode activation and 1-click toggle-off.
- **Consequences:** Zero visual overflow across desktop and tablet viewports, instant 1-click heatmap selection, fixed control bar width, and 100% test coverage.

### ADR 007: Sub-hook Decomposition (useBotTurn, useGameAnalysis, useDeadStonesDetection)
- **Context:** `useGoGame.ts` grew into a 652-line monolithic hook coupling game rules, bot AI loop, async analysis, coach explanations, dead stone detection, and modal states.
- **Decision:** Decompose `useGoGame.ts` into 3 single-responsibility sub-hooks:
  1. `lib/hooks/useDeadStonesDetection.ts`: Handles post-game ownership analysis, dead stone clustering, and VictoryModal open/close logic.
  2. `lib/hooks/useGameAnalysis.ts`: Isolates KataGo API requests, Gemini coach explain calls, and race-condition sequence invalidation counters.
  3. `lib/hooks/useBotTurn.ts`: Encapsulates the bot turn cycle, thinking delays, hopelessness evaluation, pass/resignation rules, and calibrated move execution.
  Keep `useGoGame.ts` as an orchestrator (365 lines) preserving 100% API backwards compatibility.
- **Consequences:** Decreases hook cognitive complexity, enables isolated sub-hook unit testing (`tests/hooks/use-sub-hooks.test.ts`), and simplifies future engine enhancements.


