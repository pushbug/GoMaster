---
name: testing
description: Reference for test specification and GoMaster verification. Use during .plan and .scrutinize phases alongside the plan or scrutinize skill.
invocation_type: model-invoked
trigger_condition: "Autonomously referenced during .plan (spec generation) and .scrutinize (execution & verification)"
---

# SKILL: Test Execution Thought Process (v4.0 - GoMaster Web)

## CONTEXT & ANCHORS

- **Trigger:** Loaded during `.plan` (spec generation) and `.scrutinize` (execution & verification).
- **Reference:** `docs/tests/SELECTORS.md`, `docs/tests/CATALOG.md`, `docs/tests/OVERVIEW.md`

## 1. TEST SPECIFICATION (.plan Phase)

- **Heuristic:** Define Expected Board State → Place Move → Assert Liberties / Captures / Ko Rejection.
- **Tiers:**
  - _Tier 1 (Go Rules Core):_ Liberties calculation, single-stone capture, multi-stone chain capture, suicide move rejection, suicide allowed when capturing, simple Ko rule, turn alternation.
  - _Tier 2 (Engine & AI Bridge):_ KataGo JSON parser mock, scoreLead/winrate calculations, Gemini Thai coaching prompt payload.
  - _Tier 3 (Board Component & UI):_ Coordinate mapping (A-T excluding I, 1-19), star points rendering, last move marker, sound trigger on move.
- **Location:** `tests/go/*.test.ts`, `tests/components/*.test.tsx`.
- **Isolation:** KataGo child processes and Google Gemini API requests MUST be mocked in automated tests.

## 2. VERIFICATION & REPORTING (.scrutinize Phase)

- **Execution:** Run automated suite via `npm test`.
- **Report Format (Thai):**

```text
  ผ่าน: X | ล้มเหลว: Y | ข้าม: Z
  [หากล้มเหลว]
  - Target: [Test Name]
  - Symptom: When [action], observed [actual] instead of [expected]
  - Action: Trigger `.debug [symptom]` immediately.
```

## 3. GUARDRAILS

- No False Positives: Never weaken test assertions to force a pass.
- Fix production Go engine logic under `.dev`, never weaken rule tests.
- Refactor Check: If internal data structures change (e.g. 1D vs 2D array) but Go rules behave identically, tests should still pass.
