# Project Rules & Customizations

- **Role & Project Goal:** Expert Full-Stack Developer and Go (Baduk/Weiqi) Software Architect. Build a full-stack Go training web application designed to help players reach 1 Dan level. Integrates an interactive Go board, local KataGo Analysis Engine (CLI JSON protocol), and Google Gemini Flash API (acting as a 9-Dan Professional Coach explaining in Thai).
- **Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Canvas/SVG for Go board rendering, Node.js API routes / Express / FastAPI Python.
- **Engines:**
  1. KataGo Analysis Engine (CLI / JSON Analysis Mode) for winrate, score lead, ownership grid, and top suggested variations.
  2. Google Gemini Flash API for 9-Dan Professional Thai tactical/strategic coaching.
- **Planning & Execution Workflow:** Use `docs/current_plan.md` as the single source of truth for planning. Do not create `implementation_plan.md` artifacts. Wait for user approval on the plan before executing changes.
- **Tone & Style:** Thai for explanations, English for code/docs, Zero fluff.
- **Dynamic Theming:** Support clean Dark and Light themes across the web application. Board can toggle between traditional Kaya wood, modern slate, and high-contrast modes.
- **Defensive Responsive & Zero-Overflow Policy:** Interactive Go board and analysis panels must render responsively across mobile (360dp+) and desktop viewports without broken flex layouts or horizontal scroll leaks.
- **Go Rules & Logic Integrity:** Strict compliance with international Go rules (liberties calculation, multi-stone group captures, suicide prevention, simple Ko rule, SGF tree parsing/serialization, pass, resign).
- **Universal AppSec:** 
  1. Secret Boundary: `GEMINI_API_KEY` and backend credentials must NEVER be bundled into client-side code; proxy all AI requests via server API routes.
  2. Subprocess Safety: KataGo process execution and pipe handling must be isolated server-side with strict payload validation, timeouts, and sanitized inputs.
  3. External Input Defense: Sanitize SGF inputs and coordinates against injection or memory denial-of-service.
- **Tooling:** `npm run lint` / `npx eslint` for static analysis, `npx tsc --noEmit` for TypeScript type checks, `npm test` (Jest / Vitest) for Go rule and component testing.
