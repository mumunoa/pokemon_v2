import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const LogSidePanel: React.FC<Props> = ({ isOpen, onClose }) => {
    const { logs } = useGameStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-y-0 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-[5000] flex flex-col animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    行動履歴 / Log
                </h3>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700"
            >
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
                        履歴がありません
                    </div>
                ) : (
                    logs.map((log, i) => {
                        const isSystem = log.includes('開始') || log.includes('リセット');
                        const isTurn = log.includes('ターン終了');

                        return (
                            <div
                                key={i}
                                className={`text-[12px] p-2.5 rounded-lg border leading-relaxed transition-all ${isTurn
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-100 font-bold'
                                        : isSystem
                                            ? 'bg-slate-800 border-slate-700 text-slate-400 italic'
                                            : 'bg-slate-800/40 border-slate-700/50 text-slate-200'
                                    }`}
                            >
                                <div className="flex gap-2">
                                    <span className="text-slate-600 shrink-0 font-mono">{i + 1}</span>
                                    <span>{log}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <p className="text-[10px] text-slate-500 text-center">
                    ※ 盤面操作はすべて自動的に記録されます
                </p>
            </div>
        </div>
    );
};
