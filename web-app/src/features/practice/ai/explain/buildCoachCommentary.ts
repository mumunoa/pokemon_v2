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

    // 5段階の思考プロセスを反映
    let gameContext = '';
    const phase = initialState.phase;
    
    if (phase === 'PREPARE') {
        gameContext = '【思考1: 盤面確認】対戦準備中です。まずはバトル場を確定させ、相手に情報を与えすぎないようにベンチ展開を最小限に抑えます。';
    } else {
        gameContext = `【思考1: 勝ち筋確認】現在のフェーズは${phase}です。勝利への最短ルートを計算中...
【思考2: 負け筋回避】相手の次ターンの最大打点を警戒し、リソースの配分を最適化します。`;
    }

    const advice = bestExplanation.pros.length > 0 
        ? `【おすすめ次の一手】
${bestExplanation.title}: ${bestExplanation.pros[0]}
定石の順序（山札圧縮→展開→エネ→サポート）に沿った行動を推奨します。`
        : '【戦況分析】現時点ではリソースを温存し、相手の動きを待つのが最善と判断しました。';

    return {
        mainAdvice: advice,
        bestActions: [bestExplanation],
        alternatives: alternativeExplanations,
        gameContext
    };
}
