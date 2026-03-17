
import { ScoredAction, BoardState, RecommendationResult, KeyCard } from '../domain/types';

/**
 * Human-readable logic for AI coach output.
 */

export function buildAnalysisExplanation(
    best: ScoredAction | null, 
    keyCards: KeyCard[], 
    board: BoardState
): string {
    if (!best) return "今の盤面で最適な行動をご提案するための十分な情報がありません。";

    let explanation = `今の盤面で推奨されるアクションは、 **「${best.line}」** です。\n\n`;

    if (best.priority === 'high') {
        explanation += `非常に期待値が高い一手です。\n`;
    }

    if (best.reasons.length > 0) {
        explanation += `理由: ${best.reasons.join('、')}\n\n`;
    }

    if (keyCards.length > 0) {
        explanation += `特に **${keyCards[0].cardName}** が今のキーカードであり、このあとの展開を支える生命線となります。`;
    }

    if (board.hand.length <= 2 && !best.line.includes('ドロー')) {
        explanation += `\n⚠️ 手札が ${board.hand.length} 枚と非常に少ないため、次ターンのドローが引けないと止まってしまうリスクがあります。`;
    }

    return explanation.trim();
}

export function buildBoardSummary(board: BoardState): string {
    return `ターン ${board.turnCount} (${board.playerGoingFirst ? '先攻' : '後攻'}) / 手札 ${board.hand.length} 枚 / サイド残り ${6 - board.prizesTakenByPlayer} 枚`;
}
