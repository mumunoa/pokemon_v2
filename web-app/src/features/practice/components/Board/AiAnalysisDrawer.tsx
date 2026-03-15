import { useAuth } from '@/hooks/useAuth';
import { useAiCoach } from '@/hooks/useAiCoach';
import { UpgradePrompt } from '../Coach/UpgradePrompt';
import { InitialSimulationCard } from '../AI/InitialSimulationCard';
import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AiAnalysisDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
    const { isThinking, commentary, planType } = useAiCoach();
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const isPro = planType === 'pro' || planType === 'elite';

    return (
        <div
            className={`fixed inset-y-0 right-0 w-[350px] bg-slate-900/95 backdrop-blur-xl border-l border-indigo-500/30 shadow-2xl shadow-indigo-500/20 z-[6000] flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-4 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/30">
                <div className="flex flex-col">
                    <h3 className="text-indigo-300 font-bold flex items-center gap-2">
                        <span className="text-xl">🎓</span>
                        AIプロコーチ
                        {!isPro && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">FREE</span>}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">8レイヤー推論エンジン稼働中</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Status Indicator */}
                {isThinking && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                            Thinking...
                        </span>
                    </div>
                )}

                {!commentary && !isThinking && (
                    <div className="text-center py-10 text-slate-500 text-sm">
                        盤面に変化があると自動で分析を開始します。
                    </div>
                )}

                {commentary && (
                    <>
                        {/* Game Context Advice */}
                        <div className="space-y-2">
                            {commentary.gameContext.split(/(?=【)/).map((thought, tIdx) => (
                                <div key={tIdx} className="bg-indigo-900/10 border border-indigo-500/10 rounded-xl p-3">
                                    <p className="text-slate-200 text-xs leading-relaxed">
                                        {thought.trim()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Best Action */}
                        <div className="space-y-3">
                            <h4 className="text-white text-xs font-bold flex items-center gap-2">
                                <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px]">1</span>
                                おすすめの一手
                            </h4>
                            
                            {commentary.bestActions.map((action, idx) => (
                                <div key={idx} className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/40 rounded-xl p-4 shadow-xl overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                    </div>
                                    <div className="text-indigo-200 font-bold text-sm mb-1">{action.title}</div>
                                    <p className="text-slate-400 text-[10px] mb-3">{action.description}</p>

                                    {/* Pros & Cons (Plan dependent) */}
                                    <div className="space-y-2">
                                        {isPro ? (
                                            <>
                                                {action.pros.map((pro, pIdx) => (
                                                    <div key={pIdx} className="flex gap-2 text-[10px] text-green-400">
                                                        <span>✅</span>
                                                        <span>{pro}</span>
                                                    </div>
                                                ))}
                                                {action.cons.map((con, cIdx) => (
                                                    <div key={cIdx} className="flex gap-2 text-[10px] text-orange-400">
                                                        <span>⚠️</span>
                                                        <span>{con}</span>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div 
                                                className="mt-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-2 group cursor-pointer hover:border-purple-500/30 transition-colors"
                                                onClick={() => setIsUpgradeOpen(true)}
                                            >
                                                <div className="text-[10px] text-slate-500 font-medium">理由は Pro プランで公開中</div>
                                                <div className="flex gap-1">
                                                    <div className="w-12 h-1.5 bg-slate-800 rounded-full animate-pulse"></div>
                                                    <div className="w-8 h-1.5 bg-slate-800 rounded-full animate-pulse delay-75"></div>
                                                    <div className="w-10 h-1.5 bg-slate-800 rounded-full animate-pulse delay-150"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Alternatives (Pro only) */}
                        {isPro && commentary.alternatives.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest px-1">その他の有力な候補</h4>
                                <div className="space-y-2">
                                    {commentary.alternatives.map((alt, aIdx) => (
                                        <div key={aIdx} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                                            <div className="text-slate-300 text-xs font-bold">{alt.title}</div>
                                            <div className="text-slate-500 text-[9px] mt-0.5 italic">{alt.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Deck Simulation Section */}
                        <div className="pt-6 border-t border-slate-800 space-y-4">
                            <h4 className="text-white text-xs font-bold flex items-center gap-2">
                                <span className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-[10px]">2</span>
                                デッキ安定度（初動AI分析）
                            </h4>
                            <InitialSimulationCard planType={planType} />
                        </div>
                    </>
                )}
            </div>

            {/* Footer / Upsell */}
            {!isPro && (
                <div className="p-4 border-t border-slate-800 bg-gradient-to-t from-slate-950 to-slate-900 shrink-0">
                    <div 
                        className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-lg p-3 relative overflow-hidden group hover:border-purple-500/40 transition-colors cursor-pointer"
                        onClick={() => setIsUpgradeOpen(true)}
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
                        <div className="flex items-center gap-2 mb-1 relative z-10">
                            <span className="text-xs font-black bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">PRO プラン</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">初月無料</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mb-2 relative z-10">
                            「なぜこの手が最善なのか」深い解説と、相手の動きを予測した次ターンのリスク分析を解禁します。
                        </p>
                        <div className="flex justify-end relative z-10">
                            <span className="text-xs text-purple-300 font-bold group-hover:underline">アップグレードして理由を確認 🚀</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <UpgradePrompt isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
        </div>
    );
};
