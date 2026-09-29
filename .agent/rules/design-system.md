---
description: Enforce Design System Semantic Tokens and Go Board Aesthetics for Web
---

# Web UI & Go Board Design System Guidelines

When writing, creating, or refactoring React components or UI screens in this project, you MUST adhere strictly to the project's Design System to ensure proper Dark/Light mode support, responsive adaptability, and premium Baduk/Go aesthetics.

## Semantic Token Enforcement (Tailwind CSS)

1. **Theme Colors & Backgrounds**:
   - Dark Mode: Slate/Zinc deep dark backgrounds (`bg-zinc-950`, `bg-zinc-900`, `border-zinc-800`, `text-zinc-100`).
   - Light Mode: Clean crisp background with slate accents (`bg-slate-50`, `bg-white`, `border-slate-200`, `text-slate-900`).
   - Accent & Evaluation:
     - Black Player / Territory: `zinc-900` / `zinc-800` (Heatmap: semi-transparent `rgba(0, 0, 0, 0.45)`).
     - White Player / Territory: `zinc-100` / `zinc-200` (Heatmap: semi-transparent `rgba(255, 255, 255, 0.55)`).
     - Best Move / KataGo suggestion: Emerald green (`#10b981` / `text-emerald-400`).
     - Inaccuracy (-1 to -3 pts): Blue/Cyan (`#06b6d4`).
     - Mistake (-3 to -6 pts): Amber/Orange (`#f59e0b`).
     - Blunder (>-6 pts): Red/Rose (`#f43f5e`).

2. **Go Board Visual Styling**:
   - Board Canvas: Rich Kaya wood aesthetic (`#DCB35C` with subtle wood grain gradient or `#E4BE6E` for classic look, or clean minimalist slate `#27272a` in modern dark mode).
   - Grid Lines & Coordinates: Crisp 1px lines (`#543d1a` or `#3f3f46` in dark mode).
   - Stones:
     - Black Stone: Matte/glossy gradient with radial highlight (`#1a1a1a` to `#000000`) and subtle drop shadow.
     - White Stone: Pearlescent shell gradient (`#ffffff` to `#e2e8f0`) with soft edge ring and drop shadow.
     - Last Move Marker: Inverted contrasting circle/ring (`#ffffff` on black stone, `#000000` on white stone).
     - Ghost Stone (Hover): 50% opacity preview of current player's stone showing valid placements.

3. **Responsive Layout**:
   - Go Board must maintain a square aspect ratio (`aspect-square`) and dynamically scale to fit available viewport height and width.
   - Sidebars (Move History, KataGo Evaluation, Gemini Coach Panel) stack gracefully on mobile screens (<1024px).
   - Zero horizontal overflow (`overflow-x-hidden`) on mobile.
