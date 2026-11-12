import React from 'react';

interface GameWorkspaceProps {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  board: React.ReactNode;
  analysisPanel: React.ReactNode;
}

export function GameWorkspace({
  isSidebarOpen,
  isMobileSidebarOpen,
  board,
  analysisPanel,
}: GameWorkspaceProps) {
  return (
    <div className="relative flex-1 min-h-0 max-w-[1700px] w-full mx-auto p-3 lg:px-6 lg:py-4 grid grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-12 gap-6">
      <div className={`${isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'} min-h-0 min-w-0 overflow-y-auto ${isMobileSidebarOpen ? 'hidden lg:block' : ''}`}>
        {board}
      </div>
      {analysisPanel}
    </div>
  );
}
