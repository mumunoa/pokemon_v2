import React from 'react';

interface TicketLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorMessage?: string;
}

export const TicketLimitModal: React.FC<TicketLimitModalProps> = ({ isOpen, onClose, errorMessage }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Main Modal Container */}
            <div className="relative w-full max-w-[400px] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="p-6 pb-4 flex items-center justify-center border-b border-white/5 bg-gradient-to-br from-slate-800 to-slate-900 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
                            <span className="text-4xl filter drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">⚡️</span>
                        </div>
                        <h2 className="text-white text-xl font-black tracking-tight leading-tight">AIチケットが不足しています</h2>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-6">
                    <p className="text-slate-300 text-sm leading-relaxed text-center font-bold">
                        {errorMessage || (
                            <>本日の無料分のAI分析チケットをすべて消費しました。チケットは<span className="text-yellow-400 font-bold">毎日回復</span>します。</>
                        )}
                    </p>

                    <div className="bg-[#1e1430]/40 border border-purple-500/20 p-5 rounded-2xl">
                        <h3 className="text-purple-400 font-black text-sm mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Proプランへアップグレード
                        </h3>
                        <p className="text-slate-400 text-xs mb-3">
                            無制限のAI分析、初手事故率シミュレーション、仮想敵分析などの全機能が解放されます。
                        </p>
                        <button className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-purple-900/30">
                            Proプランを見る (準備中)
                        </button>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl">
                        <h3 className="text-blue-400 font-black text-sm mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            Xでシェアしてチケットゲット
                        </h3>
                        <p className="text-slate-400 text-xs mb-3">
                            このツールをXでシェアし、リンクからアクセスがあると追加のチケットがもらえます！
                        </p>
                        <button className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-black text-sm rounded-xl transition-all border border-slate-600">
                            ポストしてシェア (準備中)
                        </button>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-950 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
