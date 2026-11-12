'use client';

import React from 'react';
import {
  Eye,
  EyeOff,
  History,
  Layers,
  PanelRightClose,
  PanelRightOpen,
  PlusCircle,
} from 'lucide-react';
import { EngineStatusBadge } from './EngineStatusBadge';

interface AppHeaderProps {
  showCoordinates: boolean;
  zenMode: boolean;
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  isEngineMock: boolean;
  onOpenNewGame: () => void;
  onOpenHistory: () => void;
  onToggleCoordinates: () => void;
  onToggleZenMode: () => void;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

export function AppHeader({
  showCoordinates,
  zenMode,
  isSidebarOpen,
  isMobileSidebarOpen,
  isEngineMock,
  onOpenNewGame,
  onOpenHistory,
  onToggleCoordinates,
  onToggleZenMode,
  onToggleSidebar,
  onToggleMobileSidebar,
}: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-2 lg:py-3.5 flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Layers className="w-5 h-5 text-zinc-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight bg-linear-to-r from-zinc-100 via-zinc-200 to-amber-400 bg-clip-text text-transparent">
              GoMaster
            </h1>
            <span
              data-testid="logo-target-badge"
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
            >
              1 Dan Target
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-normal leading-tight hidden sm:block">
            ก้าวสู่ 1 ดั้ง ด้วยพลัง KataGo + AI Sensei
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 lg:gap-2.5 text-sm">
        <button
          onClick={onOpenNewGame}
          data-testid="btn-new-game"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all text-sm"
          title="เริ่มเกมใหม่และปรับตั้งค่า"
        >
          <PlusCircle className="w-4 h-4 fill-current text-zinc-950" />
          <span>เริ่มเกมใหม่</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700/70 font-semibold transition-all shadow-sm active:scale-95 text-sm"
          title="เปิดประวัติการแข่งขันและดาวน์โหลด SGF"
        >
          <History className="w-3.5 h-3.5" />
          <span>ประวัติแข่ง & SGF</span>
        </button>

        <button
          onClick={onToggleCoordinates}
          className={`hidden sm:flex px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
            showCoordinates
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
          }`}
        >
          พิกัด: {showCoordinates ? 'เปิด' : 'ปิด'}
        </button>

        <button
          onClick={onToggleZenMode}
          data-testid="btn-toggle-zen"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-sm active:scale-95 text-sm ${
            zenMode
              ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700/70'
          }`}
          title={zenMode ? 'ปิดโหมดเล่นเอง (เปิดคำแนะนำ Sensei)' : 'เปิดโหมดเล่นเอง (ซ่อนคำใบ้และคะแนน)'}
        >
          {zenMode
            ? <EyeOff className="w-3.5 h-3.5 text-purple-400" />
            : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
          <span className="hidden md:inline">{zenMode ? 'โหมดเล่นเอง' : 'โหมดปกติ'}</span>
        </button>

        <button
          onClick={onToggleSidebar}
          data-testid="btn-toggle-sidebar"
          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-sm active:scale-95 text-sm ${
            isSidebarOpen
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700/70'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          }`}
          title={isSidebarOpen ? 'พับเก็บแถบคำแนะนำ' : 'แสดงแถบคำแนะนำ'}
        >
          {isSidebarOpen
            ? <PanelRightClose className="w-4 h-4 text-zinc-400" />
            : <PanelRightOpen className="w-4 h-4 text-amber-400" />}
          <span className="hidden md:inline">{isSidebarOpen ? 'ซ่อนแถบข้าง' : 'แสดงแถบข้าง'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-expanded={isMobileSidebarOpen}
          aria-controls="game-analysis"
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 lg:hidden"
        >
          {isMobileSidebarOpen ? 'กลับกระดาน' : 'วิเคราะห์'}
        </button>

        <EngineStatusBadge isMock={isEngineMock} />
      </div>
    </header>
  );
}
