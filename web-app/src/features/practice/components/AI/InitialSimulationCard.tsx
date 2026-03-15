import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { 
    InitialSimulationSummary, 
    InitialSimulationResponse 
} from '@/types/simulation';

interface Props {
    planType: string;
}

export const InitialSimulationCard: React.FC<Props> = ({ planType }) => {
    const [summary, setSummary] = useState<InitialSimulationSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const deckCards = useGameStore(state => state.cards);
    const deckIds = useGameStore(state => state.zones['player1-deck']);

    const runSimulation = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 現在のデッキ構成を抽出
            const cardsInDeck = deckIds.map(id => deckCards[id]);
            // 重複をカウントして集計
            const aggregatedDeck: any[] = [];
            const counts: Record<string, number> = {};
            cardsInDeck.forEach(c => {
                counts[c.name] = (counts[c.name] || 0) + 1;
            });
            Object.entries(counts).forEach(([name, count]) => {
                aggregatedDeck.push({ name, count, id: name });
            });

            const response = await fetch('/api/ai/simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deck: aggregatedDeck,
                    perspective: 'first',
                    planTier: planType.toLowerCase()
                })
            });

            const data: InitialSimulationResponse = await response.json();
            if (data.success && data.summary) {
                setSummary(data.summary);
            } else {
                throw new Error(data.error || 'シミュレーションに失敗しました');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-xs font-bold">1,000回の一人回しを実行中...</p>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 text-center">
                <h3 className="text-white font-bold mb-2">デッキ初動シミュレーション</h3>
                <p className="text-slate-400 text-xs mb-4">
                    現在のデッキで1,000回一人回しを行い、たね率や展開成功率を測定します。
                </p>
                <button 
                    onClick={runSimulation}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full text-xs font-bold transition-colors"
                >
                    シミュレーション開始
                </button>
            </div>
        );
    }

    const isPro = planType.toLowerCase() === 'pro' || planType.toLowerCase() === 'elite';

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-indigo-950/40 p-4 border-b border-indigo-500/20">
                    <h3 className="text-white font-black text-sm flex items-center gap-2 italic">
                        📊 1,000回初動分析レポート
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    {/* Metrics Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <MetricBar label="たね率" rate={summary.seedRate.rate} />
                        <MetricBar label="展開成功率" rate={summary.setupRate.rate} />
                        <MetricBar label="サポート到達率" rate={summary.supporterRate.rate} />
                        <MetricBar label="エネルギー到達率" rate={summary.energyRate.rate} />
                    </div>

                    {/* Interpretation */}
                    <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800">
                        <h4 className="text-indigo-300 text-[10px] font-black uppercase mb-2 italic">
                            {summary.interpretation.headline}
                        </h4>
                        <ul className="space-y-1">
                            {summary.interpretation.summaryLines.map((line, i) => (
                                <li key={i} className="text-slate-300 text-[10px] leading-relaxed flex gap-2">
                                    <span className="text-indigo-500">•</span>
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro Feature: Suggestions */}
                    {isPro ? (
                        <div className="space-y-4">
                            <h4 className="text-white text-xs font-bold flex items-center gap-2">
                                <span className="text-lg">💡</span> デッキ改善のヒント
                            </h4>
                            {summary.suggestions.map((s, i) => (
                                <div key={i} className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-xl p-4">
                                    <p className="text-slate-200 text-xs mb-3 leading-relaxed">
                                        {s.reason}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-black">
                                        <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded">OUT</span>
                                        <span className="text-slate-400">{s.outCards[0].cardName}</span>
                                        <span className="text-indigo-400">→</span>
                                        <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded">IN</span>
                                        <span className="text-slate-200">{s.inCards[0].cardName}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-950/80 backdrop-blur-sm rounded-xl p-4 border border-slate-800 flex flex-col items-center gap-3">
                            <p className="text-slate-400 text-[10px]">具体的な改善提案と入れ替え案は Pro版で公開中</p>
                            <div className="flex gap-1">
                                <div className="w-12 h-1.5 bg-slate-800 rounded-full animate-pulse"></div>
                                <div className="w-8 h-1.5 bg-slate-800 rounded-full animate-pulse delay-75"></div>
                                <div className="w-10 h-1.5 bg-slate-800 rounded-full animate-pulse delay-150"></div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <button 
                            onClick={runSimulation}
                            className="text-slate-500 hover:text-indigo-400 text-[10px] font-bold transition-colors flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                            再シミュレーション
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricBar: React.FC<{ label: string; rate: number }> = ({ label, rate }) => {
    const percentage = Math.round(rate * 100);
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                <span className="text-slate-500">{label}</span>
                <span className={rate > 0.8 ? 'text-green-400' : rate > 0.6 ? 'text-yellow-400' : 'text-red-400'}>
                    {percentage}%
                </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-[1px]">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${rate > 0.8 ? 'bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_8px_rgba(74,222,128,0.3)]' : rate > 0.6 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};
