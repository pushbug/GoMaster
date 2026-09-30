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
| Replay Last Move Button | `btn-replay-last` | Jump to latest move / return to live game |
| Replay Step Indicator | `replay-step-indicator` | Displays current move index and total moves |
| Coach Advice Tab | `tab-coach` | Tab button for AI Sensei Coach advice |
| Move History Tab | `tab-history` | Tab button for Move History |
| Heatmap Mode Container | `toggle-heatmap-mode` | Multi-mode heatmap segmented switcher in bottom bar |
| Heatmap All Button | `btn-heatmap-all` | Toggle combined black and white territory heatmap |
| Heatmap Black Button | `btn-heatmap-black` | Toggle Black territory heatmap overlay |
| Heatmap White Button | `btn-heatmap-white` | Toggle White territory heatmap overlay |
| Black Player Badge | `eval-player-black` | Player identity badge for Black in EvaluationBar |
| White Player Badge | `eval-player-white` | Player identity badge for White in EvaluationBar |
| History Black Column | `history-col-black` | Black move column in history panel |
| History White Column | `history-col-white` | White move column in history panel |
| Game Phase Progress Bar | `game-phase-bar` | Segmented opening/middle/endgame progress indicator |
| Coach Advice Card | `coach-advice-card` | Container for AI Sensei 9-Dan tactical coaching guidance |
| Opponent Move Card | `opponent-move-card` | Dedicated card displaying opponent's last move coord, intent, and delta |
| Opponent Move Coord | `opponent-move-coord` | Coordinate badge for opponent's last move |
| Opponent Score Delta | `opponent-score-delta` | Point delta badge (+/- points) for opponent's move |
| Candidate Moves Card | `candidate-moves-card` | Container for Top 3 KataGo candidate move recommendations |
| Candidate Move Item | `candidate-move-item` | Clickable move choice with tactical tag and metrics |
| Move Intent Box | `move-intent-box` | Strategic explanation of opponent's previous move intent |
| Candidate Thinking State | `candidate-thinking-state` | Loader indicator displayed while opponent bot is computing move |
| Logo Target Badge | `logo-target-badge` | 1-Dan target rank badge in header logo branding |
| Victory Modal Container | `modal-victory` | Dialog container for post-match victory and dead dragon autopsy |
| Toggle Dead Stones Button | `btn-toggle-dead-stones` | Toggle button to highlight dead stones on the board |
| Dragon Summary Card | `dragon-summary-card` | Autopsy card displaying dead dragon count, coordinates, and region |
| Victory Replay Button | `btn-victory-replay` | Dismiss modal to inspect the final board in replay mode |
| Victory New Game Button | `btn-victory-new-game` | Start a new game directly from victory modal |
| Candidate PV Preview Button | `candidate-pv-preview-btn` | Button to toggle sequential PV variation ghost preview on board |
| Candidate Explanation Box | `candidate-explanation-box` | Pedagogical tactical breakdown box (Purpose, Self, Opponent) |
