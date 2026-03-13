import { MoveGenerator } from '../types';
import { CandidateMove } from '@/types/ai';

/**
 * サポートカードの使用候補を生成します。
 */
export const generateSupporterMoves: MoveGenerator = ({ input }) => {
    const moves: CandidateMove[] = [];

    // すでに今ターンサポートを使用済みの場合は候補を出さない
    if (input.self.supporterUsedThisTurn) {
        return moves;
    }

    // 手札からサポートカードを探す
    const supporters = input.self.hand.filter(card => card.kinds === 'supporter');

    for (const card of supporters) {
        moves.push({
            id: `play-supporter-${card.instanceId}`,
            type: 'PLAY_SUPPORTER',
            label: `サポート「${card.name}」を使う`,
            sourceCardInstanceId: card.instanceId,
            sourceBaseCardId: card.baseCardId,
            reasons: ['手札のリフレッシュやリソース確保のため']
        });
    }

    return moves;
};
