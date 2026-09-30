### Goal: Deliver high-performance GoMaster training application with responsive Go board, KataGo analysis, Thai Gemini coach, replay review, candidate PV variation preview, and decomposed hook architecture.

### Status: COMPLETE

### Done:
- Implemented full Go Rule Engine (19x19, 13x13, 9x9, liberties, captures, suicide, Ko rule, handicap, SGF export/import).
- Decomposed monolithic useGoGame hook into 3 cohesive sub-hooks (useDeadStonesDetection, useGameAnalysis, useBotTurn) reducing lines from 652 to 365 while preserving 100% API backwards compatibility.
- Built candidate move ghost stones on board with numbered badges and interactive PV (Principle Variation) preview card (Milestone 4.3).
- Implemented move quality grading (Best, Good, Inaccuracy, Mistake, Blunder) with accuracy formula and localStorage FIFO persistence (Milestone 4.4).
- Added post-match VictoryModal with dead dragon autopsy clustering and ownership-based dead stone board dimming.
- Extracted TACTICAL_CATEGORY_LABELS dictionary in gemini-coach.ts to eliminate duplicated Thai category strings across fallback branches.
- Registered and verified full test suite passing 100% (210/210 tests across 23 test suites).

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

### Skills:
- `plan` (.agent/skills/plan/) — Milestone planning and TDD-lite specification.
- `coding` (.agent/skills/coding/) — Surgical implementation and self-healing validation.
- `scrutinize` (.agent/skills/scrutinize/) — Quality and AppSec gatekeeping.
- `handoff` (.agent/skills/handoff/) — Session closure and persistent state transfer.
