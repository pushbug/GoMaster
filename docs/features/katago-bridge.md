# Feature: KataGo Analysis Bridge

## Overview
Connects the web application to a local KataGo binary via its JSON Analysis Protocol (`katago analysis`).

## Protocol Details
- Standard Input/Output JSON lines.
- Request payload:
```json
{
  "id": "query_123",
  "moves": [["B", "Q16"], ["W", "D4"], ["B", "Q4"]],
  "rules": "japanese",
  "komi": 6.5,
  "boardXSize": 19,
  "boardYSize": 19,
  "maxVisits": 500
}
```
- Response parsing extracts:
  - `rootInfo.scoreLead`: Net points lead for current player.
  - `rootInfo.winrate`: 0.0 to 1.0 probability of winning.
  - `ownership`: 1D array of 361 values from -1.0 (white control) to 1.0 (black control).
  - `moveInfos`: Top 3 candidate moves with visit count, scoreLead, winrate, and PV (Principal Variation).

## Local Setup & Auto-Detection
- Automated Setup Command: `npm run setup:katago` (or `bash scripts/setup-katago.sh`)
- Automated detection locations:
  - Binary: `process.env.KATAGO_PATH` or `/opt/homebrew/bin/katago` or `/usr/local/bin/katago`
  - Config: `process.env.KATAGO_CONFIG` or `engine/config/analysis.cfg`
  - Model: `process.env.KATAGO_MODEL` or `engine/models/*.bin.gz`
- Environment Configuration (`.env.local`):
  ```env
  KATAGO_PATH=/opt/homebrew/bin/katago
  KATAGO_CONFIG=/path/to/engine/config/analysis.cfg
  KATAGO_MODEL=/path/to/engine/models/kata1-b15c192-s1672170752-d466197061.bin.gz
  ```

## Smart Tactical Heuristic Fallback (Mock Engine)
When local KataGo binary is not found, `generateMockAnalysis` evaluates:
1. Tactical atari capture and defense (single-liberty groups).
2. Corner 4-4 (Hoshi) and 3-4 (Komoku) openings.
3. 3rd and 4th line side extensions (avoiding 1st-line edge suicide/A19 moves).
4. Local contact responses (Hane, Extend, Kosumi).
5. Continuous Gaussian territorial influence heatmap.

## Engine Status Endpoint
`GET /api/engine/status`
Returns:
```json
{
  "connected": true,
  "isMock": false,
  "engineName": "KataGo Neural Network Core",
  "binaryPath": "/opt/homebrew/bin/katago",
  "configPath": "/path/to/analysis.cfg",
  "modelPath": "/path/to/model.bin.gz",
  "pid": 12345,
  "timestamp": 1720000000000
}
```
