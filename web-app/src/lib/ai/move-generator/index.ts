import { AIInput, CandidateMove } from '@/types/ai';
import { generateSupporterMoves } from './generators/playSupporter';
import { generateItemMoves } from './generators/playItem';
import { generateEnergyMoves } from './generators/attachEnergy';
import { generateEvolutionMoves } from './generators/evolve';
import { generateBenchMoves } from './generators/playToBench';
import { generateAttackMoves } from './generators/attack';
import { generateRetreatMoves } from './generators/retreat';
import { MoveGeneratorContext } from './types';
import { dedupeMoves } from './filters/dedupe';
import { pruneMoves } from './filters/prune';
import { scoreMoves } from './scoring/heuristics';

/**
 * 現在の盤面状況に基づいて、AIが検討すべき行動候補（CandidateMove）のリストを生成します。
 */
export function generateCandidateMoves(input: AIInput): CandidateMove[] {
    const context: MoveGeneratorContext = { input };

    // 1. 各カテゴリの候補をすべて生成
    const rawMoves: CandidateMove[] = [
        ...generateSupporterMoves(context),
        ...generateItemMoves(context),
        ...generateEnergyMoves(context),
        ...generateEvolutionMoves(context),
        ...generateBenchMoves(context),
        ...generateAttackMoves(context),
        ...generateRetreatMoves(context),
    ];

    // 2. 重複除去
    const deduped = dedupeMoves(rawMoves);

    // 3. 不要な候補の選別（枝刈り）
    const pruned = pruneMoves(input, deduped);

    // 4. スコアリング
    const scored = scoreMoves(input, pruned);

    // 5. スコア順にソートして上位8件（UX的に見やすい件数）を返す
    return scored
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 8);
}

export * from './types';
