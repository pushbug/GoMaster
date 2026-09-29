# GoMaster Project Roadmap

Roadmap to build a full-stack Go training web application helping players reach 1 Dan level.

---

### Milestone 1: Frontend Go Board & Complete Rule Engine (Current Focus)
- [ ] 1.1: Core Go Rule Engine in TypeScript (19x19, 13x13, 9x9, liberties calculation, captures, suicide prevention, Ko rule).
- [ ] 1.2: Move tree and game state management (pass, resign, undo, redo, move count, captured stones).
- [ ] 1.3: SGF parser and serializer (import/export games).
- [ ] 1.4: High-performance interactive Go Board UI (Canvas/SVG, coordinate labels A-T without I, wood aesthetics, star points, hover ghost stone, audio click).
- [ ] 1.5: Unit & Component test suite for all Go rule edge cases.

### Milestone 2: Backend KataGo Analysis Bridge
- [ ] 2.1: KataGo subprocess runner with JSON pipe communication (`katago analysis`).
- [ ] 2.2: Mock / Fallback engine for development environments lacking local KataGo binary.
- [ ] 2.3: API endpoint `/api/analyze` returning scoreLead, winrate, ownership grid, top 3 candidate moves, and scoreLoss.

### Milestone 3: AI Sensei / Coach Layer (Google Gemini Flash)
- [ ] 3.1: Server-side Gemini Flash API proxy (`/api/coach-explain`).
- [ ] 3.2: 9-Dan Professional Coach system prompt in Thai (Sente/Gote, Tenuki, Weak Groups, Shape/Haengma, Direction of Play).
- [ ] 3.3: Structured JSON output parsing (`evaluationTitle`, `explanationThai`, `keyConcept`).

### Milestone 4: Training Dashboard & Interactive Overlays
- [ ] 4.1: Evaluation Bar (vertical Winrate % and Score Lead +/- indicator).
- [ ] 4.2: KataGo Ownership Heatmap Canvas Overlay (toggleable territory control).
- [ ] 4.3: Candidate Move Ghost Stones with winrate badges & PV (Principle Variation) preview.
- [ ] 4.4: Move Quality Badges (Best Move, Good, Inaccuracy, Mistake, Blunder).
- [ ] 4.5: Real-time Coach Advice Panel with Thai strategic feedback.
