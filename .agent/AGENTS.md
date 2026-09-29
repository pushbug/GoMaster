# Project Rules & Customizations

- **Planning & Execution Workflow:** Use `docs/current_plan.md` as the single source of truth for planning. Do not create `implementation_plan.md` artifacts. Wait for user approval on the plan before executing changes.
- **Tone & Style:** Comply with global rules (Output Thai for explanations, English for code, Zero fluff).
- **Target Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Canvas/SVG, Node.js API / Express / Python FastAPI, KataGo Analysis Engine, Google Gemini Flash API.
- **Go Logic & Game Integrity:** Strictly enforce liberties, multi-stone chain capture, suicide move prevention, and Ko rule (repetition prevention) across 19x19, 13x13, and 9x9 boards. Provide SGF import/export support.

# Agent Instructions

Phased co-pilot workflow. Skills: `.agent/skills/` · Docs hub: `docs/INDEX.md`

Commands: `.grill` `.consult` `.plan` `.dev` `.debug` `.scrutinize` `.done`

---

# Co-Pilot Core (v4.1 - GoMaster Web)

## Command gate

Prefixes: `.grill` `.consult` `.plan` `.dev` `.scrutinize` `.debug` `.done`

No prefix → ask for command only. No reads, code, tests, or edits.
Auto-trigger exception: `.debug` may be spawned internally by the `.dev` self-heal loop only. A user message describing a bug WITHOUT a `.debug` prefix still hits this gate — ask for the command.

Flow: [`.consult`]* -> [`.grill` (360° Pre-Mortem)]* -> `.plan` -> `.dev` -> [`.debug`]* -> `.scrutinize` -> `.done`

- `.grill` enforces the **Lens Priority Hierarchy** (Tier 1 AppSec/Data -> Tier 2 State/Resilience -> Tier 3 Scope/Design) to prioritize the top 3-5 critical risks and prevent LLM subjective bias.

Shorthand conventions for `.scrutinize`:
- `.scrutinize ตรวจแผน` (or `.scrutinize plan`): Audits `docs/current_plan.md` using the 5-point Plan Audit Checklist. Silently enforces the **Strict Plan Syntax Contract** in background (mandatory `- [ ]` task checkboxes, Regex invariant `^- \[ \] Step [1-7]: .+ -> Verify: .+$`, deterministic verification commands, and sequential step ordering), rejecting immediately on breach. Evaluates functional Test Strategy & Coverage (Unit/Component/E2E), 9arm Plan Failure Modes, & Universal AppSec boundaries, appending an actionable Advisory block (`💡 ข้อเสนอแนะ & จุดสังเกต Failure Modes`).
- `.scrutinize ตรวจโค้ด` (or `.scrutinize dev`/`code`): Audits git diff and test assertions using the 5-point Dev Audit Checklist, runs 9arm Code Failure Mode checks and Universal AppSec scans (zero hardcoded secrets, server-side Gemini key protection, unhandled exceptions, race conditions, memory leaks in canvas/engine pipes), and appends an Advisory block.
- Bare `.scrutinize`: Auto-detects target based on plan and git diff state.

## Explicit Invocation Policy

Skills in `.agent/skills/` enforce a strict access control taxonomy in their YAML frontmatter (`invocation_type`):
- **`user-invoked`:** Triggered exclusively via user dot-command in prompt (`.grill`, `.consult`, `.plan`, `.dev`, `.scrutinize`, `.done`). The AI is strictly forbidden from autonomously invoking these or chaining one user-invoked skill into another.
- **`model-invoked`:** Autonomous sub-routines and reference guides (e.g. `testing`). The AI reads or references these automatically when scoped conditions match (e.g. during `.plan` and `.scrutinize` to verify selectors and catalog test IDs).
- **`hybrid-invoked`:** User-invoked by default (`.debug`), with a single explicit autonomous exception: `.dev` self-heal loop spawning `.debug` on test/compiler failure.

## Communication

- Chat replies to the user: Thai, concise, easy to follow. Explain just enough.
- All written artifacts (docs, plans, code, comments, commit msgs): English only — token efficiency. Write for the AI to re-read, not for the user.
- **Two-layer output** (scrutinize, debug, coding, and any phase that reports findings to the user):
  - **Layer 1 — สรุป (ไทย):** 1–2 sentences in plain language + options if applicable. No deep jargon. For the human.
  - **Layer 2 — [for AI] Technical:** Compact block with `file:line`, root cause, fix path. For the next AI turn to act precisely. Always after Layer 1.
- **Next Command Directive:** All `.consult` Layer 1 replies must conclude with a mandatory single-line directive instructing the human on the exact next dot-command to run (.plan, .grill, .scrutinize, or no action needed).

## Global

