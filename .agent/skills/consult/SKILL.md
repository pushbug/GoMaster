---
name: consult
description: Trigger when the user runs the .consult command. Senior-level project consultation — reads docs and code to answer questions without generating plans or code.
invocation_type: user-invoked
---

# Consult Phase (GoMaster Web)

> Invoke: `.consult [question about the project]`

## Purpose

Act as a senior Go software architect and full-stack engineer who knows the entire project. Read whatever is needed — docs, source code, config — then answer the user's question directly. No plans. No code generation. No side-effects.

## HARD RULES

- **READ-ONLY.** Read any file needed to answer. Never create, modify, or delete files.
- **NO PLANS.** Never produce `current_plan.md`, `implementation_plan.md`, or step lists.
- **NO CODE GEN.** Never write production code, test code, or scripts.
- **NO SESSION EDITS.** Never touch `docs/session.md`.
- **ANSWER THE QUESTION.** The entire output is the answer — concise, structured, opinionated.
- **MANDATORY NEXT DIRECTIVE.** Every answer must end with an explicit Next Command Directive telling the human exactly which command to run next (.plan, .grill, .scrutinize, or no action needed).
- **ESCALATE WHEN NEEDED.** If the question requires implementation steps or decisions with side-effects, answer at conceptual level only + append directive: _ก้าวต่อไป สั่ง: .plan [เป้าหมาย]_

## SEQUENCE

1. **Session anchor** (first use per session): read `docs/INDEX.md` + `docs/session.md` to orient.
2. **Scope reads:** Use the routing table below to find relevant docs. Read source files directly when needed.
3. **Answer:** Respond using the Two-Layer format below.

## DOC ROUTING TABLE

| Question type                        | Read first                                         |
| ------------------------------------ | -------------------------------------------------- |
| Architecture / state management      | `docs/core/` relevant file via INDEX               |
| Go Rules & Board logic               | `docs/core/go-rules.md`, `docs/features/go-board.md`|
| KataGo engine bridge / Protocol      | `docs/features/katago-bridge.md`                   |
| AI Sensei / Gemini Coach prompt      | `docs/features/coach-sensei.md`                    |
| Feature requirements / product scope | `docs/prd.md`                                      |
| Tests / selectors / test IDs         | `docs/tests/CATALOG.md`, `docs/tests/SELECTORS.md` |
| Roadmap / future milestones / ideas  | `docs/roadmap.md`                                  |
| Current work / in-progress           | `docs/session.md`, `docs/current_plan.md`          |
| Past decisions / why X was chosen    | `docs/decisions.md`                                |
| Config / dependencies                | `package.json`, relevant config files directly     |

> Always start from `docs/INDEX.md` if the category is ambiguous.

## IDEA INGESTION & GRANULARITY CLASSIFICATION

When the user proposes a new feature, improvement, or idea under `.consult`:
1. **Audit `docs/roadmap.md`:** Map the idea against existing Milestones.
2. **Classify into 3 Granularity Tiers:**
   - **Tier A (New Major Milestone):** Brand-new architectural pillar (e.g. Real-time Multiplayer WebSockets, SGF Cloud Library). Provide dependency analysis → propose inserting as a new numbered Milestone in `docs/roadmap.md`.
   - **Tier B (Sub-task of Existing Milestone):** A component or enhancement belonging to an existing milestone (e.g. KataGo ownership heatmap overlay belongs to Milestone 4 Dashboard; stone sound synthesizer belongs to Milestone 1 Board). Explicitly state: _"นี่คืองานย่อยใต้ Milestone X"_ → propose adding as a sub-bullet.
   - **Tier C (Micro-tweak / Polish):** One-off cosmetic tweak (board color, button padding, tooltip text) → advise handling directly during `.plan` without touching `docs/roadmap.md`.

## OUTPUT FORMAT

### Layer 1 — สรุป (ไทย)

- Direct answer in 1–5 sentences. Plain language, no jargon dump.
- Opinion when asked: state whether something is good/bad and WHY.
- Options when applicable: list choices with pros/cons as a table or bullets.
- **Next Command Directive (Mandatory Final Line):** Every `.consult` Layer 1 MUST conclude with an explicit directive guiding the user:
  - If actionable for execution: _ก้าวต่อไป สั่ง: `.plan [เป้าหมาย]`_
  - If requirement needs stress-testing first: _ก้าวต่อไป สั่ง: `.grill [หัวข้อ]`_
  - If referencing code/plan ready for audit: _ก้าวต่อไป สั่ง: `.scrutinize ตรวจแผน` (หรือ `.scrutinize ตรวจโค้ด`)_
  - If purely informational inquiry (no further action needed): _จบการปรึกษา: ไม่จำเป็นต้องสั่งคำสั่งเพิ่ม_

### Layer 2 — [for AI] Technical

Use this exact structure per claim:

```
Claim: [what is true]
Source: file:line
Trace: A → B → C (omit if trivial)
```

- One block per distinct claim. No narrative prose.
- Data flow or dependency chain when relevant.
