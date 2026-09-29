# Go Rule Engine Architecture & Specifications

## 1. Board Representation
- Coordinate system: `x` (column 0..size-1) and `y` (row 0..size-1).
- Traditional labels: Columns A to T (omitting 'I'), Rows 1 to 19 (bottom to top, or top to bottom with standard SGF mapping).
- Cell states: `EMPTY = 0`, `BLACK = 1`, `WHITE = 2`.

## 2. Liberties & Group Capture Algorithm
- A **Group (Chain)** is a connected set of stones of the same color via orthogonal adjacency (up, down, left, right).
- **Liberties:** Adjacent empty intersections directly touching any stone in the group.
- **Capture Condition:** If a move causes an opponent group's liberties to drop to 0, that entire group is captured and removed from the board.

## 3. Move Validation Rules
1. **Occupied Intersection:** Stone cannot be placed on an already occupied intersection.
2. **Suicide Prohibition:** A move is illegal if it leaves the newly placed stone's group with 0 liberties, **UNLESS** the move simultaneously captures one or more opponent stones (which opens up liberties).
3. **Simple Ko Rule:** A move cannot recreate the exact previous board position immediately (prevents infinite 1-stone recapture cycles).

## 4. Game Control & Handicap System
- **Pass:** Turn passes to the next player. Two consecutive passes indicate game end.
- **Resign:** Current player concedes.
- **Handicap Placement (`lib/go/handicap.ts`):** Supports 2 to 9 stones on traditional star points (Hoshi) across 19x19, 13x13, and 9x9 boards. In handicap Go, White plays the first move and standard Komi defaults to 0.5.
- **Move History & Undo Integrity:** Undo (`undoMove`) faithfully preserves initial handicap states and White turn, backed by O(1) snapshots in `useGoGame`.

