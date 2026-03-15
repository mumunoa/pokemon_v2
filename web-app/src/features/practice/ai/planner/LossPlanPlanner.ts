import { CanonicalGameState } from '../core/types';
import { CombinedFeatures } from '../features/types';
import { LossPlan } from './types';

/**
 * 相手の盤面や手札状況から、自分への敗北リスクを算出します。
 */
export function generateLossPlans(state: CanonicalGameState, features: CombinedFeatures): LossPlan[] {
    const plans: LossPlan[] = [];

    // 1. バトル場ワンパンリスク
    if (features.oppBoard.oppImmediateThreatScore > 80) {
        plans.push({
            lossId: 'ACTIVE_KO_THREAT',
            label: 'バトル場の気絶リスク',
            severity: 0.8,
            probability: 0.7,
            triggerConditions: ['相手がエネルギーを貼る', 'ボスの指令を使われる'],
            preventionHints: ['ベンチに控えアタッカーを置く', 'HPを回復する']
        });
    }

    // 2. 山札切れ (LO) リスク
    if (features.deck.deckOutRisk > 0.5) {
        plans.push({
            lossId: 'DECK_OUT_RISK',
            label: '山札切れによる敗北',
            severity: 1.0,
            probability: features.deck.deckOutRisk,
            triggerConditions: ['過度なドロー', '相手のLO戦略カード'],
            preventionHints: ['博士の研究の使用を控える', 'つりざおで戻す']
        });
    }

    // 3. 手札干渉による事故リスク
    if (features.oppHand.disruptionValueScore > 0.7) {
        plans.push({
            lossId: 'HAND_DISRUPTION_RISK',
            label: '手札干渉(ナンジャモ等)による停止',
            severity: 0.6,
            probability: 0.5,
            triggerConditions: ['ナンジャモ', 'ジャッジマン', 'ツツジ'],
            preventionHints: ['盤面にドロー特性持ちを置く', '山札を圧縮しておく']
        });
    }

    return plans;
}
