---
name: scrutinize
description: Trigger when the user runs the .scrutinize command. Acts as a mobile verification gatekeeper to review code or plans without writing code.
invocation_type: user-invoked
---

# SKILL: Scrutinize & Quality Gatekeeper (v4.0 - GoMaster Web)

> Trigger: `.scrutinize` | Dual Shorthand: `.scrutinize ตรวจแผน` or `.scrutinize ตรวจโค้ด`

## DUAL SHORTHAND MODES & AUTO-DETECTION

1. **Mode A — Plan Audit (`.scrutinize ตรวจแผน` or `.scrutinize plan`):**
   - Target: `docs/current_plan.md`
   - Focus: Consult/Grill ingestion completeness, scope boundaries, test mapping, and max 7-step sequential integrity.
   - **Strict Plan Syntax Contract (Silent Background Pre-filter):**
     - Regex Invariant: Every step line under `## Steps (max 7):` MUST strictly match:
       `^- \[ \] Step [1-7]: .+ -> Verify: .+$`
     - Mandatory Invariants: Task checkbox `- [ ]`, sequential numbers 1..N (N<=7), deterministic `-> Verify: [CLI check]`.

2. **Mode B — Dev Audit (`.scrutinize ตรวจโค้ด` or `.scrutinize dev` or `.scrutinize code`):**
   - Target: `git diff` against base branch + `npm test` & type check results.
   - Focus: Implementation correctness, Go rule verification, zero secret exposure, resource cleanup (canvas, audio, engine pipes).

3. **Auto-Detection (bare `.scrutinize`):**
   - If `docs/current_plan.md` has `Status: ACTIVE` and working tree has no src changes → Auto-run Mode A (Plan Audit).
   - If code has uncommitted/committed changes or plan has `Status: COMPLETE` → Auto-run Mode B (Dev Audit).

## STANCE

- Zero bias. Question existence. No flattery/hedging.
- Evidence required: cite file/line/path.

## WORKFLOW

### 0. PLAN SYNTAX & CONTRACT SCAN (MODE A)
- Verify `docs/current_plan.md` status line: `Status: ACTIVE`.
- Run regex validation: `^- \[ \] Step [1-7]: .+ -> Verify: .+$`.
- Verify Universal AppSec (Pillars 1-4) and Go Rule integrity.

### 1. DIFF SCAN (MODE B)
- `git diff --name-only` against base branch.
- Changed components: verify `data-testid` and matching tests exist.

### 2. REGRESSION DIFF AUDIT
- Check for removed rule checks, bypassed liberties calculations, or leaked API keys.

### 3. INTENT & SIMPLICITY
- Core goal in 1 sentence. Simpler alternative if applicable.

### 4. GO RULES & ENGINE SAFETY
- Check liberties calculation for recursion depth.
- Check Ko rule handling (simple Ko, superko consideration).
- Verify KataGo pipe communication safety (unhandled JSON parse errors, process zombie prevention).
- Check Gemini Flash API rate limit and key isolation.

### 5. TEST VERIFICATION
- Run `npx tsc --noEmit && npm test`.
- Never weaken assertions to pass.

### 6. REPORT (Fixed 5-Point Checklist Schemas)

#### Mode A: Plan Audit Report (`ตรวจแผน`)

**Layer 1 — สรุป (ไทย, HUMANS ONLY):**
```markdown
### ผลการตรวจแผนงาน (Plan Audit Checklist)
- [x] หรือ [ ] 1. สรุปภาพรวม: [สิ่งที่แผนจะทำ 1 ประโยค]
- [x] หรือ [ ] 2. ความครอบคลุม: [ครบถ้วนตาม requirements / ตกหล่นจุดใด]
- [x] หรือ [ ] 3. ผลกระทบข้างเคียง & ความปลอดภัย: [ปลอดภัย / ผ่าน Universal AppSec 4 เสาหลัก / มีจุดเสี่ยงใด]
- [x] หรือ [ ] 4. แผนการทดสอบ: [ระบุชัดเจน มี Unit/Component/E2E test รองรับ พร้อมคำสั่ง verify ทุก step]
- [x] หรือ [ ] 5. คำวินิจฉัย: ผ่าน (Ship) -> สั่ง .dev ได้เลย / Fix-then-ship / Reject
```

#### Mode B: Dev Audit Report (`ตรวจโค้ด`)

**Layer 1 — สรุป (ไทย, HUMANS ONLY):**
```markdown
### ผลการตรวจโค้ด (Dev Audit Checklist)
- [x] หรือ [ ] 1. ความถูกต้องของโค้ด: [ตรงตามสเปกและกฎหมากล้อม]
- [x] หรือ [ ] 2. การทดสอบ (Tests): [เทสต์รันผ่านจริงทุกเคส (Liberties, Captures, Ko, Suicide)]
- [x] หรือ [ ] 3. สุขอนามัยโค้ด: [ไม่พบโค้ดซ้ำซ้อน Component สะอาด รองรับ Responsive]
- [x] หรือ [ ] 4. ความปลอดภัยของระบบ & AppSec: [GEMINI_API_KEY ไม่รั่วไหลสู่ client / Sandbox & Engine ปลอดภัย]
- [x] หรือ [ ] 5. คำวินิจฉัย: ผ่าน (Ship) -> สั่ง .done ปิดงานได้เลย / Fix-then-ship / Reject
```

**Layer 2 — [for AI] Technical (Both Modes):**
- Blocker → Major → Nit. Per finding: `file:line | Issue | Root cause [tag] | Impact | Fix`
- Test Result: `ผ่าน: X | ล้มเหลว: Y | ข้าม: Z`

## PROHIBITIONS

- NEVER write code or fixes in scrutinize. Report only.
