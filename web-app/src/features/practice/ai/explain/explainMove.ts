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
    if (finalState.self.prizeCount < initialState.self.prizeCount) {
        const diff = initialState.self.prizeCount - finalState.self.prizeCount;
        pros.push(`相手のサイドを ${diff} 枚取りました。`);
        strategicValue = 'ATTACK';
    }

    if (finalState.self.bench.length > initialState.self.bench.length) {
        pros.push('ベンチを広げて盤面を形成しました。');
    }

    if (finalState.self.active?.name !== initialState.self.active?.name && initialState.self.active) {
        pros.push(`バトル場を ${finalState.self.active?.name} に交代しました。`);
    }

    // 実際にエネルギーが増えたか、またはそのターンに新しく付けたか
    const initialEnergyCount = [initialState.self.active, ...initialState.self.bench].reduce((sum, p) => sum + (p?.attachedEnergyIds.length || 0), 0);
    const finalEnergyCount = [finalState.self.active, ...finalState.self.bench].reduce((sum, p) => sum + (p?.attachedEnergyIds.length || 0), 0);
    if (finalEnergyCount > initialEnergyCount) {
        pros.push('エネルギーを付けて攻撃の準備を整えました。');
    }

    // 2. リスク（Cons）の抽出
    // 手札が減り、かつ3枚以下になった場合のみ警告
    if (finalState.self.hand.length < initialState.self.hand.length && finalState.self.hand.length <= 2) {
        cons.push('手札が少なくなりました、次ターンのナンジャモ等が致命的になる可能性があります。');
    }

    if (finalState.self.deckCount < initialState.self.deckCount - 10) {
        cons.push('山札を急激に消費しました、リソース切れに注意が必要です。');
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
