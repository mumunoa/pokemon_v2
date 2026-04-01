import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAiCoach } from '@/hooks/useAiCoach';
import { InitialSimulationCard } from '../AI/InitialSimulationCard';
import { CoachPanel } from '../../ai-next';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { useTicketUnlock } from '../../hooks/useTicketUnlock';
import { useEntitlement } from '@/hooks/useEntitlement';
import { buildBoardScore } from '@/features/practice/lib/boardScore';
import { buildBoardScoreReason } from '@/features/practice/lib/boardScoreReason';
import { buildBoardInsightShareSummary } from '@/features/practice/lib/boardInsightShare';
import { BoardInsightCard } from '../Coach/BoardInsightCard';
import { BoardInsightShareSheet } from '../Coach/BoardInsightShareSheet';
import type { BoardInsightMeta, BoardInsightUiState } from '@/types/board-insight';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AiAnalysisDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
    const { isThinking, commentary, planType } = useAiCoach();
    const { runCoachAnalysis, coachResult, coachLoading, openingEvaluation, player1Deck } = useGameStore();
    const { isUnlocked, handleUnlock } = useTicketUnlock();
    const entitlement = useEntitlement();
    const [isShareOpen, setIsShareOpen] = useState(false);

    const isProActual = planType === 'pro' || planType === 'elite';
    const isPro = isProActual || isUnlocked;

    // 現在の盤面メタデータの構築
    const boardInsight = useMemo<BoardInsightMeta | null>(() => {
        if (!coachResult) return null;

        // 既存の初動分析結果があればマッピング、なければ coachResult 内のものを使用
        const openingMetrics = openingEvaluation ? {
            openingScore: openingEvaluation.seedRate?.rate,
            consistencyScore: openingEvaluation.setupRate?.rate,
            riskScore: openingEvaluation.failureBreakdown?.length > 0 ? 50 : 20, // 簡易マッピング
        } : coachResult.openingMetrics;

        const breakdown = buildBoardScore({
            openingMetrics,
            coachResult,
            tacticalConfidence: coachResult.confidenceScore
        });

        const reason = buildBoardScoreReason(breakdown);

        return {
            breakdown,
            reason,
            generatedAt: new Date().toISOString()
        };
    }, [coachResult, openingEvaluation]);

    // UI状態の管理
    const uiState = useMemo<BoardInsightUiState>(() => {
        let accessLevel: BoardInsightUiState['accessLevel'] = 'pre_analysis';
        if (boardInsight) {
            if (isProActual) {
                accessLevel = planType === 'elite' ? 'elite' : 'pro';
            }
            else if (isUnlocked) accessLevel = 'ticket_unlocked';
            else accessLevel = 'free_summary';
        }

        return {
            status: coachLoading ? 'running' : (boardInsight ? 'ready' : 'idle'),
            accessLevel
        };
    }, [boardInsight, coachLoading, isProActual, entitlement.canUseAdvancedCoach, isUnlocked]);

    // シェアサマリの構築
    const shareSummary = useMemo(() => {
        if (!boardInsight) return null;
        return buildBoardInsightShareSummary({
            deckName: player1Deck?.[0]?.name ? `${player1Deck[0].name}デッキ` : '現在の盤面',
            boardInsight,
            bestAction: coachResult?.bestAction
        });
    }, [boardInsight, player1Deck, coachResult]);

    return (
        <div className={`fixed inset-y-0 right-0 w-[400px] bg-slate-900/95 backdrop-blur-xl border-l border-indigo-500/30 shadow-2xl shadow-indigo-500/20 z-[9500] flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/30">
                <div className="flex flex-col">
                    <h3 className="text-indigo-300 font-bold flex items-center gap-2">
                        <span className="text-xl">🎓</span>
                        AIプロコーチ
                        {!isProActual && !isUnlocked && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">FREE</span>}
                        {isUnlocked && !isProActual && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black border border-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">UNLOCKED</span>}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">8レイヤー推論エンジン稼働中</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
                <BoardInsightCard 
                    uiState={uiState}
                    boardInsight={boardInsight}
                    onRun={runCoachAnalysis}
                    onUnlock={handleUnlock}
                    onUpgrade={() => {
                        window.location.href = '/billing';
                    }}
                    onOpenShare={() => setIsShareOpen(true)}
                />

                <div className="space-y-4">
                    <h4 className="text-white text-xs font-bold flex items-center gap-2">
                        <span className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-[10px]">1</span>
                        デッキ安定度（初動AI分析）
                    </h4>
                    <InitialSimulationCard planType={planType} isUnlocked={isUnlocked} onUnlock={handleUnlock} />
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-white text-xs font-bold flex items-center gap-2">
                            <span className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px]">2</span>
                            プロタクティカル分析
                        </h4>
                    </div>
                    <CoachPanel result={coachResult} isLoading={coachLoading} onRun={() => runCoachAnalysis()} isProUser={isProActual} onUpgradeClick={() => { window.location.href = '/billing'; }} isUnlocked={isUnlocked} onUnlock={handleUnlock} />
                </div>

                 {/* 
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    ... (Pro AI Personaセクション - 実装まで非表示)
                </div>
                */}

                {isThinking && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Thinking...</span>
                    </div>
                )}

                {!commentary && !isThinking && <div className="text-center py-10 text-slate-500 text-sm">盤面に変化があると自動で分析を開始します。</div>}

                {commentary && (
                    <>
                        <div className="space-y-3 pt-6 border-t border-slate-800 relative">
                            <h4 className="text-white text-xs font-bold flex items-center gap-2">
                                <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px]">3</span>
                                おすすめの一手
                            </h4>
                            {commentary.bestActions.map((action: any, idx: number) => (
                                <div key={idx} className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/40 rounded-xl p-4 shadow-xl overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
                                    <div className="text-indigo-200 font-bold text-sm mb-1">{action.title}</div>
                                    <p className="text-slate-400 text-[10px] mb-3">{action.description}</p>
                                    <div className="space-y-2">
                                        {isPro ? (
                                            <>
                                                {action.pros.map((pro: string, pIdx: number) => <div key={pIdx} className="flex gap-2 text-[10px] text-green-400"><span>✅</span><span>{pro}</span></div>)}
                                                {action.cons.map((con: string, cIdx: number) => <div key={cIdx} className="flex gap-2 text-[10px] text-orange-400"><span>⚠️</span><span>{con}</span></div>)}
                                            </>
                                        ) : (
                                            <div className="mt-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-2 group cursor-pointer hover:border-purple-500/30 transition-colors" onClick={handleUnlock}>
                                                <div className="text-[10px] text-slate-500 font-medium">理由は Pro プランで公開中</div>
                                                <div className="text-[9px] text-amber-500 font-bold">1チケット消費して解禁</div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!isPro && (
                                        <div className="absolute inset-x-0 bottom-0 top-[60px] bg-indigo-950/40 backdrop-blur-[2px] flex items-center justify-center border-t border-indigo-500/10">
                                            <div className="px-3 py-1 bg-indigo-500/20 rounded border border-indigo-500/30 text-[10px] font-bold text-indigo-300">
                                                実装準備中
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isPro && commentary.alternatives.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest px-1">その他の有力な候補</h4>
                                <div className="space-y-2">
                                    {commentary.alternatives.map((alt: any, aIdx: number) => (
                                        <div key={aIdx} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                                            <div className="text-slate-300 text-xs font-bold">{alt.title}</div>
                                            <div className="text-slate-500 text-[9px] mt-0.5 italic">{alt.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <BoardInsightShareSheet 
                isOpen={isShareOpen} 
                onClose={() => setIsShareOpen(false)} 
                summary={shareSummary} 
                shareUrl={typeof window !== 'undefined' ? window.location.href : undefined} 
            />
        </div>
    );
};
