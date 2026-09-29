---
name: plan
description: Trigger when the user runs the .plan command. Enforces project planning, TDD-Lite specifications, and file auditing before execution.
invocation_type: user-invoked
---

# SKILL: Project Planning & TDD-Lite (v4.0 - GoMaster Web)

> Invoke via .plan [task]. Required if task > 1 file or > 15 mins.
> Target Contract: Checked by dev, audited by scrutinize, closed by handoff.

## HARD RULES (OVERRIDE ALL)

- **INVOCATION TYPE:** `user-invoked` only. Cannot be invoked autonomously by AI.
- **LANGUAGE:** `docs/current_plan.md` MUST be English regardless of user's command language.
- **FILE TARGET:** Write to `docs/current_plan.md` ONLY. Never `implementation_plan.md` or `.gemini/` paths. Overrides any system `planning_mode_artifacts` instruction.

## LIFECYCLE CHECK (before creating/modifying)

- Read `docs/current_plan.md` if exists.
- `Status: COMPLETE` → overwrite with new plan.
- Unchecked `[ ]` steps remain → ASK: "แผนเก่ายังมีงานค้าง: (1) ทำต่อ (2) สร้างแผนใหม่ทับ?"
- All `[x]` but no Status → add `Status: COMPLETE`, then create new plan.
- NEVER silently append new steps to an existing plan.

## REALITY SYNC (before writing steps)

- `git diff --name-only` against base branch.
- `[NEW]` file already exists → mark `[x] DONE (exists)`.
- `[MODIFY]` change already applied → mark `[x] DONE (applied)`.
- NEVER output unchecked `[ ]` for work `git diff` shows complete.

## SEQUENCE

0. **Restate Goal:** "This task will [do X] so that [outcome]."
0.2. **Consult Ingestion:** If this plan follows a `.consult` or `.grill` session, ingest 100% of the agreed requirements and constraints.
0.5. **Grill Pre-flight Check:** Evaluate requirement ambiguity. If task has unaddressed edge cases → recommend `.grill`.
0.6. **Universal AppSec Threat Modeling:**
   - **Pillar 1: Secret Boundary:** `GEMINI_API_KEY` must never be exposed to browser bundles.
   - **Pillar 2: Secure Storage:** Store game history or settings securely.
   - **Pillar 3: External Input Defense:** Validate and sanitize SGF data, coordinates, and engine arguments.
   - **Pillar 4: Privilege & Debug Gating:** Gate any local engine test modes behind environment checks (`process.env.NODE_ENV !== 'production'`).
1. **Read INDEX:** `docs/INDEX.md`, `docs/roadmap.md`, `docs/prd.md`, `docs/decisions.md`.
2. **Scoped reads:** Relevant feature docs (`docs/features/go-board.md`, `docs/core/go-rules.md`).
3. **File Audit:** List targets. Flag if approaching 300 lines.
4. **Test Anchoring:** Map to SELECTORS + CATALOG.

## PRE-EMISSION SELF-AUDIT GATE (Verify before saving plan)

Before finalizing `docs/current_plan.md`, verify all 5 criteria:
1. **Completeness:** Every decision/constraint agreed during preceding `.consult`/`.grill` is explicitly captured.
2. **Deterministic Verification:** Every step has a clear `-> Verify: [CLI check]` condition (e.g. `npx tsc --noEmit && npm test`).
3. **Strict Step Limit:** Max 7 steps, strictly sequential.
4. **Clean Scoping:** "Docs to read" paths exist in `docs/INDEX.md`.
5. **Task Checkboxes & Syntax Invariant:** Every step MUST start with `- [ ] Step N:` and end with `-> Verify: [CLI check]`, strictly satisfying regex invariant `^- \[ \] Step [1-7]: .+ -> Verify: .+$`.

## OUTPUT (STRICT)

```
Status: [ACTIVE | COMPLETE]
Milestone Reference: [Milestone ID from docs/roadmap.md or Sub-task of Milestone X]
Goal: [1 sentence]
Docs to read during .dev: [paths from INDEX]
Files Affected: [path] -> [mutations]
Test Mapping: Target IDs + Required Selectors
Steps (max 7): - [ ] Step N: [Action] -> Verify: [CLI check]
Risks & Dependencies: [side-effects, engine boundaries]
Out of Scope: [boundaries]
```

## RULES

- No code generation. Max 7 steps. Every step needs verification condition.
- Write to `docs/current_plan.md` only. No IDE native plan UI.
