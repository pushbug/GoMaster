import { CandidateMoveEvaluation } from './types';

export type KyuRank = '8k' | '7k' | '6k' | '5k' | '4k' | '3k' | '2k' | '1k';
export type DanRank = '1D' | '2D' | '3D' | '4D' | '5D' | '6D' | '7D' | '8D' | '9D';
export type Rank = KyuRank | DanRank;

export interface RankConfig {
  rank: Rank;
  labelThai: string;
  category: 'Kyu' | 'Dan' | 'Master';
  maxVisits: number;
  blunderRate: number; // 0.0 (perfect) to 1.0 (frequent inaccuracies)
  description: string;
}

export const ALL_RANKS: Rank[] = [
  '8k', '7k', '6k', '5k', '4k', '3k', '2k', '1k',
  '1D', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D',
];

const RANK_CONFIGS: Record<Rank, RankConfig> = {
  '8k': {
    rank: '8k',
    labelThai: '8 คิว (ผู้เริ่มต้น)',
    category: 'Kyu',
    maxVisits: 15,
    blunderRate: 0.38,
    description: 'อ่านหมากไม่ลึก มีหลุดเม็ดผิดพลาดง่าย เหมาะสำหรับผู้เริ่มฝึกเล่น',
  },
  '7k': {
    rank: '7k',
    labelThai: '7 คิว (กำลังพัฒนา)',
    category: 'Kyu',
    maxVisits: 25,
    blunderRate: 0.32,
    description: 'เริ่มระวังลมหายใจ แต่ยังมองข้ามการเชื่อมและตัดหมาก',
  },
  '6k': {
    rank: '6k',
    labelThai: '6 คิว (ระดับกลางตอนต้น)',
    category: 'Kyu',
    maxVisits: 40,
    blunderRate: 0.26,
    description: 'เริ่มรู้วิธีล้อมพื้นที่ แต่ยังสับสนจังหวะเซ็นเตะ/โกเตะ',
  },
  '5k': {
    rank: '5k',
    labelThai: '5 คิว (ระดับกลาง)',
    category: 'Kyu',
    maxVisits: 60,
    blunderRate: 0.20,
    description: 'เล่นเปิดเกมได้ดี มีสมาธิ แต่ยังพลาดในสถานการณ์ต่อสู้ชุลมุน',
  },
  '4k': {
    rank: '4k',
    labelThai: '4 คิว (ระดับกลางขั้นสูง)',
    category: 'Kyu',
    maxVisits: 85,
    blunderRate: 0.16,
    description: 'จับกินหมากเก่ง เริ่มรู้จักรูปทรงหมากมาตรฐาน (Haengma)',
  },
  '3k': {
    rank: '3k',
    labelThai: '3 คิว (ก่อนดั้ง)',
    category: 'Kyu',
    maxVisits: 120,
    blunderRate: 0.12,
    description: 'คำนวณพื้นที่ได้ดี เริ่มเข้าใจการสร้างเบ้าตาของกลุ่มหมาก',
  },
  '2k': {
    rank: '2k',
    labelThai: '2 คิว (คิวขั้นสูง)',
    category: 'Kyu',
    maxVisits: 160,
    blunderRate: 0.09,
    description: 'มีความรอบคอบ เล่นเกมริมกระดานและการลดพื้นที่อย่างชำนาญ',
  },
  '1k': {
    rank: '1k',
    labelThai: '1 คิว (ด่านสุดท้ายสู่ดั้ง)',
    category: 'Kyu',
    maxVisits: 220,
    blunderRate: 0.06,
    description: 'คู่ปรับที่สูสีที่สุดสำหรับผู้เตรียมสอบ 1 ดั้ง อ่านหมากแม่นยำ',
  },
  '1D': {
    rank: '1D',
    labelThai: '1 ดั้ง (ระดับเป้าหมาย!)',
    category: 'Dan',
    maxVisits: 350,
    blunderRate: 0.03,
    description: 'ระดับฝีมือเป้าหมายของ GoMaster! หนักแน่น ไร้จุดรั่วง่ายๆ',
  },
  '2D': {
    rank: '2D',
    labelThai: '2 ดั้ง',
    category: 'Dan',
    maxVisits: 480,
    blunderRate: 0.02,
    description: 'เชี่ยวชาญการชิงจังหวะเซ็นเตะและการโจมตีกลุ่มหมากอ่อนแอ',
  },
  '3D': {
    rank: '3D',
    labelThai: '3 ดั้ง',
    category: 'Dan',
    maxVisits: 620,
    blunderRate: 0.015,
    description: 'สายตากว้างไกล วางแผนครอบคลุมทั่วกระดานตั้งแต่ต้นเกม',
  },
  '4D': {
    rank: '4D',
    labelThai: '4 ดั้ง',
    category: 'Dan',
    maxVisits: 780,
    blunderRate: 0.01,
    description: 'ระดับมือโปรสมัครเล่น อ่านหมากและโคะไฟต์ได้อย่างเฉียบคม',
  },
  '5D': {
    rank: '5D',
    labelThai: '5 ดั้ง',
    category: 'Dan',
    maxVisits: 950,
    blunderRate: 0.008,
    description: 'พลังทำลายล้างสูง การต่อสู้กลางกระดานแม่นยำไร้ที่ติ',
  },
  '6D': {
    rank: '6D',
    labelThai: '6 ดั้ง (เซียนดั้งสูง)',
    category: 'Dan',
    maxVisits: 1150,
    blunderRate: 0.005,
    description: 'ระดับแชมป์ระดับประเทศ เล่นละเอียดทุกแต้มในเกมจบ (Endgame)',
  },
  '7D': {
    rank: '7D',
    labelThai: '7 ดั้ง (ระดับอาชีพ)',
    category: 'Master',
    maxVisits: 1350,
    blunderRate: 0.002,
    description: 'มาตรฐานนักกีฬาหมากล้อมระดับอาชีพสากล',
  },
  '8D': {
    rank: '8D',
    labelThai: '8 ดั้ง (ยอดฝีมืออาชีพ)',
    category: 'Master',
    maxVisits: 1600,
    blunderRate: 0.001,
    description: 'ความแม่นยำใกล้เคียงพลังคำนวณขั้นสูงสุดของ KataGo',
  },
  '9D': {
    rank: '9D',
    labelThai: '9 ดั้ง (สุดยอดปรมาจารย์อาชีพ)',
    category: 'Master',
    maxVisits: 1900,
    blunderRate: 0.0,
    description: 'เดินเม็ดที่ดีที่สุดของ KataGo ทุกจังหวะไร้ความปรานี',
  },
};

/**
 * Retrieves the configuration for a given rank
 */
export function getRankConfig(rank: Rank): RankConfig {
  return RANK_CONFIGS[rank] || RANK_CONFIGS['1D'];
}

/**
 * Selects an AI move from candidate moves based on calibrated rank blunder probability
 */
export function selectBotMove(
  candidates: CandidateMoveEvaluation[],
  rank: Rank
): CandidateMoveEvaluation | null {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const config = getRankConfig(rank);

  // If only 1 candidate, or 0 blunder rate, always choose top rank 1
  if (candidates.length === 1 || config.blunderRate === 0) {
    return candidates[0];
  }

  // Roll random number against blunderRate
  const roll = Math.random();
  if (roll < config.blunderRate) {
    // Pick candidate 2 or 3 if available
    if (candidates.length >= 3 && Math.random() < 0.4) {
      return candidates[2];
    }
    return candidates[1];
  }

  // Best move
  return candidates[0];
}
