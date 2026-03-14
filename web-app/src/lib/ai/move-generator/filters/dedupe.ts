import { CandidateMove } from '@/types/ai';

/**
 * 重複する候補手を統合します。
 * 同じアクションタイプで、かつ同じソース・ターゲットを持つものを1つにまとめます。
 */
export function dedupeMoves(moves: CandidateMove[]): CandidateMove[] {
    const seen = new Set<string>();
    return moves.filter(move => {
        // キー：タイプ + ベースカードID + ターゲット + ラベル
        // インスタンスIDではなくベースカードIDを使うことで、同じカードが複数ある場合の重複を防ぐ
        const sourceId = move.sourceBaseCardId || move.sourceCardInstanceId || '';
        const targetId = move.targetCardInstanceId || move.targetZone || '';
        const key = `${move.type}_${sourceId}_${targetId}_${move.label}`;
        
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
