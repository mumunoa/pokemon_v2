import { CanonicalGameState } from '../core/types';
import { SearchResult } from '../search/types';
import { CoachCommentary, ActionExplanation } from './types';
import { explainMove } from './explainMove';

/**
 * 探索結果を元に、プロプレイヤーのような視点でコーチング解説を構築します。
 */
export function buildCoachCommentary(
    initialState: CanonicalGameState,
    searchResult: SearchResult
): CoachCommentary {
    const bestExplanation = explainMove(initialState, {
        state: searchResult.bestNode?.state || initialState,
        sequence: searchResult.bestSequence,
        score: searchResult.bestScore,
        depth: 1
    } as any);

    const alternativeExplanations = searchResult.alternatives.slice(0, 2).map(node => 
        explainMove(initialState, node)
    );

    // 5段階の思考プロセスを反映（より実戦的な内容に強化）
    let gameContext = '';
    const phase = initialState.phase;
    
    if (phase === 'PREPARE') {
        gameContext = '【思考1: 局面分析】現在は対戦準備段階です。バトル場の選定と、相手に手の内を見せない最小限の展開を検討中...';
    } else {
        gameContext = `【思考1: 勝利条件の確認】${phase}です。サイドの取り切りに向けた最短ルートを計算しています。
【思考2: 盤面の守備力チェック】相手の次ターンの最大打点から、気絶のリスクを算出中...
【思考3: リソース管理】終盤のナンジャモやツツジに備え、山札の厚みと手札の質を最適化します。`;
    }

    const advice = bestExplanation.pros.length > 0 
        ? `【最善の行動】
${bestExplanation.title}: ${bestExplanation.description}
${bestExplanation.pros[0]}を含む、複数の行動を組み合わせた最適ルートを提案します。`
        : '【戦況分析】現時点ではリソースを温存し、相手の動きを待つのが最善と判断しました。';

    return {
        mainAdvice: advice,
        bestActions: [bestExplanation],
        alternatives: alternativeExplanations,
        gameContext
    };
}
