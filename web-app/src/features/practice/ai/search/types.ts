import { CanonicalGameState } from '../core/types';
import { ActionSequence } from '../generator/types';

/**
 * 探索木またはビーム探索におけるノード
 */
export interface SearchNode {
    state: CanonicalGameState;
    sequence: ActionSequence; // このノードに到達するために実行した一連の行動
    score: number;           // 評価関数によるスコア
    depth: number;
    parent?: SearchNode;
}

/**
 * 探索のオプション
 */
export interface SearchOptions {
    beamWidth: number;       // 各階層で保持する候補数
    maxDepth: number;        // 最大探索深さ
    timeLimitMs: number;     // 制限時間
}

/**
 * 最終的な探索結果
 */
export interface SearchResult {
    bestSequence: ActionSequence;
    bestScore: number;
    bestNode?: SearchNode; // 追加
    totalNodesExplored: number;
    depthReached: number;
    alternatives: SearchNode[];
}
