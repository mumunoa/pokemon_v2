import { CanonicalGameState } from '../core/types';
import { generateActionSequences } from '../generator/generateActionSequences';
import { applySequence, resolveEffects } from '../simulator';
import { extractFeatures } from '../features/extractFeatures';
import { scoreState } from '../evaluation/scoreState';
import { SearchNode, SearchOptions, SearchResult } from './types';

/**
 * ビーム探索を用いて、最も評価の高い行動シーケンスを探し出します。
 */
export function beamSearch(
    initialState: CanonicalGameState,
    options: SearchOptions = { beamWidth: 10, maxDepth: 1, timeLimitMs: 1000 }
): SearchResult {
    const startTime = Date.now();
    
    // 1. 初手の候補シーケンスを生成
    const initialSequences = generateActionSequences(initialState);
    
    let currentNodes: SearchNode[] = initialSequences.map(seq => {
        // シミュレーション実行
        let simulatedState = applySequence(initialState, seq.actions);
        // ルール解決 (気絶判定等)
        simulatedState = resolveEffects(simulatedState);
        
        // 特徴量抽出とスコアリング
        const features = extractFeatures(simulatedState);
        const score = scoreState(simulatedState, features);
        
        return {
            state: simulatedState,
            sequence: seq,
            score: score,
            depth: 1
        };
    });

    // 2. スコア順にソートしてビーム幅内に絞り込む
    currentNodes.sort((a, b) => b.score - a.score);
    const topNodes = currentNodes.slice(0, options.beamWidth);

    // 3. 結果の構築
    if (topNodes.length === 0) {
        // 候補がない場合のフォールバック（番を終わる）
        return {
            bestSequence: { actions: [{ type: 'PASS' }], label: '番を終わる', description: '有効な行動が見つかりませんでした。' },
            bestScore: -1000,
            totalNodesExplored: 1,
            depthReached: 1,
            alternatives: []
        };
    }

    const best = topNodes[0];

    return {
        bestSequence: best.sequence,
        bestScore: best.score,
        bestNode: best,
        totalNodesExplored: initialSequences.length,
        depthReached: 1,
        alternatives: topNodes.slice(1)
    };
}
