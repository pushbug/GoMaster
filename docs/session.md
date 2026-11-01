### Goal: Reconfigure GoMaster development server and launcher to port 3500 and streamline co-pilot workflow with .audit command prefix.

### Status: COMPLETE

### Done:
- Reconfigured Next.js dev and start scripts in `package.json` to port 3500 (`next dev -p 3500`, `next start -p 3500`) to eliminate port collisions.
- Updated macOS launcher script `scripts/create-macos-app.sh` and `README.md` to target `http://localhost:3500`.
- Transitioned primary review command from `.scrutinize` to `.audit` with alias compatibility across `.agent/AGENTS.md` and `.agent/.cursor/rules/copilot-core.mdc`.
- Migrated review skills to `.agent/skills/audit/SKILL.md` and `.agent/.cursor/skills/audit/SKILL.md` in 100% parity under SKILL SYNC rule.
- Registered test IDs `TOOL-PORT-01` and `TOOL-CMD-01` in `docs/tests/CATALOG.md` with tests in `tests/scripts/port-configuration.test.ts` and `tests/scripts/command-gate.test.ts`.
- Verified 100% test pass rate (225/225 tests across 27 suites) and 0 TypeScript compiler errors.

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
- ADR 010: Dev Server Port 3500 & Command Prefix Optimization (.audit).

### Skills:
- `plan` (.agent/skills/plan/) — Milestone planning and TDD-lite specification.
- `coding` (.agent/skills/coding/) — Surgical implementation and self-healing validation.
- `audit` (.agent/skills/audit/) — Quality, AppSec, and plan/code gatekeeping.
- `handoff` (.agent/skills/handoff/) — Session closure and persistent state transfer.
