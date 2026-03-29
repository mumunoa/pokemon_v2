import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { 
    InitialSimulationSummary, 
    InitialSimulationResponse 
} from '@/types/simulation';
import { AnalysisShareCard } from './AnalysisShareCard';

interface Props {
    planType: string;
    isUnlocked?: boolean;
    onUnlock?: () => void;
}

export const InitialSimulationCard: React.FC<Props> = ({ planType, isUnlocked = false, onUnlock }) => {
    const [summary, setSummary] = useState<InitialSimulationSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const player1Deck = useGameStore(state => state.player1Deck);
    const gameId = useGameStore(state => state.gameId);

    // デッキが変更（ロード）されたら結果をクリア
    useEffect(() => {
        setSummary(null);
        setError(null);
        setIsLoading(false);
    }, [player1Deck, gameId]);

    // 解禁状態が変化したら自動で再シミュレーション（チケット消費直後など）
    useEffect(() => {
        if (isUnlocked && !summary?.advancedAdvice) {
            runSimulation();
        }
    }, [isUnlocked]);

    const runSimulation = async () => {
        if (!player1Deck || player1Deck.length === 0) {
            setError('デッキが読み込まれていません');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const currentPlan = isUnlocked ? 'pro' : planType.toLowerCase();
            const response = await fetch('/api/ai/simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deck: player1Deck,
                    perspective: 'first',
                    planTier: currentPlan
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

    const isProActual = planType.toLowerCase() === 'pro' || planType.toLowerCase() === 'elite';
    const isPro = isProActual || isUnlocked;

    return (
        <div className="space-y-6">
            <div className={`bg-slate-900/40 border ${isUnlocked && !isProActual ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-indigo-500/20'} rounded-2xl overflow-hidden shadow-2xl`}>
                <div className="bg-indigo-950/40 p-4 border-b border-indigo-500/20 flex justify-between items-center">
                    <h3 className="text-white font-black text-sm flex items-center gap-2 italic">
                        📊 1,000回初動分析レポート
                    </h3>
                    {isUnlocked && !isProActual && (
                        <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-black animate-pulse">UNLOCKED</span>
                    )}
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
                        {summary.advancedAdvice ? (
                            <>
                                <h4 className="text-indigo-300 text-[11px] font-black uppercase mb-3 leading-relaxed">
                                    {summary.advancedAdvice.overallComment}
                                </h4>
                                <ul className="space-y-1.5">
                                    {summary.advancedAdvice.summaryLines.map((line: string, i: number) => (
                                        <li key={i} className="text-slate-300 text-[10px] leading-relaxed flex gap-2 items-start">
                                            <span className="text-indigo-500 mt-0.5">•</span>
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* Basic Pokemon Hit Rates */}
                    {summary.basicPokemonHitRates && summary.basicPokemonHitRates.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-white text-xs font-bold flex items-center gap-2">
                                <span className="text-lg">🌱</span> たねポケモンの初手登場率
                            </h4>
                            <div className={`relative ${!isPro ? 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}>
                                <div className={`grid grid-cols-2 gap-2 ${!isPro ? 'blur-[4px] select-none opacity-20 pointer-events-none' : ''}`}>
                                    {summary.basicPokemonHitRates.map((h, i) => (
                                        <div key={i} className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 flex flex-col gap-1">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-slate-300 font-bold truncate max-w-[90px]" title={h.cardName}>{h.cardName}</span>
                                                <span className="text-indigo-400 font-black">{Math.round(h.rate * 100)}%</span>
                                            </div>
                                            <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                                                    style={{ width: `${Math.round(h.rate * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!isPro && <TeaserOverlay />}
                            </div>
                        </div>
                    )}

                    {/* Failure Breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-white text-xs font-bold flex items-center gap-2">
                            <span className="text-lg">📉</span> 失敗原因の内訳
                        </h4>
                        <div className={`relative ${!isPro ? 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}>
                            <div className={`grid grid-cols-2 gap-2 ${!isPro ? 'blur-[4px] select-none opacity-20 pointer-events-none' : ''}`}>
                                {summary.failureBreakdown.map((f, i) => (
                                    <div key={i} className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 flex justify-between items-center text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <span>{getFailureIcon(f.type)}</span>
                                            <span className="text-slate-400">{getFailureLabel(f.type)}</span>
                                        </div>
                                        <span className="text-slate-200 font-bold">{f.count}回</span>
                                    </div>
                                ))}
                            </div>
                            {!isPro && <TeaserOverlay />}
                        </div>
                    </div>

                    {/* Suggestions Section */}
                    <div className="space-y-4">
                        <h4 className="text-white text-xs font-bold flex items-center gap-2">
                            <span className="text-lg">💡</span> デッキ改善のヒント
                        </h4>
                        
                        {isPro ? (
                            <div className="space-y-4">
                                {summary.advancedAdvice && summary.advancedAdvice.suggestions && summary.advancedAdvice.suggestions.length > 0 ? (
                                    summary.advancedAdvice.suggestions.map((s: any, i: number) => (
                                        <ImprovementHint key={i} suggestion={s} isPro={true} />
                                    ))
                                ) : (
                                    summary.suggestions.map((s, i) => (
                                        <LegacyHint key={i} suggestion={s} isPro={true} />
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {summary.advancedAdvice && summary.advancedAdvice.suggestions && summary.advancedAdvice.suggestions.length > 0 ? (
                                    <ImprovementHint suggestion={summary.advancedAdvice.suggestions[0]} isPro={false} />
                                ) : summary.suggestions && summary.suggestions.length > 0 ? (
                                    <LegacyHint suggestion={summary.suggestions[0]} isPro={false} />
                                ) : null}
                                
                                <div className="bg-slate-950/80 backdrop-blur-sm rounded-xl p-4 border border-slate-800 flex flex-col items-center gap-3">
                                    <p className="text-slate-400 text-[10px]">複数の具体的な改善提案と入れ替え案は Pro版で公開中</p>
                                    <div className="flex gap-1">
                                        <div className="w-12 h-1.5 bg-slate-800 rounded-full animate-pulse"></div>
                                        <div className="w-8 h-1.5 bg-slate-800 rounded-full animate-pulse delay-75"></div>
                                        <div className="w-10 h-1.5 bg-slate-800 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4 mt-4">
                        <button 
                            onClick={runSimulation}
                            className="text-slate-500 hover:text-indigo-400 text-[10px] font-bold transition-colors flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                            再シミュレーション
                        </button>
                        
                        <div className="flex w-full gap-2">
                            <button 
                                onClick={() => setShowShareModal(true)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black py-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                            >
                                <span>📤</span> SNSで結果をシェア
                            </button>

                            {!isProActual && !isUnlocked && (
                                <button 
                                    onClick={onUnlock}
                                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-[10px] font-black py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] transform transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>🚀</span> チケット消費して見る
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <AnalysisShareCard
                    metrics={[
                        { label: 'たね率', rate: summary.seedRate.rate },
                        { label: '展開成功率', rate: summary.setupRate.rate },
                        { label: 'サポ到達率', rate: summary.supporterRate.rate },
                        { label: 'エネ到達率', rate: summary.energyRate.rate },
                    ]}
                    bestLine={summary.advancedAdvice?.overallComment || summary.interpretation.headline}
                    interpretation={summary.interpretation.summaryLines[0]}
                    deckName="My Deck"
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

const TeaserOverlay: React.FC = () => {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-white text-[10px] font-bold shadow-lg bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">Pro版で公開</p>
        </div>
    );
};

const ImprovementHint: React.FC<{ suggestion: any; isPro: boolean }> = ({ suggestion, isPro }) => {
    const s = suggestion;
    const baseClass = isPro 
        ? "bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-xl p-4"
        : "relative rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]";

    return (
        <div className={baseClass}>
            <h5 className="text-purple-300 text-xs font-bold mb-2 pb-2 border-b border-purple-500/20">{s.title}</h5>
            <div className={!isPro ? 'blur-[5px] select-none opacity-10 pointer-events-none' : ''}>
                <p className="text-slate-300 text-[10px] mb-2 leading-relaxed">
                    <span className="text-indigo-400 font-bold mr-1">【診断】</span>{s.diagnosis}
                </p>
                {isPro && (
                    <>
                        <p className="text-slate-300 text-[10px] mb-2 leading-relaxed">
                            <span className="text-red-400 font-bold mr-1">【影響】</span>{s.whyItHurts}
                        </p>
                        <p className="text-slate-200 text-[10px] font-bold mb-3 leading-relaxed">
                            <span className="text-green-400 font-bold mr-1">【方針】</span>{s.action}
                        </p>
                        {s.candidateCards && s.candidateCards.length > 0 && (
                            <div className="mb-2">
                                <span className="text-slate-400 text-[10px] block mb-1">おすすめ候補カード (Standard):</span>
                                <div className="flex flex-wrap gap-1">
                                    {s.candidateCards.map((c: any, ci: number) => (
                                        <span key={ci} className="bg-indigo-900/50 text-indigo-200 text-[9px] px-2 py-0.5 rounded border border-indigo-500/30">
                                            {c.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {s.cutGuidance && s.cutGuidance.length > 0 && (
                            <div>
                                <span className="text-slate-400 text-[10px] block mb-1">抜き候補の目安:</span>
                                <ul className="list-disc pl-4 text-slate-500 text-[9px]">
                                    {s.cutGuidance.map((c: string, ci: number) => (
                                        <li key={ci}>{c}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
            {!isPro && <TeaserOverlay />}
        </div>
    );
};

const LegacyHint: React.FC<{ suggestion: any; isPro: boolean }> = ({ suggestion, isPro }) => {
    const s = suggestion;
    const baseClass = isPro 
        ? "bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-xl p-4"
        : "relative rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]";

    return (
        <div className={baseClass}>
            <div className={!isPro ? 'blur-[5px] select-none opacity-10 pointer-events-none' : ''}>
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
            {!isPro && <TeaserOverlay />}
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

const getFailureIcon = (type: string) => {
    switch (type) {
        case 'NO_BASIC': return '🌱';
        case 'NO_ENERGY': return '⚡';
        case 'NO_SUPPORTER': return '📚';
        case 'NO_BENCH_SETUP': return '🔍';
        case 'NO_EVOLUTION_LINE': return '🧬';
        case 'NO_MAIN_ATTACKER': return '⚔️';
        case 'NO_DRAW_ENGINE': return '🎴';
        default: return '❓';
    }
};

const getFailureLabel = (type: string) => {
    switch (type) {
        case 'NO_BASIC': return 'たね不足';
        case 'NO_ENERGY': return 'エネ不足';
        case 'NO_SUPPORTER': return 'サポート不足';
        case 'NO_BENCH_SETUP': return '展開不足';
        case 'NO_EVOLUTION_LINE': return '進化ライン不足';
        case 'NO_MAIN_ATTACKER': return 'アタッカー不足';
        case 'NO_DRAW_ENGINE': return 'ドローエンジン不足';
        default: return 'その他';
    }
};
