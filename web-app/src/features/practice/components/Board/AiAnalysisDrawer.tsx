import React, { useState } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { buildAIInput } from '@/lib/ai/buildAIInput';
import { generateCandidateMoves } from '@/lib/ai/move-generator';
import { CandidateMove } from '@/types/ai';
import { useAuth } from '@/hooks/useAuth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AiAnalysisDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
    const { getGameState } = useGameStore();
    const [candidates, setCandidates] = useState<CandidateMove[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [proAnalysis, setProAnalysis] = useState<string | null>(null);
    const [isParsingPro, setIsParsingPro] = useState(false);
    const { isPro, user, getToken } = useAuth();

    // AI分析を実行（フロントエンドロジックのみ）
    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setProAnalysis(null);
        // UIのブロックを防ぐため非同期で少し遅らせる（ローディング演出）
        setTimeout(() => {
            const state = getGameState();
            const aiInput = buildAIInput(state);
            const moves = generateCandidateMoves(aiInput);
            setCandidates(moves);
            setIsAnalyzing(false);

            // If user is Pro, automatically trigger deep analysis in background
            if (isPro) {
                handleAnalyzePro(moves);
            }
        }, 600);
    };

    const handleAnalyzePro = async (moves: CandidateMove[]) => {
        if (!moves || moves.length === 0) return;
        setIsParsingPro(true);
        try {
            const state = getGameState();
            const token = await getToken({ template: 'supabase' });
            
            const activeZone = state.currentTurnPlayer === 'player1' ? 'player1-active' : 'player2-active';
            const handZone = state.currentTurnPlayer === 'player1' ? 'player1-hand' : 'player2-hand';
            const benchZones = ['1', '2', '3', '4', '5'].map(n => `${state.currentTurnPlayer}-bench-${n}` as import('@/types/game').ZoneType);

            const activePokemonId = state.zones[activeZone][0];
            const activePokemon = activePokemonId ? state.cards[activePokemonId]?.name : null;
            const handCount = state.zones[handZone].length;
            const benchCount = benchZones.filter(z => state.zones[z]?.length > 0).length;

            const response = await fetch('/api/ai/pro-coach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    candidates: moves,
                    activePokemon,
                    handCount,
                    benchCount,
                    isEliteAnalysis: false
                })
            });

            if (response.ok) {
                const data = await response.json();
                setProAnalysis(data.analysis);
            } else {
                console.error("Pro analysis failed", response.statusText);
                setProAnalysis("詳細なプロアシストの取得に失敗しました。");
            }
        } catch (error) {
            console.error(error);
            setProAnalysis("詳細なプロアシストの取得中にエラーが発生しました。");
        } finally {
            setIsParsingPro(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-y-0 right-0 w-[350px] bg-slate-900/95 backdrop-blur-xl border-l border-indigo-500/30 shadow-2xl shadow-indigo-500/20 z-[6000] flex flex-col animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-4 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/30">
                <h3 className="text-indigo-300 font-bold flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    ポケカAIコーチ（Free版）
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 pb-0">
                {!candidates && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl shadow-inner">
                            🤔
                        </div>
                        <div>
                            <p className="text-slate-300 font-medium">現在の盤面を分析しますか？</p>
                            <p className="text-slate-500 text-xs mt-1">Freeプランは回数無制限で候補手を何度でも確認できます。</p>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <span>✨ 今の盤面を分析する</span>
                        </button>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-indigo-300 text-sm animate-pulse">盤面を解析中...</p>
                    </div>
                )}

                {candidates && !isAnalyzing && (
                    <div className="space-y-4">
                        <h4 className="text-white text-sm font-bold flex items-center gap-2 mb-3">
                            🎯 AI推奨の行動候補
                        </h4>
                        
                        {candidates.length === 0 ? (
                            <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
                                <p className="text-slate-400 text-sm">
                                    現在実行できる有効な行動が見つかりません。
                                    <br/>ターンを終了するか、場の状況を見直してください。
                                </p>
                            </div>
                        ) : (
                            candidates.map((move, index) => (
                                <div 
                                    key={move.id} 
                                    className={`relative p-4 rounded-xl border ${
                                        index === 0 
                                            ? 'bg-gradient-to-br from-indigo-900/50 to-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                                            : 'bg-slate-800/40 border-slate-700/50'
                                    }`}
                                >
                                    {index === 0 && (
                                        <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-slate-900 transform -rotate-6">
                                            1位
                                        </div>
                                    )}
                                    {index === 1 && <span className="absolute top-3 right-3 text-slate-500 text-xs font-bold">2位</span>}
                                    {index === 2 && <span className="absolute top-3 right-3 text-slate-500 text-xs font-bold">3位</span>}
                                    
                                    <div className={`font-bold ${index === 0 ? 'text-indigo-200 text-base ml-2' : 'text-slate-200 text-sm'}`}>
                                        {move.label}
                                    </div>
                                    
                                    {move.reasons && move.reasons.length > 0 && (
                                        <div className={`mt-2 ${index === 0 ? 'ml-2' : ''}`}>
                                            <span className="inline-block px-2 py-0.5 bg-slate-950/50 rounded text-xs text-slate-400 font-medium">
                                                💡 理由: {move.reasons[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={handleAnalyze}
                                className="text-indigo-400 text-xs font-medium hover:text-indigo-300 mb-4"
                            >
                                🔄 盤面が変わったら再分析
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Upsell or Pro Analysis display */}
            <div className="p-4 border-t border-slate-800 bg-gradient-to-t from-slate-950 to-slate-900 shrink-0">
                {isPro ? (
                    <div className="bg-slate-800/80 border border-indigo-500/30 rounded-lg p-4 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-black text-indigo-300">⚡️ PRO 分析結果</span>
                        </div>
                        {isParsingPro ? (
                            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                                <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                AIコーチが詳細を検討中...
                            </div>
                        ) : proAnalysis ? (
                            <p className="text-xs text-slate-300 leading-relaxed max-w-full break-words whitespace-pre-wrap">
                                {proAnalysis}
                            </p>
                        ) : (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => candidates && handleAnalyzePro(candidates)}
                                    className="bg-indigo-600/50 hover:bg-indigo-600 text-white text-xs font-bold py-2 px-4 rounded w-full transition-colors"
                                >
                                    詳細な戦略解説を聞く
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-lg p-3 relative overflow-hidden group hover:border-purple-500/40 transition-colors cursor-pointer">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>
                        <div className="flex items-center gap-2 mb-1 relative z-10">
                            <span className="text-xs font-black bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">PRO プラン</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">初月無料</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mb-2 relative z-10">
                            「なぜこの手が最善なのか」深い解説と、相手の動きを予測した次ターンのリスク分析を解禁します。
                        </p>
                        <div className="flex justify-end relative z-10">
                            <span className="text-xs text-purple-300 font-bold group-hover:underline">詳しく見る 🚀</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
