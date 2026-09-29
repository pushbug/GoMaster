# Feature: AI Sensei (Gemini Flash 9-Dan Coach)

## Overview
GoMaster integrates Google Gemini Flash as an AI Sensei acting as an encouraging, authoritative 9-Dan Professional Go Master. The coach interprets live KataGo engine evaluations (winrate, score lead, candidate moves) and provides contextual tactical advice in professional Thai.

## Architecture
```
Client (GoBoard / Page)
       │
       ▼ POST /api/coach-explain
Server Proxy Route (Node.js)
       │
       ├─► GEMINI_API_KEY present?
       │        ├─► YES: Google Gemini 2.5 Flash API (Structured JSON)
       │        └─► NO:  Local 9-Dan Tactical Fallback Advisor
       ▼
JSON Response -> CoachAdviceCard
```

## Key Pedagogical Principles
1. **Initiative (Sente vs Gote / Tenuki):** Evaluates who controls the initiative or whether it is time to tenuki to a bigger board area.
2. **Urgent before Big (急場先、大場後):** Prioritizes weak group defense and eye shapes before expanding into large open side areas.
3. **Shape & Haengma:** Identifies sound connections, warns against inefficient shapes (such as the empty triangle), and recommends hane/extend/kosumi.
4. **Direction of Play:** Teaches opening fundamentals (Corner $\to$ Side $\to$ Center).

## Request / Response Contract
### Request (`POST /api/coach-explain`)
```json
{
  "boardSize": 19,
  "moveNumber": 24,
  "lastMove": { "color": "W", "coord": "D4" },
  "winrate": 54.2,
  "scoreLead": 1.5,
  "bestSuggestedMove": { "coord": "Q16", "winrate": 54.8, "scoreLead": 1.8 },
  "playerColor": "B",
  "userRank": "1D"
}
```

### Response
```json
{
  "initiative": "Sente",
  "initiativeThai": "เซ็นเตะ (ได้จังหวะบุกก่อน)",
  "evaluationTitle": "รักษาจังหวะบุกเซ็นเตะที่มุมขวาบน",
  "tacticalAdvice": "เม็ด Q16 ของคุณสร้างความแข็งแกร่งอย่างมาก สามารถใช้จังหวะนี้ขยายพื้นที่ไปทาง R10 ได้ทันที",
  "keyConcept": "ชิงเดินจุดเร่งด่วนก่อนจุดใหญ่ (急場先、大場後)",
  "suggestedAction": "เดินเม็ด R10 เพื่อเปิดพื้นที่ปีกขวา",
  "isAiGenerated": true
}
```

## Universal AppSec Compliance
- **Secret Isolation:** `GEMINI_API_KEY` is loaded exclusively inside server API routes (`app/api/coach-explain/route.ts`). It is never bundled into client bundles or prefixed with `NEXT_PUBLIC_`.
- **Offline / Sandbox Resilience:** Automated tests mock all API requests. In the absence of an API key, the system automatically falls back to `generateFallbackCoachAdvice` without throwing runtime errors.
