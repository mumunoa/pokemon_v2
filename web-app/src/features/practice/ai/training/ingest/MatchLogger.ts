import { CanonicalGameState } from '../../core/types';
import { SearchResult } from '../../search/types';
import { CombinedFeatures } from '../../features/types';

/**
 * 毎ターンのAIの意思決定プロセスと結果を記録します。
 * これにより、将来の学習（重み調整）が可能になります。
 */
export interface EvaluationLog {
    timestamp: string;
    gameId: string;
    turn: number;
    state: CanonicalGameState;
    features: CombinedFeatures;
    searchResult: SearchResult;
    actualActionTaken?: string; // ユーザーが実際に選んだ行動
    winResult?: boolean; // 最終的にこの試合に勝ったか
}

/**
 * ログを保存するためのサービス
 */
export async function logAIInference(log: EvaluationLog) {
    // 将来的には Supabase の 'ai_evaluation_logs' テーブルに保存
    console.log('[AI Training Log Ingested]', {
        turn: log.turn,
        bestMove: log.searchResult.bestSequence?.label,
        score: log.searchResult.bestScore
    });
}
