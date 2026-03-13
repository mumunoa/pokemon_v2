import { CandidateMove } from '@/types/ai';

/**
 * 重複する候補手を統合します。
 * 同じアクションタイプで、かつ同じソース・ターゲットを持つものを1つにまとめます。
 */
export function dedupeMoves(moves: CandidateMove[]): CandidateMove[] {
    const seen = new Set<string>();
    return moves.filter(move => {
        // キー：タイプ + ソースカード + ターゲットカード
        const key = `${move.type}_${move.sourceCardInstanceId || ''}_${move.targetCardInstanceId || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
