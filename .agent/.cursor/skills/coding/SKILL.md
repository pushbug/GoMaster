---
name: coding
description: Trigger when the user runs the .dev command. Enforces minimal, surgical code generation and self-healing validation.
invocation_type: user-invoked
---

# SKILL: Coding & Self-Healing Loop (v4.0 - GoMaster Web)

> Trigger: .dev [Task] | Boundary: Code Gen & Exec.

## STANCE

- Minimal but never fragile. Correct > fast > short.
- Match existing patterns 1:1. No clever tricks.
- Never remove rule validation/guards/cleanup (see `docs/core/go-rules.md` + `docs/core/compliance.md`).

## INTENT

- Uncertainty = STOP & ASK. Multi-interpretation = present all options.
- Weak criteria ("make it work") = STOP & ASK.

## PLAN ANCHORING & STALENESS CHECK

- Read `docs/current_plan.md` + listed docs before coding.
- **Before each step:** verify target file/change doesn't already exist (`ls`/`grep`). Already done → mark `[x]`, skip. All `[x]` → set `Status: COMPLETE`, announce: "ทำเสร็จครบแล้วครับ แนะนำ .scrutinize ก่อน .done"
- With plan: align strictly. Without plan: max 1 file, confirm scope first.

## MINIMALISM

- Absolute minimum for spec. No speculative features. No single-use abstractions.
- Keep components modular. Extract sub-components when exceeding 200 lines.

## SURGICAL MUTATION

- Mutate only exact lines. Zero reformatting. Match existing style 1:1.
- Auto-purge unused imports/variables from CURRENT change only.
- **DUPLICATE SCAN (mandatory):** `grep`/symbol check across repo before editing. If duplicate helper or rule function exists → reuse, don't duplicate.
- **REFACTOR HYGIENE:** When moving logic, DELETE old copy in same edit.
- **GO RULE GUARD:** Never bypass liberties calculation, Ko validation, or suicide prevention.
- **LAYOUT OVERFLOW GUARD:** Ensure Go board and analytical sidebars adapt defensively to viewport dimensions down to 360px without flex clipping.

## EXECUTION

- Read target file before writing. 300-line threshold = ask before split.
- Multi-step: one step → verify → proceed.
- **Testing:** Run `npx tsc --noEmit` + `npm test` for touched modules.
- **Visual changes:** state explicitly what to eye-check on desktop/mobile browsers. Never claim visual fix works from static analysis alone.
- **Self-heal:** 1 auto `.debug` loop. Failure persists -> STOP & ASK.
- **No session wrap-up.** No git push/PR/summary during `.dev`.

## PROGRESS TRACKING

- After each step: mark `[x]` in `docs/current_plan.md`.
- After ALL steps: `Status: ACTIVE` → `Status: COMPLETE`.
- **Never end silently.** Report: "ทำเสร็จ step X/Y" or "ครบทุก step แนะนำ .scrutinize"

## OUTPUT

- **Layer 1 (ไทย):** what changed + why (≤3 lines). End with "step X/Y" progress.
- **Layer 2 [for AI]:** English summary + surgical code block.
