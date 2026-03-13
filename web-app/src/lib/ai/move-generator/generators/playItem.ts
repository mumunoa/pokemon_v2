import { MoveGenerator } from '../types';
import { CandidateMove } from '@/types/ai';

/**
 * グッズ（アイテム）カードの使用候補を生成します。
 */
export const generateItemMoves: MoveGenerator = ({ input }) => {
    const moves: CandidateMove[] = [];

    // 手札からグッズカードを探す
    const items = input.self.hand.filter(card => card.kinds === 'item');

    for (const card of items) {
        moves.push({
            id: `play-item-${card.instanceId}`,
            type: 'PLAY_ITEM',
            label: `グッズ「${card.name}」を使う`,
            sourceCardInstanceId: card.instanceId,
            sourceBaseCardId: card.baseCardId,
            reasons: ['盤面の展開を有利にするため']
        });
    }

    return moves;
};
