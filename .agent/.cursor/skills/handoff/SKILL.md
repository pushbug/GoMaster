---
name: handoff
description: Trigger when the user runs the .done command. Enforces session wrap-up, scoped documentation updates, and git safety.
invocation_type: user-invoked
---

# SKILL: Task Delivery Handoff (v4.0 - GoMaster Web)

> Scope: Session closure & persistent state transfer via `docs/session.md`.

## Workflow

1. Read `docs/INDEX.md`, `docs/session.md`, and `docs/current_plan.md`. Verify all tasks in `current_plan.md` are checked `[x]`.
2. Overwrite `docs/session.md` entirely with schema below.
3. Git sync: follow branch logic.

## Guard

- BLOCKED if: the last `.scrutinize` verdict was not `Ship`, the test suite is currently failing, or any task in `docs/current_plan.md` is incomplete.
- **VERIFICATION GATE:** Confirm `.scrutinize` actually ran against the current changes. If the flow skipped it (e.g. `.dev` → `.done` directly), WARN the user and recommend running `.scrutinize` first. Never close silently claiming a pass that was never verified.
- **DOC UPDATE CHECKLIST:** Evaluate which scoped docs changed during work. Update ONLY affected files:
  - Board & Go rules → matching `docs/features/go-board.md` or `docs/core/go-rules.md`
  - KataGo engine bridge → `docs/features/katago-bridge.md`
  - AI Sensei & prompts → `docs/features/coach-sensei.md`
  - New test IDs → `docs/tests/CATALOG.md` + `docs/tests/SELECTORS.md` if new selectors
  - Milestones completed → update `docs/roadmap.md` (`[x] Completed (YYYY-MM-DD)`)
- **DECISION LOG:** Append any new architectural/design decision to `docs/decisions.md`.
- **SKILL SYNC CHECK:** If any skill or rule file was modified this session (`.agent/skills/`, `.agent/AGENTS.md`, `.agent/.cursor/skills/`, `.agent/.cursor/rules/`) → **WARN the user:** "อย่าลืม mirror การเปลี่ยนแปลงนี้ไปยัง [.cursor/ | .agent/] ด้วย ก่อนปิด session"

## Output Schema (Strict — English only)

### Goal: [1 sentence]

### Status: [COMPLETE | IN PROGRESS | BLOCKED — state blocker if blocked]

### Done:

- [Max 7 bullets. Ref paths/URLs only.]

### Next:

- [1. Immediate action first]
- [2. Subsequent steps]

### Decisions:

- [Constraints and key design choices only.]

### Skills:

- [`skill-name`](.agent/skills/) — [one-line reason]

## Prohibitions

- No conversation history, failed attempts, or chatter.
- Redact all PII/keys/passwords (`GEMINI_API_KEY`).
- Output MUST be a single code block for `docs/session.md` only.
- NO absolute paths. Workspace-relative paths only.
- **State Cache Eviction:** Delete `docs/current_plan.md` during this phase.
