### Goal: Deliver high-performance GoMaster training application with port 3001 dev server, native macOS launcher app with custom icon, collapsible sidebar for portrait viewports, and distraction-free Zen mode.

### Status: COMPLETE

### Done:
- Reconfigured Next.js dev server default port to 3001 in package.json to prevent localhost:3000 port collisions.
- Created native macOS App launcher (GoMaster.app) via scripts/create-macos-app.sh with custom 1024px Go logo (assets/GoMaster.icns) and automated Assets.car/CFBundleIconName purge.
- Implemented Collapsible Sidebar layout in app/page.tsx expanding Go board to 12 columns for portrait/vertical screen optimization.
- Built unassisted Zen Mode with header toggle, concealing winrate/score numbers on EvaluationBar and suppressing ghost moves and Gemini API requests during play.
- Created comprehensive test suite in tests/components/zen-mode.test.ts and registered UI-ZEN-01, UI-COLLAPSE-01 in docs/tests/CATALOG.md.
- Verified 100% test coverage passing across entire project (218/218 tests across 25 test suites) and zero TypeScript compiler errors.

### Next:
- 1. Add game export/import SGF file upload modal for reviewing external games.
- 2. Implement Joseki dictionary / shape pattern recognition library for 1-Dan training.
- 3. Add sound customization settings (stone click, capture sound effects, timer beeps).

### Decisions:
- ADR 001: Next.js App Router + TypeScript + Tailwind CSS.
- ADR 002: Canvas/SVG Hybrid Architecture for Go Board.
- ADR 003: KataGo JSON Analysis Protocol.
- ADR 004: Server-Side AI Coach Layer via Google Gemini Flash.
- ADR 005: Handicap Undo State Preservation & Hook Decomposition.
- ADR 006: GoControls Single-Line Action Bar & 3-Pill Heatmap Segmented Switcher.
- ADR 007: Sub-hook Decomposition (useBotTurn, useGameAnalysis, useDeadStonesDetection).
- ADR 008: AI Panel Layout Stabilization & Silent Background Loading.
- ADR 009: Dev Server Port 3001, Native macOS Launcher Bundle, and Zen Mode / Collapsible Sidebar.

### Skills:
- `plan` (.agent/skills/plan/) — Milestone planning and TDD-lite specification.
- `coding` (.agent/skills/coding/) — Surgical implementation and self-healing validation.
- `scrutinize` (.agent/skills/scrutinize/) — Quality and AppSec gatekeeping.
- `handoff` (.agent/skills/handoff/) — Session closure and persistent state transfer.
