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
        state: searchResult.bestSequence ? searchResult.alternatives[0]?.state : initialState, // 暫定
        sequence: searchResult.bestSequence,
        score: searchResult.bestScore,
        depth: 1
    } as any);

    const alternativeExplanations = searchResult.alternatives.slice(0, 2).map(node => 
        explainMove(initialState, node)
    );

    let gameContext = '現在の盤面を分析しています。';
    if (initialState.phase === 'PREPARE') gameContext = '序盤の盤面形成が重要です。アタッカーの準備を急ぎましょう。';
    if (initialState.phase === 'MID') gameContext = '中盤のサイドレースです。相手のシステムポケモンを狙うか検討が必要です。';
    if (initialState.phase === 'LATE') gameContext = '終盤です。リーサル（勝ち切り）または負け筋の回避を最優先してください。';

    return {
        mainAdvice: bestExplanation.pros.length > 0 
            ? `最善手は「${bestExplanation.title}」です。${bestExplanation.pros[0]}`
            : '慎重なプレイが求められます。リソースを温存しつつ準備を整えましょう。',
        bestActions: [bestExplanation],
        alternatives: alternativeExplanations,
        gameContext
    };
}
