---
name: debug
description: Trigger when the user runs the .debug command, or when a runtime error or test failure occurs. Enforces strict root-cause analysis before coding.
invocation_type: hybrid-invoked
---

# SKILL: Debugging (v4.0 - GoMaster Web)

> `.debug [symptom]` | Target: Runtime, Engine, Go rules, or UI bugs in Next.js/React.
> **No code before root cause is confirmed.**
> Typos/syntax/imports → fix directly. Auto-trigger is `.dev` self-heal only.

## OUTPUT

- **Layer 1 (ไทย):** symptom + root cause plain language (1–3 sentences). Unproven = say so, stop.
- **Layer 2 [for AI]:** `file:line`, trace path, fix scope. Only after `[ยืนยันแล้ว]`.

## GUARDRAILS

- **Localize first:** Read `docs/core/go-rules.md`, `docs/features/katago-bridge.md`, `docs/core/compliance.md` to pinpoint files. Open ≤3 files.
- Escalate to `.plan` only if FIX needs >3 files (investigation alone is not a reason).
- **REPEAT-BUG:** Same symptom after prior fix → STOP. `grep` every occurrence of the symbol repo-wide. Repeat bugs = duplicate state/helper, not the line you keep editing.
- **GO RULE BUGS:** Verify liberties recursion (stack overflow/infinite loop in BFS/flood-fill), suicide detection, or Ko hash collisions.
- **KATAGO ENGINE BUGS:** Check stdin JSON stringification, child process exit status, buffer truncation, or unhandled promise rejections.
- **GEMINI API BUGS:** Check rate limiting, missing API keys, markdown parsing errors, or payload size.

## WORKFLOW

### 1. Symptom
"When [action], [observed] instead of [expected]." Can't complete → gather info.

### 2. Reproduce
Exact trigger, board state (SGF or move sequence), environment. **No code changes until confirmed.**

### 3. Trace
User Click → Board State / Rule Engine → Liberties/Capture Calculation → Re-render / KataGo query.

### 4. Root Cause
"Root cause: [line] causes [effect] because [reason]." Tag `[ยืนยันแล้ว]` only when traced.
Vague ("something in rules") → Step 3. Hypothesis only → `[เดา]`, Layer 1 only, **STOP. NO CODE.**

### 5. Fix & Verify
Minimal change. Run `npx tsc --noEmit` + affected `npm test` only.
User-invoked → recommend `.scrutinize` before `.done`. Self-heal → stay in `.dev` scope.

### 6. Test Recommendation
After fix passes:
- **Go Rule / Logic bug** (Liberties, Ko, Suicide, SGF) → recommend unit test (`tests/go/`).
- **UI / Canvas bug** (Coordinate mapping, Stone rendering, Responsive resize) → recommend component/visual test.
- **KataGo / AI bug** (Parser, Prompt, JSON protocol) → recommend engine integration test with mocks.
