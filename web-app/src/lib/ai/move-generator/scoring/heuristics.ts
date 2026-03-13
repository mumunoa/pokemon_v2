import { AIInput, CandidateMove } from '@/types/ai';

/**
 * 各候補手に簡易的な優先度スコアを付与します。
 */
export function scoreMoves(input: AIInput, moves: CandidateMove[]): CandidateMove[] {
    return moves.map(move => {
        let score = 0;

        // タイプ別の基礎点
        switch (move.type) {
            case 'ATTACK': 
                score += 50; 
                break;
            case 'ATTACH_ENERGY': 
                score += 30; 
                // バトル場へのエネ貼りを優先
                if (move.targetCardInstanceId === input.self.active?.instanceId) {
                    score += 10;
                }
                break;
            case 'EVOLVE': 
                score += 25; 
                break;
            case 'PLAY_ITEM': 
                score += 20; 
                break;
            case 'PLAY_SUPPORTER': 
                score += 15; 
                break;
            case 'PLAY_TO_BENCH': 
                score += 10; 
                break;
            default: 
                score += 5;
        }

        // 盤面状況による加点
        // 手札が少ない時のドロー系サポート（仮の簡易判定）
        if (move.type === 'PLAY_SUPPORTER' && input.self.hand.length <= 3) {
            score += 20;
        }

        return { ...move, score };
    });
}
