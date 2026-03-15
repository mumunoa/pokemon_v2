import { CanonicalGameState } from '../core/types';
import { cloneState } from '../simulator/cloneState';

/**
 * 非公開情報（相手の手札、山札、サイドの中身）をランダムに決定させた「決定化されたステート」を生成します。
 */
export function determinize(state: CanonicalGameState): CanonicalGameState {
    const nextState = cloneState(state);
    
    // 1. 山札をランダム化 (既知のカード以外でシャッフル)
    // 本来はトラッシュや場にあるカードを除いたプールを作る
    
    // 2. 相手の手札をランダム化
    // アーキタイプに基づいた予測カードを割り当てる等
    
    // 3. サイドをランダム化
    
    return nextState;
}

/**
 * 複数の決定化されたサンプルを作成します。
 */
export function generateSamples(state: CanonicalGameState, count: number): CanonicalGameState[] {
    const samples: CanonicalGameState[] = [];
    for (let i = 0; i < count; i++) {
        samples.push(determinize(state));
    }
    return samples;
}
