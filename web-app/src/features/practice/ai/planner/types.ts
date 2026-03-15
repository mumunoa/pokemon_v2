import { ActionAtom } from '../generator/types';

/**
 * 勝利に向けた長期的な計画
 */
export interface WinPlan {
    planId: string;
    label: string;
    prizePath: number[]; // 例: [2, 2, 2] はサイド2枚を3回取るプラン
    targetTags: string[]; // 例: ['EX_POKEMON', 'BENCH_SNIPE']
    requiredResources: string[]; // 例: ['BOSS_ORDERS', 'ENERGY_ACCEL']
    expectedTurnsToWin: number;
    confidence: number; // 0.0 - 1.0
}

/**
 * 敗北リスクの予測
 */
export interface LossPlan {
    lossId: string;
    label: string;
    severity: number; // 損害の大きさ 0.0 - 1.0
    probability: number; // 発生確率 0.0 - 1.0
    triggerConditions: string[]; // 敗北のトリガーとなる相手の行動
    preventionHints: string[]; // 回避策
}

/**
 * 戦略選択の結果
 */
export interface StrategyContext {
    activeWinPlan: WinPlan | null;
    activeLossPlans: LossPlan[];
    focusArea: 'SETUP' | 'ATTACK' | 'DISRUPTION' | 'RECOVERY';
    riskTolerance: number;
}
