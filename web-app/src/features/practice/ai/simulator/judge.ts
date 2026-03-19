import { CanonicalGameState } from '../core/types';

/**
 * 盤面展開の成功度を判定します。
 */
export function judgeSetupSuccess(state: CanonicalGameState) {
    const self = state.self;
    const active = self.active;
    const bench = self.bench;

    // 基本的な要素の有無
    const hasActive = !!active;
    const benchCount = bench.length;

    // 特性を持つポケモン（システム役）がいるか
    const hasDrawEngine = [active, ...bench].some(p => p && p.name.includes('システム') || (p && p.instanceId.includes('draw')));

    // 攻撃可能な状態か（エネ2枚以上を暫定の基準とする）
    const hasAttackerReady = [active, ...bench].some(p => p && p.attachedEnergyIds.length >= 2);

    return {
        isSuccess: hasActive && benchCount >= 2 && hasDrawEngine && hasAttackerReady,
        hasActive,
        benchCount,
        hasDrawEngine,
        hasAttackerReady
    };
}
