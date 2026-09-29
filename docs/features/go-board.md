# Feature: Go Board Component & Interactive UI

## Component Overview
The Go Board is the central visual element of GoMaster. It supports 19x19, 13x13, and 9x9 grids with realistic stone rendering and responsive layout.

## Visual Design
- **Wood Texture:** Kaya wood tone (`#DCB35C`) with subtle border frame.
- **Grid & Star Points:** Star points (Hoshi) at standard positions:
  - 19x19: (3,3), (9,3), (15,3), (3,9), (9,9), (15,9), (3,15), (9,15), (15,15).
  - 13x13: (3,3), (9,3), (6,6), (3,9), (9,9).
  - 9x9: (2,2), (6,2), (4,4), (2,6), (6,6).
- **Coordinate Labels:** Columns A-T (skipping 'I') on top and bottom, Rows 1-19 on left and right.
- **Stones:** Radial gradient shading for 3D depth, soft drop shadow.
- **Last Move Marker:** Small contrasting ring/dot on the most recently placed stone.
- **Ghost Stone Preview:** Translucent preview of current player's stone following cursor over valid empty points.
- **Audio Feedback:** Synthesized wood-click audio using Web Audio API on valid move placement.

## Props & State Interface
```typescript
interface GoBoardProps {
  boardSize: 9 | 13 | 19;
  boardState: BoardState;
  onPlayMove: (x: number, y: number) => boolean;
  lastMove?: Point | null;
  interactive?: boolean;
  ownershipMap?: number[][]; // -1.0 to 1.0
  candidateMoves?: CandidateMove[];
}
```
