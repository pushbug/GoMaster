# Test Catalog — GoMaster

| Test ID | Description | File | Tier |
|---|---|---|---|
| `RULE-LIB-01` | Calculates 4 liberties for single center stone | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-LIB-02` | Calculates 3 liberties for edge stone, 2 for corner | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-CAP-01` | Captures single opponent stone when 0 liberties remain | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-CAP-02` | Captures multi-stone group when surrounded | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-SUI-01` | Rejects suicide move that creates 0-liberty group | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-SUI-02` | Allows move with 0 initial liberties if it captures opponent | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-KO-01` | Enforces simple Ko rule (prohibits immediate board repetition) | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-KO-02` | Allows recapture after intervening move (tenuki) | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-PASS-01` | Switches turn on pass without placing stone | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-SGF-01` | Correctly parses and encodes SGF format | `tests/go/rules.test.ts` | Tier 1 |
| `UI-BOARD-01` | Interactive board places stone and triggers callback | `tests/go/board-renderer.test.ts` | Tier 2 |
| `UI-COORD-01` | Correctly maps A-T (skipping I) coordinates | `tests/go/rules.test.ts` | Tier 1 |
| `ENG-JSON-01` | Generates valid KataGo JSON Analysis query structure | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-PARSE-01` | Parses winrate, scoreLead, ownership grid, and PV moves | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-MOCK-01` | Mock engine returns deterministic fallback analysis | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-VAL-01` | Rejects malformed coordinates and out-of-bounds sizes | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-API-01` | `/api/analyze` returns 200 with structured analysis | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `AI-RANK-01` | Rank calibration visits and temperature scaling 8k-9D | `tests/engine/difficulty.test.ts` | Tier 2 |
| `AI-BOT-01` | Bot move selection based on calibrated candidate moves | `tests/engine/difficulty.test.ts` | Tier 2 |
| `ACC-SCORE-01` | Move accuracy score calculation from score losses | `tests/engine/difficulty.test.ts` | Tier 2 |
| `HIST-STORE-01`| Match history schema and FIFO local storage | `tests/components/replay-navigation.test.ts` | Tier 2 |
| `UI-EVAL-01` | EvaluationBar component winrate and lead rendering | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `ENG-DETECT-01` | Auto-detection of local KataGo binary and neural network paths | `tests/engine/katago-status.test.ts` | Tier 2 |
| `ENG-SMART-01` | Smart tactical Go heuristic (atari defense/capture, avoids 1-1/A19) | `tests/engine/katago-status.test.ts` | Tier 2 |
| `ENG-STAT-01` | Engine status endpoint and realistic territorial heatmap | `tests/engine/katago-status.test.ts` | Tier 2 |
| `COACH-PROMPT-01` | 9-Dan coach system and user prompt formatting with board metrics | `tests/coach/gemini-coach.test.ts` | Tier 2 |
| `COACH-API-01` | /api/coach-explain API schema validation and Gemini proxy | `tests/coach/gemini-coach.test.ts` | Tier 2 |
| `COACH-FALLBACK-01` | 9-Dan tactical Thai advice fallback across game phases | `tests/coach/gemini-coach.test.ts` | Tier 2 |
| `UI-COACH-01` | CoachAdviceCard initiative and strategic concept rendering | `tests/coach/gemini-coach.test.ts` | Tier 2 |
| `ENG-MODEL-01` | Bridge rejects models smaller than 1MB (prevents XML error stubs) | `tests/engine/katago-status.test.ts` | Tier 2 |
| `ENG-CFG-01` | KataGo analysis configuration contains required threading keys | `tests/engine/katago-status.test.ts` | Tier 2 |
| `UI-EVAL-SCORE-01` | EvaluationBar calculates and renders individual Black & White point totals alongside winrate percentages | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `UI-BOARD-MARGIN-01` | GoBoard coordinate margin ensures clearance between outer boundary stones and alphanumeric labels | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `ENG-PARSE-02` | Inverts White winrate/scoreLead correctly under SIDETOMOVE without double inversion | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-PARSE-03` | Inverts ownershipGrid polarity when currentPlayer is White so +1.0 = Black, -1.0 = White | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `UI-EVAL-SCORE-02` | EvaluationBar assigns territory points correctly during White-dominant turns without Black/White inversion | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `UI-BOARD-CLEAN-01` | GoBoard render pipeline executes cleanly without rendering candidate moves overlay badges | `tests/go/board-renderer.test.ts` | Tier 2 |
| `UI-BOARD-BORDER-01` | Board background renders single perimeter line without redundant outer bevel border rectangle | `tests/go/board-renderer.test.ts` | Tier 2 |
| `UI-NEWGAME-01` | NewGameModal renders configuration controls and emits selected payload on start | `tests/components/new-game-modal.test.ts` | Tier 2 |
| `UI-BOARD-LAYOUT-01` | Board layout integrates turn indicator, captures, move number, and under-board actions | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `UI-REPLAY-01` | Step navigation (|<<, <, >, >>|), snapshot board state rendering, and click-to-jump | `tests/components/replay-navigation.test.ts` | Tier 2 |
| `UI-REPLAY-02` | Keyboard arrow keys (ArrowLeft/ArrowRight), review mode board lock, and Back to Live | `tests/components/replay-navigation.test.ts` | Tier 2 |
| `UI-TABS-01` | 2-Tab Right Panel switching between AI Sensei Coach and Move History | `tests/components/heatmap-history-tabs.test.ts` | Tier 2 |
| `UI-HEATMAP-01` | Multi-mode Heatmap toggle ('none', 'both', 'black', 'white') and Canvas renderer territory filtering | `tests/components/heatmap-history-tabs.test.ts` | Tier 2 |
| `UI-HIST-DELTA-01` | 2-Column Move History (Black vs White) with per-move score delta (+/- points) calculation and active jump | `tests/components/heatmap-history-tabs.test.ts` | Tier 2 |
| `UI-EVAL-ID-01` | EvaluationBar dual-player identity badges (Player vs AI rank) mapped to playerColor | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `UI-FONT-PROMPT-01` | Integration of Google Prompt font and 14px base typography scaling across GoMaster UI | `tests/components/typography-prompt.test.ts` | Tier 2 |
| `RULE-HCAP-01` | Handicap game initialization, White first turn, star point placement, and fallback | `tests/go/rules.test.ts` | Tier 1 |
| `UI-HEATMAP-RENDER-01` | Canvas renderer ownership heatmap mode filtering ('none', 'black', 'white', 'both') | `tests/go/board-renderer.test.ts` | Tier 2 |
| `UI-REPLAY-SNAP-01` | Snapshot reconstruction for Pass and Resign move records | `tests/components/replay-navigation.test.ts` | Tier 2 |
| `UI-HIST-PAIR-01` | 2-Column move pairing for White-first handicap games and neutral delta | `tests/components/heatmap-history-tabs.test.ts` | Tier 2 |
| `UI-NEWGAME-HCAP-01` | 13x13 handicap star points and 19x19 9-stone full handicap placement | `tests/components/new-game-modal.test.ts` | Tier 2 |
| `RULE-UNDO-HCAP-01` | Validates undoMove retains handicap stones and White turn when undoing moves | `tests/go/rules.test.ts` | Tier 1 |
| `RULE-HCAP-DOMAIN-01` | Pure domain Go handicap star points and Komi resolution in lib/go/handicap.ts | `tests/components/new-game-modal.test.ts` | Tier 1 |
| `HOOK-REPLAY-NAV-01` | Custom useReplayNavigation hook step transitions, boundary clamping, and key events | `tests/components/replay-navigation.test.ts` | Tier 2 |



