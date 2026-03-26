import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

interface Metric {
    label: string;
    rate: number;
}

interface Props {
    metrics: Metric[];
    bestLine: string;
    interpretation: string;
    deckName: string;
    onClose: () => void;
}

export const AnalysisShareCard: React.FC<Props> = ({ metrics, bestLine, interpretation, deckName, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#020617', // slate-950
                scale: 3, // 高解像度
                logging: false,
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = `poke-ai-report-${deckName || 'deck'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to generate image:', err);
            alert('画像の生成に失敗しました');
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="flex flex-col gap-6 max-w-full items-center">
                {/* The card to be captured */}
                <div 
                    ref={cardRef}
                    className="w-[360px] bg-slate-950 border-2 border-indigo-500/50 rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.3)] relative"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-600/20 to-transparent pointer-events-none"></div>

                    {/* Header */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-center border-b-2 border-indigo-500/20 relative">
                        <div className="text-[10px] font-black tracking-[0.3em] text-indigo-200 uppercase mb-2">Internal Simulation Analysis</div>
                        <h2 className="text-white text-3xl font-black italic tracking-tighter leading-none">POKEMON AI COACH</h2>
                    </div>

                    <div className="p-8 space-y-8 relative">
                        {/* Deck Name */}
                        <div className="text-center space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target Deck</span>
                            <div className="text-xl text-white font-black truncate px-4">{deckName || 'Master Deck'}</div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {metrics.map((m, i) => (
                                <div key={i} className="bg-slate-900/60 border border-slate-800/80 rounded-[24px] p-4 flex flex-col items-center justify-center gap-1 shadow-inner">
                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-tight">{m.label}</div>
                                    <div className={`text-2xl font-black ${m.rate > 0.8 ? 'text-emerald-400' : m.rate > 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {Math.round(m.rate * 100)}<span className="text-sm ml-0.5">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Key Recommendation */}
                        <div className="bg-indigo-950/40 border-2 border-indigo-500/20 rounded-[28px] p-5 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-400">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div className="text-[10px] text-indigo-400 font-black uppercase mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                                AI Core Advice
                            </div>
                            <p className="text-white text-[13px] font-bold leading-relaxed italic">
                                "{bestLine}"
                            </p>
                        </div>

                        {/* Interpretation */}
                        <p className="text-slate-400 text-[11px] leading-relaxed text-center px-6 italic font-medium">
                            {interpretation}
                        </p>

                        {/* Footer Branding */}
                        <div className="pt-6 border-t border-slate-900/60 flex justify-between items-center text-[10px]">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-slate-600 font-bold uppercase tracking-tighter">Powered by</span>
                                <span className="text-indigo-400 font-black tracking-tight">pokemon-v2.app</span>
                            </div>
                            <div className="px-4 py-1.5 bg-indigo-600/10 rounded-full border border-indigo-500/20 text-indigo-300 font-black tracking-widest uppercase italic">
                                #ポケカAI
                            </div>
                        </div>
                    </div>
                </div>

                {/* UI Buttons (not captured) */}
                <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-[360px]">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all active:scale-95"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="flex-[2] py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/20 transform transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>📸</span>
                        画像を保存する
                    </button>
                </div>

                <p className="text-slate-500 text-[11px] font-bold">画像をXやTikTokでシェアして実績を公開しよう！</p>
            </div>
        </div>
    );
};
