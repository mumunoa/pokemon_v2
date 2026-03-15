import { CanonicalGameState } from '../core/types';
import { ActionSequence } from '../generator/types';
import { SearchNode } from '../search/types';
import { ActionExplanation } from './types';
import { extractFeatures } from '../features/extractFeatures';

/**
 * 探索で見つかった特定の手順（ノード）に対して、なぜそれが選ばれたのかを言語化します。
 */
export function explainMove(
    initialState: CanonicalGameState,
    targetNode: SearchNode
): ActionExplanation {
    const sequence = targetNode.sequence;
    const finalState = targetNode.state;
    
    const initialFeatures = extractFeatures(initialState);
    const finalFeatures = extractFeatures(finalState);

    const pros: string[] = [];
    const cons: string[] = [];
    let strategicValue: string = 'SETUP';

    // 1. 成果（Pros）の抽出
    if (finalState.opponent.prizeCount < initialState.opponent.prizeCount) {
        const diff = initialState.opponent.prizeCount - finalState.opponent.prizeCount;
        pros.push(`相手のサイドを ${diff} 枚取りました。`);
        strategicValue = 'ATTACK';
    }

    if (finalState.self.bench.length > initialState.self.bench.length) {
        pros.push('ベンチを広げて盤面を形成しました。');
    }

    if (finalState.self.active?.name !== initialState.self.active?.name) {
        pros.push(`バトル場を ${finalState.self.active?.name} に交代しました。`);
    }

    const energyDiff = finalFeatures.board.energySpreadScore - initialFeatures.board.energySpreadScore;
    if (energyDiff > 0) {
        pros.push('エネルギーを付けて攻撃の準備を整えました。');
    }

    // 2. リスク（Cons）の抽出
    if (finalState.self.deckCount < initialState.self.deckCount - 5) {
        cons.push('山札を多く消費しました、リソース切れに注意が必要です。');
    }

    if (finalState.self.hand.length < 3) {
        cons.push('手札が少なくなりました、次ターンのナンジャモ等が致命的になる可能性があります。');
    }

    return {
        title: sequence.label,
        description: sequence.description,
        pros,
        cons,
        score: targetNode.score,
        strategicValue
    };
}
