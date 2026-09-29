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
| `RULE-SGF-01` | Correctly parses and encodes SGF format | `tests/go/sgf.test.ts` | Tier 1 |
| `UI-BOARD-01` | Interactive board places stone and triggers callback | `tests/components/GoBoard.test.tsx` | Tier 2 |
| `UI-COORD-01` | Correctly maps A-T (skipping I) coordinates | `tests/go/board.test.ts` | Tier 1 |
| `ENG-JSON-01` | Generates valid KataGo JSON Analysis query structure | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-PARSE-01` | Parses winrate, scoreLead, ownership grid, and PV moves | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-MOCK-01` | Mock engine returns deterministic fallback analysis | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-VAL-01` | Rejects malformed coordinates and out-of-bounds sizes | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `ENG-API-01` | `/api/analyze` returns 200 with structured analysis | `tests/engine/katago-bridge.test.ts` | Tier 2 |
| `AI-RANK-01` | Rank calibration visits and temperature scaling 8k-9D | `tests/engine/difficulty.test.ts` | Tier 2 |
| `AI-BOT-01` | Bot move selection based on calibrated candidate moves | `tests/engine/difficulty.test.ts` | Tier 2 |
| `ACC-SCORE-01` | Move accuracy score calculation from score losses | `tests/engine/difficulty.test.ts` | Tier 2 |
| `HIST-STORE-01`| Match history schema and FIFO local storage | `lib/storage/match-history.ts` | Tier 2 |
| `UI-EVAL-01` | EvaluationBar component winrate and lead rendering | `components/go/EvaluationBar.tsx` | Tier 2 |
| `ENG-DETECT-01` | Auto-detection of local KataGo binary and neural network paths | `tests/engine/katago-status.test.ts` | Tier 2 |
| `ENG-SMART-01` | Smart tactical Go heuristic (atari defense/capture, avoids 1-1/A19) | `tests/engine/katago-status.test.ts` | Tier 2 |
| `ENG-STAT-01` | Engine status endpoint and realistic territorial heatmap | `tests/engine/katago-status.test.ts` | Tier 2 |
| `COACH-PROMPT-01` | 9-Dan coach system and user prompt formatting with board metrics | `tests/coach/gemini-coach.test.ts` | Tier 2 |
| `COACH-API-01` | /api/coach-explain API schema validation and Gemini proxy | `tests/coach/gemini-coach.test.ts` | Tier 2 |
| `COACH-FALLBACK-01` | 9-Dan tactical Thai advice fallback across game phases | `tests/coach/gemini-coach.test.ts` | Tier 2 |
| `UI-COACH-01` | CoachAdviceCard initiative and strategic concept rendering | `components/go/CoachAdviceCard.tsx` | Tier 2 |
| `ENG-MODEL-01` | Bridge rejects models smaller than 1MB (prevents XML error stubs) | `tests/engine/katago-status.test.ts` | Tier 2 |
| `ENG-CFG-01` | KataGo analysis configuration contains required threading keys | `tests/engine/katago-status.test.ts` | Tier 2 |
| `UI-EVAL-SCORE-01` | EvaluationBar calculates and renders individual Black & White point totals alongside winrate percentages | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `UI-BOARD-MARGIN-01` | GoBoard coordinate margin ensures clearance between outer boundary stones and alphanumeric labels | `tests/engine/evaluation-bar.test.ts` | Tier 2 |
| `ENG-PARSE-02` | Inverts White winrate/scoreLead correctly under SIDETOMOVE without double inversion | `tests/engine/katago-bridge.test.ts` | Tier 2 |



