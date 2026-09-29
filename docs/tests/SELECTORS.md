# Selector Registry (`data-testid`) — GoMaster

| Element | Selector (`data-testid`) | Description |
|---|---|---|
| Go Board Canvas/Container | `go-board` | Root container for the interactive board |
| Board Intersection | `board-cell-{x}-{y}` | Individual clickable intersection (if DOM/SVG) |
| Pass Button | `btn-pass` | Pass current turn |
| Resign Button | `btn-resign` | Resign current game |
| Undo Move Button | `btn-undo` | Step back one move |
| Redo Move Button | `btn-redo` | Step forward one move |
| Board Size Selector | `select-board-size` | Dropdown for 19x19, 13x13, 9x9 |
| Turn Indicator | `turn-indicator` | Displays Black or White to move |
| Black Captures Counter | `counter-black-captures`| Number of white stones captured by Black |
| White Captures Counter | `counter-white-captures`| Number of black stones captured by White |
| Evaluation Bar | `eval-bar` | Winrate and Score Lead bar |
| Coach Advice Panel | `coach-advice-panel` | Gemini Flash feedback box |
| Heatmap Toggle | `toggle-heatmap` | Toggle KataGo ownership overlay |
| New Game Header Button | `btn-new-game` | Header button to trigger New Game modal |
| New Game Modal Container | `modal-new-game` | Dialog container for game setup |
| Start Game Confirm Button | `btn-start-game` | Confirm and start new configured game |
| Replay First Move Button | `btn-replay-first` | Jump to move 0 (initial board) |
| Replay Prev Move Button | `btn-replay-prev` | Step backward one move (ArrowLeft) |
| Replay Next Move Button | `btn-replay-next` | Step forward one move (ArrowRight) |
| Replay Last Move Button | `btn-replay-last` | Jump to latest move / return to head |
| Replay Live Return Button | `btn-replay-live` | Return to live head during in-game review |
| Replay Step Indicator | `replay-step-indicator` | Displays current move index and total moves |
| Coach Advice Tab | `tab-coach` | Tab button for AI Sensei Coach advice |
| Move History Tab | `tab-history` | Tab button for Move History |
| Heatmap Mode Toggle | `toggle-heatmap-mode` | Multi-mode heatmap toggle button in bottom bar |
| Black Player Badge | `eval-player-black` | Player identity badge for Black in EvaluationBar |
| White Player Badge | `eval-player-white` | Player identity badge for White in EvaluationBar |
| History Black Column | `history-col-black` | Black move column in history panel |
| History White Column | `history-col-white` | White move column in history panel |

