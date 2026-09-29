# Universal AppSec & Safety Protocol (Compliance)

## 1. Secret Boundary (Pillar 1)
- `GEMINI_API_KEY` must be configured strictly in server environment variables (`.env.local`).
- NEVER prefix sensitive keys with `NEXT_PUBLIC_`.
- No server API keys in client-side bundles or repository commits.

## 2. Engine Subprocess Isolation (Pillar 2 & 3)
- KataGo subprocess must be spawned and managed only within server-side Node.js / Python backend.
- Sanitize all parameters sent to the engine (validate board size, coordinate bounds).
- Guard against child process memory leaks, zombie processes, and unbounded JSON pipe queues.

## 3. External Input Defense (Pillar 3)
- Validate SGF strings before parsing (check maximum file size ≤ 2MB, validate balanced brackets).
- Validate coordinates submitted to move placement endpoints to prevent array out-of-bounds or prototype pollution.

## 4. Privilege & Debug Gating (Pillar 4)
- Internal dev debug switches or test board fixtures must only be enabled when `process.env.NODE_ENV !== 'production'`.
