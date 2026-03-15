import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { normalizeGameState } from '@/features/practice/ai/core/normalizeGameState';
import { extractFeatures } from '@/features/practice/ai/features/extractFeatures';
import { hybridSearch } from '@/features/practice/ai/search';
import { buildCoachCommentary } from '@/features/practice/ai/explain/buildCoachCommentary';
import { CoachCommentary } from '@/features/practice/ai/explain/types';
import { useAuth } from '@/hooks/useAuth';

/**
 * AIによるコーチング知能をフロントエンドに統合するカスタムフック。
 * 盤面の変更を検知し、バックグラウンドで思考して最善手と解説を提供します。
 */
export function useAiCoach() {
    const gameState = useGameStore();
    const { profile } = useAuth();
    const [isThinking, setIsThinking] = useState(false);
    const [latestAnalysis, setLatestAnalysis] = useState<CoachCommentary | null>(null);

    // ユーザーのプラン判定
    const planType = (profile?.plan_type || 'free').toLowerCase();

    useEffect(() => {
        // 1. デバウンス処理（頻繁な再計算を避けるため、最後の変更から500ms待つ）
        const timer = setTimeout(() => {
            performInference();
        }, 800);

        return () => clearTimeout(timer);
    }, [
        gameState.zones, 
        gameState.cards, 
        gameState.turnCount, 
        gameState.currentTurnPlayer,
        gameState.isGameStarted
    ]);

    const performInference = async () => {
        setIsThinking(true);
        try {
            // --- AI思考レイヤーの実行 ---
            
            // Layer 1: 正規化
            const canonicalState = normalizeGameState(gameState);
            
            // Layer 2: 特徴量抽出
            const features = extractFeatures(canonicalState);
            
            // Layer 6: 探索エンジン（ハイブリッド検索）実行
            // ※ここでシミュレータ(Layer 5)や評価関数(Layer 3)も内部的に呼ばれる
            const searchResult = hybridSearch(canonicalState);
            
            // Layer 7: 日本語解説・コーチング生成
            const commentary = buildCoachCommentary(canonicalState, searchResult);

            setLatestAnalysis(commentary);
        } catch (error) {
            console.error('[AI Coach Engine Error]:', error);
        } finally {
            setIsThinking(false);
        }
    };

    /**
     * プランに応じたフィルタリングをかけた解説を返します。
     * マネタイズ戦略に基づき、Free版では詳細（Pros/Cons）を隠します。
     */
    const filteredCommentary = useMemo(() => {
        if (!latestAnalysis) return null;
        if (planType === 'pro' || planType === 'elite') return latestAnalysis;

        // Free版のフィルタリング
        return {
            ...latestAnalysis,
            bestActions: latestAnalysis.bestActions.map(action => ({
                ...action,
                pros: [], // 詳細を隠す
                cons: [], // 詳細を隠す
                strategicValue: '???'
            })),
            alternatives: [] // 代替案も非表示
        };
    }, [latestAnalysis, planType]);

    return {
        isThinking,
        commentary: filteredCommentary,
        planType,
        refresh: performInference
    };
}
