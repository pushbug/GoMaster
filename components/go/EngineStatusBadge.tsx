'use client';

import React, { useState } from 'react';
import { Cpu, Check, Copy, ExternalLink, HelpCircle, Sparkles, Terminal, X } from 'lucide-react';

interface EngineStatusBadgeProps {
  isMock: boolean;
  className?: string;
}

export const EngineStatusBadge: React.FC<EngineStatusBadgeProps> = ({
  isMock,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const setupCommand = 'npm run setup:katago';

  const handleCopy = () => {
    navigator.clipboard.writeText(setupCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          !isMock
            ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/30'
            : 'bg-amber-950/40 border-amber-800/40 text-amber-300 hover:bg-amber-900/30'
        } ${className}`}
        title={!isMock ? 'KataGo กำลังทำงานด้วย Neural Network' : 'คลิกเพื่อดูวิธีเชื่อมต่อ KataGo ของจริง'}
        data-testid="engine-status-badge"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            !isMock ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
        <span>
          {!isMock ? 'KataGo Neural Net (เชื่อมต่อสด)' : 'Smart Heuristic (Mock Engine)'}
        </span>
        {isMock && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            ตั้งค่าจริง
          </span>
        )}
      </button>

      {/* Setup Guide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-zinc-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-100">
                  {isMock ? 'วิธีเชื่อมต่อ KataGo Engine ของจริง' : 'สถานะ KataGo Engine (เชื่อมต่อแล้ว)'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isMock
                    ? 'ยกระดับฝีมือ AI ให้เป็นระดับ 1 ดั้ง - 9 ดั้ง ด้วย KataGo Neural Network'
                    : 'KataGo กำลังประมวลผลการคำนวณและวิเคราะห์แต้มนำบนเครื่องของคุณ'}
                </p>
              </div>
            </div>

            {isMock ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  ปัจจุบันระบบกำลังใช้ <strong>Smart Tactical Heuristic (Mock)</strong> ซึ่งเดินหมากตามรูปทรงมาตรฐาน
                  แต่หากต้องการพลังการอ่านหมากระดับ <strong>1 ดั้ง - 9 ดั้ง</strong> ที่แท้จริง สามารถติดตั้ง KataGo ได้ในคำสั่งเดียว:
                </p>

                {/* Command Copy Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Terminal className="w-4 h-4 text-zinc-500" />
                    <span>{setupCommand}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-sans transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>สิ่งที่สคริปต์จะทำให้โดยอัตโนมัติ:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 pl-1">
                    <li>ติดตั้ง KataGo ผ่าน Homebrew (<code className="text-zinc-300">brew install katago</code>)</li>
                    <li>ดาวน์โหลดโมเดล Neural Network 15-block (~45MB) จาก KataGo Training</li>
                    <li>สร้างไฟล์คอนฟิกปรับแต่งสำหรับ Apple Silicon / Metal GPU</li>
                    <li>ตั้งค่าพาธลงใน <code className="text-zinc-300">.env.local</code> โดยไม่ต้องแก้ไขเอง</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>เชื่อมต่อกับ KataGo สำเร็จสมบูรณ์!</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    การประเมินวินเรต, แต้มนำ, และเม็ดแนะนำทั้งหมดบนกระดานถูกคำนวณโดยตรงจาก KataGo Neural Network Core
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
