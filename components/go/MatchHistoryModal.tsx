'use client';

import React, { useEffect, useState } from 'react';
import { clearMatchHistory, getMatchHistory, MatchRecord } from '@/lib/storage/match-history';
import { Award, Calendar, Download, Trash2, Trophy, X } from 'lucide-react';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<MatchRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getMatchHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadSgf = (match: MatchRecord) => {
    const blob = new Blob([match.sgf], { type: 'application/x-go-sgf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gomaster_vs_ai_${match.botRank}_${match.date.slice(0, 10)}.sgf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('คุณต้องการลบประวัติการแข่งขันทั้งหมดหรือไม่?')) {
      clearMatchHistory();
      setHistory([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                ประวัติการแข่งขัน & คะแนน (Match Records)
              </h2>
              <p className="text-xs text-zinc-400">
                บันทึกสถิติการเล่นสู้กับ AI ความแม่นยำ และแต้มแต่ละรอบ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-400 text-xs transition-colors"
                title="ลบประวัติทั้งหมด"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-2">
              <Award className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-sm font-medium">ยังไม่มีประวัติการแข่งขัน</p>
              <p className="text-xs">
                เลือกโหมด &quot;สู้กับ AI&quot; แล้วเริ่มแข่งขันเพื่อเก็บสถิติความแม่นยำ
              </p>
            </div>
          ) : (
            history.map(match => {
              const isWin = match.winner === 'Player';
              return (
                <div
                  key={match.id}
                  className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isWin ? 'ชนะ (Victory)' : 'แพ้ (Defeat)'}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200">
                        ปะทะ AI ระดับ {match.botRank} ({match.boardSize}x{match.boardSize})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                      <span>ผล: {match.result}</span>
                      <span>จำนวน: #{match.totalMoves} เม็ด</span>
                      <span className="flex items-center gap-1 text-zinc-500 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(match.date).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>

                  {/* Accuracy Badge & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        ความแม่นยำ
                      </div>
                      <div className="text-base font-bold font-mono text-amber-400">
                        {match.accuracyScore}%
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadSgf(match)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                      title="ดาวน์โหลด SGF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
