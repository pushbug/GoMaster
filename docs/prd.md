# Product Requirements Document (PRD) — GoMaster

## 1. Product Vision & Target Audience
- **Vision:** An intelligent, accessible Go (Baduk / Weiqi) training web application combining superhuman neural evaluation (KataGo) with pedagogical human-like guidance (Gemini Flash as a 9-Dan Thai Sensei).
- **Target Audience:** Go players currently at Kyu levels (e.g. 15k to 1k) aiming to cross the threshold into 1 Dan level.

## 2. Core Value Propositions
1. **Accurate Rule Enforcement:** Uncompromising Go rule logic supporting international standards (Japanese/Chinese territory and life-and-death rules).
2. **Deep Objective Evaluation:** Sub-second KataGo analysis providing precise winrates, score leads, ownership territory grids, and PV candidate lines.
3. **Actionable Thai AI Coaching:** Rather than showing opaque neural numbers, the AI Sensei explains *why* a move lost points, classifies Sente/Gote, diagnoses weak groups, and teaches Haengma (shape).

## 3. Scope & Feature Boundaries

### In-Scope (Phase 1 to 4)
- 19x19, 13x13, and 9x9 board sizes.
- Interactive board with coordinates, stone placement, sounds, captures, last move marker.
- SGF import/export and move tree navigation.
- KataGo JSON pipe analysis.
- Gemini Flash Thai coaching endpoint.
- Winrate bar, territory heatmap, candidate move overlays.

### Non-Goals (Current Iteration)
- Multi-user online matchmaking / real-time PvP lobby.
- User authentication and persistent cloud database (local storage / SGF file management first).
- Native iOS / Android compilation (responsive mobile web first).