- No browser_subagent unless requested.
- `.dev` must not edit `docs/session.md` or delete `docs/current_plan.md`.
- **UNIVERSAL APPSEC:** All plans and diffs across Web, Engine, and Backend must adhere to the Universal AppSec 4 Pillars: (1) Zero client-side hardcoded secrets/keys (`GEMINI_API_KEY` exclusively on server), (2) Encrypted storage / secure sessions at rest, (3) Strict sanitization for external inputs (SGF strings, engine coordinates, prompt injections), and (4) Strict compile-time/runtime gating for admin/debug tooling.
- **ENGINE & SERVICE SAFETY:** Automated tests (`npm test`) must NEVER spawn real KataGo subprocesses or invoke real Google Gemini API quotas. Always inject mock or fake delegates when running automated tests.
- **CLI PROTOCOL:** Standard verification uses `npm run lint`, `npx tsc --noEmit`, and `npm test`. On sandbox error, fall back to syntax/diff verification and provide a host terminal command.
- **SKILL SYNC:** If any file under `.agent/skills/` or `.agent/AGENTS.md` is modified, mirror the change into `.agent/.cursor/skills/` or `.agent/.cursor/rules/` — and vice versa. Both tool configs must stay in logical parity.
- **TEST FILES & SCRATCHPAD:** Do NOT create temporary test scripts or logs in the root directory. Use `tests/` for official tests or `scratch/` for isolated sandbox experiments.

## Session anchor

On the first phase command of a new session (once only): read `docs/INDEX.md` + `docs/session.md`, confirm status. Missing session → notify, await `.plan`.
`.consult` and `.grill` are read-only / conversational — they read docs to evaluate context but never mutate state or files. Session anchor applies.

## Phase routing

Read skills at `.agent/skills/{name}/SKILL.md`, then docs per skill. Never read legacy monoliths (`project_map.md`, `ARCHITECTURE.md`, `TESTS.md`) — use INDEX routing only.

| Phase         | Skills              | Docs                                                                                                                                                      |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.grill`      | grill               | INDEX, roadmap, prd, decisions; feature docs if grilling a specific domain                                                                               |
| `.consult`    | consult             | INDEX, session, roadmap; then any docs/source files needed to answer                                                                                      |
| `.plan`       | plan, testing       | INDEX, prd, roadmap, design, decisions; feature + test docs per plan skill                                                                                |
| `.dev`        | coding              | current_plan; compliance (safety contract — always); core/feature docs listed in plan; +state-machines if touching gameplay/engine/ai                     |
| `.debug`      | debug               | data-flow, dependencies; +danger-zones if state/timer/pipe bug; +state-machines if rule engine bug                                                        |
| `.scrutinize` | scrutinize, testing | current_plan (test IDs first); tests/OVERVIEW; tests/CATALOG only if IDs missing or cross-feature; feature/core docs of changed files; tests/SCENARIOS.md |
| `.done`       | handoff             | INDEX, session, roadmap; append new decisions to decisions.md; update affected feature/core/test/roadmap docs                                              |

---

# Documentation Standards

- English only. Workspace-relative paths only — no absolute paths.
- Hub: `docs/INDEX.md`. Feature/core/test content lives in subfolders — update scoped files only.
- Concise bullets; no chat history in `session.md`. Describe current state, not change history (history lives in git).
- `docs/current_plan.md` owned by `.plan`; deleted by `.done`.

## Doc lifecycle (create / split / register)

- New feature or core area with NO matching doc → create a new scoped file under `docs/features/` or `docs/core/`. Do not cram it into an unrelated doc.
- Any doc created, split, or renamed MUST be registered in `docs/INDEX.md` (add a routing-table row with a "when to read" note). Also update any skill that hardcodes the path.
- Doc nearing 300 lines → review and propose a split to the user with a reason; do not split automatically.

---

# Next.js, React & Go Engine Architecture

- Read target file before write. Touch only scoped files; no drive-by refactors.
- Match existing imports, naming, component conventions, and React state patterns 1:1.
- Minimum code for spec; no speculative abstractions or single-use helpers.
- Comments: only for non-obvious intent, Go rule complexities (liberties/ko/suicide), trade-offs, or safety guards. Never narrate what the code does. No emoji in comments. English only.
- Run `npm run lint` and `npx tsc --noEmit` after edits. Run `npm test` for affected unit/component specs during `.dev`.
- **UI Components & Dynamic Theme:** Always use Tailwind CSS semantic classes and theme variables for Light and Dark modes. Never hardcode absolute colors where themes can toggle. Go board rendering should support traditional wood (Kaya) and dark modern themes cleanly.
- **Defensive Layout & Zero-Overflow Policy:** Interactive board must scale smoothly across viewport sizes down to 360px without layout distortion or canvas aspect ratio breaking. Wrap panels with overflow scroll when needed.
- **Go Board Canvas Performance:** Render the static grid and star points efficiently (memoized or layered) so redrawing stone placements or hover ghosts does not lag.
- **Resource Cleanup:** Always clean up event listeners, Web Audio contexts, AnimationFrames, and KataGo child process pipes on unmount.

---

# Testing Standards

- Selectors: Provide explicit `data-testid="..."` or semantic aria attributes on interactive and assertion-target elements.
- Test IDs: Register test cases in `docs/tests/CATALOG.md` before `.plan` closes.
- Test observable behavior, board states, rule enforcement (liberties, capture, ko, suicide), not private component variables.
- Fix production code under `.dev`; never weaken assertions to pass.
