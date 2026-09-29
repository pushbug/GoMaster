### Goal: Initialize GoMaster project skills, rules, documentation hub, and implement Phase 1 Go Board with full rule engine.

### Status: IN PROGRESS

### Done:
- Initialized Git repository.
- Converted root `AGENTS.md` and `.agent/AGENTS.md` to GoMaster stack (Next.js, TypeScript, KataGo, Gemini Flash).
- Updated all skills (`coding`, `consult`, `debug`, `grill`, `handoff`, `plan`, `scrutinize`, `testing`) and mirrored to `.agent/.cursor/`.
- Updated `.agent/rules/design-system.md` and `.agent/.cursor/rules/` (`copilot-core.mdc`, `web-nextjs.mdc`, `docs-writing.mdc`, `e2e-tests.mdc`).
- Established `docs/` documentation system (`INDEX.md`, `roadmap.md`, `prd.md`, `decisions.md`, `features/`, `core/`, `tests/`).

### Next:
- 1. Setup Next.js package structure with TypeScript, Tailwind CSS, Lucide icons, Vitest.
- 2. Implement complete Go Rule Engine (liberties, capture, ko, suicide, SGF) and unit tests.
- 3. Implement interactive Go Board component in React with high-DPI Canvas/SVG and audio feedback.

### Decisions:
- ADR 001: Next.js App Router + TypeScript + Tailwind CSS.
- ADR 002: Canvas/SVG Hybrid Architecture for Go Board.
- ADR 003: KataGo JSON Analysis Protocol.
- ADR 004: Server-Side AI Coach Layer via Google Gemini Flash.

### Skills:
- `plan` (.agent/skills/plan/) — Milestone 1 Go Board planning.
- `coding` (.agent/skills/coding/) — Core Go rule implementation.
