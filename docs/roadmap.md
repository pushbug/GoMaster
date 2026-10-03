# GoMaster Project Roadmap

Roadmap to build a full-stack Go training web application helping players reach 1 Dan level.

---

### Milestone 1: Frontend Go Board & Complete Rule Engine (Completed)
- [x] 1.1: Core Go Rule Engine in TypeScript (19x19, 13x13, 9x9, liberties calculation, captures, suicide prevention, Ko rule). Completed (2026-09-29)
- [x] 1.2: Move tree and game state management (pass, resign, undo, redo, move count, captured stones, handicap). Completed (2026-09-29)
- [x] 1.3: SGF parser and serializer (import/export games). Completed (2026-09-29)
- [x] 1.4: High-performance interactive Go Board UI (Canvas/SVG, coordinate labels A-T without I, wood aesthetics, star points, hover ghost stone, audio click). Completed (2026-09-29)
- [x] 1.5: Unit & Component test suite for all Go rule edge cases. Completed (2026-09-29)
- [x] 1.6: Developer Tooling & Native macOS Launcher (GoMaster.app with custom 1024px GoMaster.icns, npm run app:create, port 3001 dev server). Completed (2026-10-03)

### Milestone 2: Backend KataGo Analysis Bridge (Completed)
- [x] 2.1: KataGo subprocess runner with JSON pipe communication (`katago analysis`). Completed (2026-09-29)
- [x] 2.2: Mock / Fallback engine for development environments lacking local KataGo binary. Completed (2026-09-29)
- [x] 2.3: API endpoint `/api/analyze` returning scoreLead, winrate, ownership grid, top 3 candidate moves, and scoreLoss. Completed (2026-09-29)

### Milestone 3: AI Sensei / Coach Layer (Google Gemini Flash) (Completed)
- [x] 3.1: Server-side Gemini Flash API proxy (`/api/coach-explain`). Completed (2026-09-29)
- [x] 3.2: 9-Dan Professional Coach system prompt in Thai (Sente/Gote, Tenuki, Weak Groups, Shape/Haengma, Direction of Play). Completed (2026-09-29)
- [x] 3.3: Structured JSON output parsing (`evaluationTitle`, `tacticalAdvice`, `keyConcept`, `initiativeThai`). Completed (2026-09-29)

### Milestone 4: Training Dashboard & Interactive Overlays (Completed)
- [x] 4.1: Evaluation Bar (vertical Winrate % and Score Lead +/- indicator with score breakdown). Completed (2026-09-29)
- [x] 4.2: KataGo Ownership Heatmap Canvas Overlay (toggleable territory control: both, black, white, none). Completed (2026-09-29)
- [x] 4.3: Candidate Move Ghost Stones with winrate badges & PV (Principle Variation) preview. Completed (2026-09-30)
- [x] 4.4: Move Quality Badges (Best Move, Good, Inaccuracy, Mistake, Blunder) & Match History. Completed (2026-09-30)
- [x] 4.5: Real-time Coach Advice Panel with Thai strategic feedback. Completed (2026-09-29)
- [x] 4.6: Collapsible Sidebar layout (12-column expansion for portrait displays) & Zen Mode (unassisted competitive play). Completed (2026-10-03)


