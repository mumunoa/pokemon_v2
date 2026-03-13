import { MoveGenerator } from '../types';
import { CandidateMove } from '@/types/ai';

/**
 * 攻撃の候補手を生成します。
 */
export const generateAttackMoves: MoveGenerator = ({ input }) => {
    const moves: CandidateMove[] = [];
    const active = input.self.active;

    if (!active) return moves;

    // 本来は技の必要エネルギーをチェックしますが、
    // バトル場にポケモンがいれば「攻撃する」を最高優先度で常に考慮します
    moves.push({
        id: `attack-${active.instanceId}`,
        type: 'ATTACK',
        label: `ワザを使って攻撃する`,
        sourceCardInstanceId: active.instanceId,
        sourceBaseCardId: active.baseCardId,
        reasons: ['相手のポケモンを倒し、サイドを取るため']
    });

    return moves;
};
