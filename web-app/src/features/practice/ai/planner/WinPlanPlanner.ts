import { CanonicalGameState } from '../core/types';
import { CombinedFeatures } from '../features/types';
import { WinPlan } from './types';

/**
 * 現在の状態から勝利までの最短・最善ルートを算出します。
 */
export function generateWinPlans(state: CanonicalGameState, features: CombinedFeatures): WinPlan[] {
    const plans: WinPlan[] = [];
    const selfPrizes = state.self.prizeCount;
    const oppBoard = state.opponent;

    // 1. 基本プラン: バトル場を倒し続ける
    plans.push({
        planId: 'STANDARD_ATTACK',
        label: 'バトル場正面突破',
        prizePath: new Array(Math.ceil(selfPrizes / 2)).fill(2), // 2枚ずつ取る想定
        targetTags: ['ACTIVE_POKEMON'],
        requiredResources: ['ENERGY'],
        expectedTurnsToWin: Math.ceil(selfPrizes / 2),
        confidence: 0.8
    });

    // 2. ベンチ狙撃・ボスプランの検討
    const smallHpBench = oppBoard.bench.filter(p => p.hp <= 120);
    if (smallHpBench.length >= 2 || (features.oppBoard.oppBenchLiabilityScore > 10)) {
        plans.push({
            planId: 'BENCH_SNIPE_OR_GUST',
            label: 'ベンチの弱点を突く',
            prizePath: new Array(selfPrizes).fill(1),
            targetTags: ['BENCH_POKEMON', 'GUST_TARGET'],
            requiredResources: ['ボスの指令', 'ベンチ狙撃スキル'],
            expectedTurnsToWin: selfPrizes,
            confidence: 0.6
        });
    }

    // 3. 2-2-2 プラン (EXポケモンが盤面に多い場合)
    const exCount = [oppBoard.active, ...oppBoard.bench].filter(p => p?.kinds === 'has_rule').length;
    if (exCount >= 3) {
        plans.push({
            planId: 'TAKE_2_2_2',
            label: '2-2-2 サイド奪取',
            prizePath: [2, 2, 2],
            targetTags: ['RULE_BOX_POKEMON'],
            requiredResources: ['HIGH_DAMAGE'],
            expectedTurnsToWin: 3,
            confidence: 0.9
        });
    }

    return plans.sort((a, b) => b.confidence - a.confidence);
}
