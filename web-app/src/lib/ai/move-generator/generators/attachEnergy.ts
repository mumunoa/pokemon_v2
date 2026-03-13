import { MoveGenerator } from '../types';
import { CandidateMove, AIPokemon } from '@/types/ai';

/**
 * エネルギーの手貼り候補を生成します。
 */
export const generateEnergyMoves: MoveGenerator = ({ input }) => {
    const moves: CandidateMove[] = [];

    // すでに今ターンエネルギーを貼っている場合は候補を出さない
    if (input.self.energyAttachedThisTurn) {
        return moves;
    }

    // 手札からエネルギーカードを探す
    const energies = input.self.hand.filter(card => card.type === 'energy');
    if (energies.length === 0) return moves;

    // 貼り付け先の候補（バトル場 + ベンチ）
    const targets: AIPokemon[] = [];
    if (input.self.active) targets.push(input.self.active);
    targets.push(...input.self.bench);

    for (const energy of energies) {
        for (const pokemon of targets) {
            moves.push({
                id: `attach-energy-${energy.instanceId}-to-${pokemon.instanceId}`,
                type: 'ATTACH_ENERGY',
                label: `「${pokemon.name}」に「${energy.name}」を貼る`,
                sourceCardInstanceId: energy.instanceId,
                sourceBaseCardId: energy.baseCardId,
                targetCardInstanceId: pokemon.instanceId,
                reasons: pokemon.instanceId === input.self.active?.instanceId 
                    ? ['バトル場の攻撃準備を優先するため'] 
                    : ['ベンチの主力育成のため']
            });
        }
    }

    return moves;
};
