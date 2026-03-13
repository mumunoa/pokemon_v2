import { MoveGenerator } from '../types';
import { CandidateMove, AIPokemon } from '@/types/ai';

/**
 * 進化の候補手を生成します。
 */
export const generateEvolutionMoves: MoveGenerator = ({ input }) => {
    const moves: CandidateMove[] = [];
    const handEvolutionCards = input.self.hand.filter(card => card.type === 'pokemon' && card.kinds === 'evolution');

    if (handEvolutionCards.length === 0) return moves;

    const targets: AIPokemon[] = [];
    if (input.self.active) targets.push(input.self.active);
    targets.push(...input.self.bench);

    for (const evoCard of handEvolutionCards) {
        for (const pokemon of targets) {
            // 本来は進化条件（ピカチュウ→ライチュウ等）をチェックすべきですが
            // まずは「場にいるポケモンを進化させる」という候補を生成します
            moves.push({
                id: `evolve-${pokemon.instanceId}-to-${evoCard.instanceId}`,
                type: 'EVOLVE',
                label: `「${pokemon.name}」を「${evoCard.name}」に進化させる`,
                sourceCardInstanceId: evoCard.instanceId,
                sourceBaseCardId: evoCard.baseCardId,
                targetCardInstanceId: pokemon.instanceId,
                reasons: ['HPや攻撃力を強化するため']
            });
        }
    }
    return moves;
};
