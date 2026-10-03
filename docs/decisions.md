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
### ADR 008: AI Panel Layout Stabilization & Silent Background Loading
- **Context:** During interactive play, move placements caused visual flickering and severe layout shifts (CLS) on the right sidebar. Specifically, `CoachAdviceCard` tore down existing advice and replaced it with a small loading box, `CandidateMovesCard` pushed the candidate list down by 36px to inject a bot thinking banner, and `OpponentMoveCard` jumped in height between empty and populated states.
- **Decision:**
  1. Refactor `CoachAdviceCard` to adopt a silent background fetch pattern: retain previous advice text during loading with subtle opacity (`opacity-70`), show a non-intrusive micro-loader (`coach-silent-loader`) in the header, and enforce `min-h-[220px]`.
  2. Relocate `candidate-thinking-state` in `CandidateMovesCard` to the header's right-aligned action slot, locking candidate list vertical coordinates and enforcing `min-h-[220px]`.
  3. Stabilize `OpponentMoveCard` with `min-h-[145px]` across both empty and active states, locking `move-intent-box` to `min-h-[52px]` to absorb text length variance.
- **Consequences:** Eliminates layout shift (zero CLS) during gameplay, preserves visual focus on the board and metrics, and ensures 100% test suite compatibility (214/214 passing).

### ADR 009: Dev Server Port 3001, Native macOS Launcher Bundle, and Zen Mode / Collapsible Sidebar
- **Context:** Next.js default port 3000 conflicted with other local development projects, launching required opening a terminal manually, portrait/vertical displays suffered from cramped 8:4 grid board width, and competitive players requested an unassisted mode without AI hints.
- **Decision:**
  1. Set Next.js dev server default port to 3001 (`next dev -p 3001`) in `package.json`.
  2. Create native macOS App Launcher (`GoMaster.app`) generated via `scripts/create-macos-app.sh` and `scripts/generate-icon.sh` (rendering a 1024x1024 white "Go" on dark squircle icon converted to `assets/GoMaster.icns`). Purge `Assets.car` and strip `CFBundleIconName` via `plutil` to ensure macOS Finder displays the custom logo.
  3. Implement Collapsible Sidebar (`isSidebarOpen`) expanding the Go board container to full 12 columns (`lg:col-span-12`), maximizing board dimensions on portrait/vertical displays.
  4. Implement Zen Mode (`zenMode`) with header toggle button: conceals winrate and score lead numbers on `EvaluationBar`, suppresses candidate move ghost stones and PV previews, and suspends Gemini Coach API queries during gameplay.
- **Consequences:** Eliminates port collisions, enables one-click desktop app launch on macOS, solves portrait viewport scaling, and provides distraction-free play while saving Gemini API token usage.



