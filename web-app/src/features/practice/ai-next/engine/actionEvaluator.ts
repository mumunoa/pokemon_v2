
import { 
    ActionCandidate, 
    ScoredAction, 
    BoardState, 
    ArchetypeStrategy, 
    DynamicRole 
} from '../domain/types';

/**
 * Priority and evaluation logic for game actions.
 */

export function evaluateActions(
    candidates: ActionCandidate[], 
    board: BoardState, 
    strategy: ArchetypeStrategy
): ScoredAction[] {
    const scoredActions: ScoredAction[] = [];

    candidates.forEach(action => {
        let score = 0;
        const reasons: string[] = [];
        const dynamicRoles: DynamicRole[] = [];

        // 1. Prize Swing (Winning chances)
        if (action.estimatedPrizeSwing > 1) {
            score += (action.estimatedPrizeSwing * 30 * strategy.priorityWeights.prizeSwing);
            reasons.push('高サイド取り切りアクション');
            dynamicRoles.push('finisher_gust');
        } else if (action.estimatedPrizeSwing === 1) {
            score += 20 * strategy.priorityWeights.prizeSwing;
            reasons.push('サイド差勝ち越し');
        }

        // 2. Setup Gain (Board presence)
        if (action.estimatedSetupGain >= 2) {
            score += (action.estimatedSetupGain * 25 * strategy.priorityWeights.setupGain);
            reasons.push('盤面展開の促進');
            dynamicRoles.push('setup_priority');
        } else if (action.estimatedSetupGain === 1) {
            score += 15 * strategy.priorityWeights.setupGain;
            reasons.push('単体展開');
        }

        // 3. Stability Gain (Sustainability)
        if (action.estimatedStabilityGain >= 2) {
            score += (action.estimatedStabilityGain * 20 * strategy.priorityWeights.stabilityGain);
            reasons.push('手札リフレッシュ・次ターンの安定');
            dynamicRoles.push('desperate_draw');
        } else if (action.estimatedStabilityGain === 1) {
            score += 10 * strategy.priorityWeights.stabilityGain;
            reasons.push('手札安定');
        }

        // 4. Special Tag Buffs
        if (action.tags.includes('gust')) {
            if (board.opponentActive && board.opponentActive.hp && board.opponentActive.hp > 250) {
                score += 15;
                reasons.push('高HPポケモンの呼び出し回避（テンポ）');
                dynamicRoles.push('system_snipe');
            }
        }
        
        if (action.tags.includes('search')) {
            if (board.turnCount <= 2) {
                score += 20;
                reasons.push('序盤の安定展開');
            }
        }

        const priority: 'high' | 'medium' | 'low' = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

        scoredActions.push({
            ...action,
            score,
            priority,
            reasons,
            dynamicRoles
        });
    });

    return scoredActions.sort((a, b) => b.score - a.score);
}

export function hashBoardState(board: BoardState): string {
    return `T${board.turnCount}-H${board.hand.length}-P${board.prizesTakenByPlayer}`;
}
