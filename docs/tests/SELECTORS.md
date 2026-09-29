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
