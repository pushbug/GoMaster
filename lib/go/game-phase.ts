import { BoardSize } from './types';

export type GamePhase = 'opening' | 'middle' | 'endgame';

export interface GamePhaseInfo {
  phase: GamePhase;
  phaseThai: string;
  stageName: string;
  descriptionThai: string;
  progressPercent: number;
  moveNumber: number;
}

/**
 * Calculates current game phase (Fuseki, Chuban, Yose) based on move number and board size.
 */
export function calculateGamePhase(
  moveNumber: number,
  boardSize: BoardSize = 19
): GamePhaseInfo {
  let openingThreshold: number;
  let middleThreshold: number;
  let estimatedMaxMoves: number;

  switch (boardSize) {
    case 9:
      openingThreshold = 8;
      middleThreshold = 25;
      estimatedMaxMoves = 45;
      break;
    case 13:
      openingThreshold = 14;
      middleThreshold = 55;
      estimatedMaxMoves = 100;
      break;
    case 19:
    default:
      openingThreshold = 30;
      middleThreshold = 120;
      estimatedMaxMoves = 220;
      break;
  }

  let phase: GamePhase;
  let phaseThai: string;
  let stageName: string;
  let descriptionThai: string;

  if (moveNumber <= openingThreshold) {
    phase = 'opening';
    stageName = 'Fuseki';
    phaseThai = 'ช่วงเปิดเกม (Fuseki)';
    descriptionThai = 'เน้นยึดมุม ขยายข้าง และสร้างฐานที่มั่นคง (Corner > Side > Center)';
  } else if (moveNumber <= middleThreshold) {
    phase = 'middle';
    stageName = 'Chuban';
    phaseThai = 'ช่วงกลางเกม (Chuban)';
    descriptionThai = 'ศึกชิงพื้นที่ ตัดหมาก โจมตีกลุ่มอ่อนแอ และทำเบ้าตาให้รอด';
  } else {
    phase = 'endgame';
    stageName = 'Yose';
    phaseThai = 'ช่วงจบเกม (Yose)';
    descriptionThai = 'เก็บแต้มเซ็นเตะริมกระดาน และปิดพรมแดนอย่างละเอียดทุกจุด';
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((moveNumber / estimatedMaxMoves) * 100)));

  return {
    phase,
    phaseThai,
    stageName,
    descriptionThai,
    progressPercent,
    moveNumber,
  };
}
