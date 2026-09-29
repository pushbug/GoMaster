# GoMaster (โกะมาสเตอร์) 🥋

> **Full-Stack Go (Baduk / Weiqi) Training Platform** designed to train players from beginner level to **1 Dan**. Powered by local **KataGo Neural Analysis Engine** and **Google Gemini Flash AI Coach (9-Dan Thai Sensei)**.

---

## 🌟 Key Features (คุณสมบัติเด่น)

- 🪵 **Interactive High-Performance Board:**
  - 19x19, 13x13, and 9x9 board sizes.
  - Realistic 3D stone lighting, wood grain gradients, slate/dark mode, and minimal themes.
  - Alphanumeric coordinate markers (A-T without I) with responsive clearance.
  - Audio sound synthesis for realistic stone placement clicks.
  - Ghost stone hover preview with live suicide/legality validation indicator.
- ⚖️ **Strict International Go Rules Engine:**
  - Fast recursive BFS liberties calculation.
  - Multi-stone group surrounding & captures.
  - Strict suicide move prevention (unless capturing opponent stones).
  - Simple Ko rule (immediate board repetition prevention).
  - Pass, resignation, undo, and standard SGF export.
- 🧠 **KataGo Analysis Engine (v1.18.2):**
  - Live Winrate & Individual Black/White Score Breakdown Bar.
  - Top suggested candidate moves with winrate percentages and score loss metrics.
  - Real-time territorial ownership heatmap overlay.
  - Built-in heuristic fallback engine when local KataGo binary is not installed.
- 🥋 **AI Sensei (Google Gemini Flash 9-Dan Professional Coach):**
  - Strategic and tactical coaching in Thai.
  - Real-time evaluations of shape (Haengma), Sente/Gote, direction of play, and weak groups.
- 🎯 **Dynamic Difficulty Calibration (8 Kyu to 9 Dan):**
  - Scaled visits and error temperature allowing players to train against realistic bot ranks.
  - Move accuracy scoring and local match history tracking.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons
- **Graphics & Audio:** HTML5 2D Canvas rendering pipeline, Web Audio API
- **AI Engines:**
  - [KataGo](https://github.com/lightvector/KataGo) (JSON Analysis Mode CLI subprocess)
  - Google Gemini Flash API (`@google/genai`)
- **Testing:** Vitest, TypeScript compiler verification (`npx tsc --noEmit`)

---

## 🚀 Quickstart & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/pushbug/GoMaster.git
cd GoMaster
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Setup KataGo & Neural Model (Optional, recommended for macOS)
Run the automated setup script to install KataGo via Homebrew and download the official 1-Dan calibrated human neural network model:
```bash
chmod +x scripts/setup-katago.sh
./scripts/setup-katago.sh
```
*(If KataGo is not installed, GoMaster automatically falls back to its built-in smart tactical heuristic engine).*

### 4. Configure Environment Variables
Copy the environment template and insert your Gemini API key:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
GEMINI_API_KEY="your_google_gemini_api_key"
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

GoMaster includes comprehensive unit and integration tests covering Go rule mechanics, liberties, Ko, KataGo response parsing, and AI prompt formats:
```bash
npm test
```
To run static analysis and type checks:
```bash
npm run lint
```

---

## 🛡️ Security & Privacy (Universal AppSec)

- **Secret Boundary:** `GEMINI_API_KEY` is exclusively kept server-side and accessed through secure Next.js API route proxies (`/api/coach-explain`). Zero keys are ever bundled into client JavaScript.
- **Engine Process Isolation:** KataGo subprocess executions sanitize all coordinates and input payloads to prevent command injection and memory leaks.
- **Local Storage:** Match history and player stats are stored strictly client-side via LocalStorage.

---

## 📄 License

MIT License. Designed with ❤️ for the Go community.
