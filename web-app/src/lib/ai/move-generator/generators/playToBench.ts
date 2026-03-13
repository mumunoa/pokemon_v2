import { MoveGenerator } from '../types';
import { CandidateMove } from '@/types/ai';

/**
 * ベンチ展開の候補手を生成します。
 */
export const generateBenchMoves: MoveGenerator = ({ input }) => {
    const moves: CandidateMove[] = [];
    
    // ベンチが一杯（5匹）なら出さない
    if (input.self.bench.length >= 5) return moves;

    const basicPokemons = input.self.hand.filter(card => card.type === 'pokemon' && card.kinds === 'basic');

    for (const card of basicPokemons) {
        moves.push({
            id: `play-to-bench-${card.instanceId}`,
            type: 'PLAY_TO_BENCH',
            label: `「${card.name}」をベンチに出す`,
            sourceCardInstanceId: card.instanceId,
            sourceBaseCardId: card.baseCardId,
            reasons: ['盤面の厚みを増やすため']
        });
    }
    return moves;
};
