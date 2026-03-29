'use client';

import React, { useState, useEffect } from 'react';
import { Arena } from '@/features/practice/components/Board/Arena';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { SettingsModal } from '@/features/practice/components/Board/SettingsModal';
import { LogSidePanel } from '@/features/practice/components/Board/LogSidePanel';
import '../styles/app.css'; // Future implementation of customized non-tailwind CSS if needed

export default function Home() {
  const { turnCount, currentTurnPlayer, logs, isGameStarted } = useGameStore();
  const player1Deck = useGameStore(s => s.player1Deck);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [showSettingsTutorial, setShowSettingsTutorial] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('hasSeenSettingsTutorial');
      if (!hasSeen) {
        setShowSettingsTutorial(true);
      }

      // デッキが読み込まれていない場合は設定画面を自動で開く
      if (player1Deck.length === 0) {
        setIsSettingsOpen(true);
      }
    }
  }, [player1Deck.length]);

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(true);
    if (showSettingsTutorial) {
      setShowSettingsTutorial(false);
      localStorage.setItem('hasSeenSettingsTutorial', '1');
    }
  };

  return (
    <main className="w-full h-screen h-[100dvh] bg-slate-950 flex flex-col overflow-hidden relative" onClick={() => setIsLogOpen(false)}>
      <header className="glass-panel main-header flex justify-between items-center p-1 sm:p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 shadow-lg shrink-0 z-[1000]">
        <div className="relative z-[2000]">
          <button
            onClick={handleOpenSettings}
            className={`icon-btn settings-btn text-white px-4 py-2 rounded-md hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2 ${showSettingsTutorial ? 'bg-indigo-600 ring-4 ring-indigo-500/50 animate-pulse' : 'bg-slate-800'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            設定
          </button>
          {showSettingsTutorial && (
            <div className="absolute top-full left-0 mt-3 bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded shadow-xl whitespace-nowrap z-[2001] before:content-[''] before:absolute before:-top-1.5 before:left-6 before:w-3 before:h-3 before:bg-indigo-600 before:rotate-45">
               デッキコード読み込みはこちら
            </div>
          )}
        </div>
        <div className="turn-indicator font-bold text-sm sm:text-lg text-white">
          {isGameStarted ? `TURN ${turnCount} : ${currentTurnPlayer === 'player1' ? 'プレイヤー1' : 'プレイヤー2'}` : '対戦準備中'}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsLogOpen(!isLogOpen); }}
          className="primary-btn menu-btn text-white bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-700 flex items-center gap-2 relative transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          ログ ({logs.length})
        </button>
      </header>
      <div className="flex-1 relative overflow-hidden min-h-0">
        <Arena />
      </div>

      {/* Ad Banner Anchor (Subtle) */}
      <footer className="h-12 bg-slate-900/50 border-t border-slate-800 flex items-center justify-center shrink-0">
        <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">Advertisement Space</span>
      </footer>

      <LogSidePanel isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </main>
  );
}
