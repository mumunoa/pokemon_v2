import { MoveGenerator } from '../types';
import { CandidateMove } from '@/types/ai';

/**
 * にげる（退く）の候補手を生成します。
 */
export const generateRetreatMoves: MoveGenerator = ({ input }) => {
    const moves: CandidateMove[] = [];
    const active = input.self.active;

    // バトル場にポケモンがいない、またはベンチが空なら逃げられない
    if (!active || input.self.bench.length === 0) return moves;

    // ダメージが大きい場合や、相性が悪い場合に逃げる候補を出す（簡易判定）
    if (active.damage >= 50) {
        for (const benchPokemon of input.self.bench) {
            moves.push({
                id: `retreat-${active.instanceId}-to-${benchPokemon.instanceId}`,
                type: 'RETREAT',
                label: `ベンチの「${benchPokemon.name}」と入れ替わる（にげる）`,
                targetCardInstanceId: benchPokemon.instanceId,
                reasons: ['バトル場のポケモンをきぜつから守るため']
            });
        }
    }

    return moves;
};
