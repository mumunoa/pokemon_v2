import { CanonicalGameState } from '../core/types';

/**
 * CanonicalGameStateを高速かつ確実にディープコピーします。
 * 探索アルゴリズム（MCTS等）で大量に状態を分岐させるために使用します。
 */
export function cloneState(state: CanonicalGameState): CanonicalGameState {
    // 構造化クローンを使用（最も安全でパフォーマンスも現代のブラウザなら十分）
    const cloned = structuredClone(state);
    return cloned;
}
