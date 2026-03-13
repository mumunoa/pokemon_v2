import { AIInput, CandidateMove } from '@/types/ai';

/**
 * 明らかに価値が低い、または状況的に不要な候補手を除外します。
 */
export function pruneMoves(input: AIInput, moves: CandidateMove[]): CandidateMove[] {
    return moves.filter(move => {
        // 例: すでに十分なエネルギーがあるポケモンにさらに貼る候補など（将来的に詳細判定を追加）
        
        // 現時点では基本ルール外のチェックは最小限にする
        return true;
    });
}
