### Goal: Deliver high-performance GoMaster training application with responsive Go board, KataGo analysis, Thai Gemini coach, replay review, and clean handicap architecture.

### Status: COMPLETE

### Done:
- Implemented full Go Rule Engine (19x19, 13x13, 9x9, liberties, captures, suicide, Ko rule, handicap, SGF export/import).
- Built interactive HTML5 Canvas Go Board with coordinate labels, wood aesthetics, star points, ghost stone preview, and ResizeObserver responsive scaling.
- Integrated KataGo analysis engine bridge with real-time winrate, score lead, territory ownership heatmap, and mock fallback.
- Implemented 9-Dan Professional Thai Coach Sensei via Gemini Flash API proxy and tactical advice fallback.
- Built EvaluationBar with dual-player identity badges, score breakdown, and MoveHistoryPanel with per-move point delta.
- Streamlined GoControls bottom action bar into a defensive single-line layout with concise Thai labels ("ผ่าน", "ยอมแพ้") and fixed-width replay navigation.
- Replaced single cycle heatmap toggle with a 3-pill segmented control [All | ดำ ● | ขาว ○] featuring 1-click direct mode selection and toggle-to-off.

### Next:
- 1. Implement candidate move ghost stones on board with winrate badges & PV preview (Milestone 4.3).
- 2. Implement move quality badges: Best Move, Good, Inaccuracy, Mistake, Blunder (Milestone 4.4).
- 3. Add game export/import SGF file upload modal for reviewing external games.

### Decisions:
- ADR 001: Next.js App Router + TypeScript + Tailwind CSS.
- ADR 002: Canvas/SVG Hybrid Architecture for Go Board.
- ADR 003: KataGo JSON Analysis Protocol.
- ADR 004: Server-Side AI Coach Layer via Google Gemini Flash.
- ADR 005: Handicap Undo State Preservation & Hook Decomposition.
- ADR 006: GoControls Single-Line Action Bar & 3-Pill Heatmap Segmented Switcher.

### Skills:
- `plan` (.agent/skills/plan/) — Milestone planning and TDD-lite specification.
- `coding` (.agent/skills/coding/) — Surgical implementation and self-healing validation.
- `scrutinize` (.agent/skills/scrutinize/) — Quality and AppSec gatekeeping.
- `handoff` (.agent/skills/handoff/) — Session closure and persistent state transfer.
