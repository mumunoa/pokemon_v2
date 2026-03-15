import { CanonicalGameState } from '../core/types';
import { BeliefSnapshot } from './types';

/**
 * 非公開情報（山札、サイド、相手の手札内訳）を現時点の公開情報から推定します。
 */
export function estimateHiddenInfo(state: CanonicalGameState): BeliefSnapshot {
    // アーキタイプ推定 (簡易版)
    const archetypeProbabilities: Record<string, number> = {};
    if (state.opponent.active?.name.includes('ミライドン')) {
        archetypeProbabilities['MIRAIDON_AGGRO'] = 0.9;
    } else {
        archetypeProbabilities['UNKNOWN'] = 1.0;
    }

    return {
        opponentArchetypeProbabilities: archetypeProbabilities,
        opponentHandEstimates: {
            'ボスの指令': state.opponent.handCount > 4 ? 0.3 : 0.1,
            'ナンジャモ': state.opponent.handCount > 5 ? 0.4 : 0.1
        },
        opponentNextTurnThreats: [],
        prizeEstimates: state.hiddenInfo.prizes.map((_, i) => ({
            index: i,
            cardIdCandidates: [],
            isKeyCard: false
        }))
    };
}
