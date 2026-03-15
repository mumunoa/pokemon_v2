import { CanonicalGameState } from '../core/types';
import { beamSearch } from './beamSearch';
import { generateSamples } from './determinization';
import { SearchResult } from './types';

/**
 * 複数の不完全情報をサンプル化し、平均的に最も良い行動を選択するハイブリッド検索エンジン
 */
export function hybridSearch(state: CanonicalGameState): SearchResult {
    const sampleCount = 3; // 時間節約のため最初は少数サンプル
    const samples = generateSamples(state, sampleCount);
    
    const results = samples.map(sample => beamSearch(sample, {
        beamWidth: 5,
        maxDepth: 1,
        timeLimitMs: 500
    }));

    // 結果の集計 (最も選ばれた bestSequence、または平均スコアが高いもの)
    // ここでは単純に最初のサンプルの結果をベースに、スコアを正規化
    const bestResult = results.sort((a, b) => b.bestScore - a.bestScore)[0];

    return bestResult;
}

export * from './types';
export * from './beamSearch';
export * from './determinization';
