
import { 
    BoardState, 
    CardRoleProfile, 
    KeyCard, 
    ArchetypeStrategy 
} from '../domain/types';

/**
 * Key card scoring engine.
 * Scores card importance based on board state and deck strategy.
 */

export function scoreKeyCards(
    deckRoles: CardRoleProfile[], 
    board: BoardState, 
    strategy: ArchetypeStrategy
): KeyCard[] {
    const keyCards: KeyCard[] = [];

    deckRoles.forEach(profile => {
        let score = 0;
        let reasons: string[] = [];

        // 1. Static Role Baseline
        if (profile.staticRoles.includes('draw')) score += 15, reasons.push('ドローエンジン');
        if (profile.staticRoles.includes('search')) score += 10, reasons.push('サーチ札');
        if (profile.staticRoles.includes('gust')) score += 20, reasons.push('呼び出し札（勝ち筋）');
        if (profile.staticRoles.includes('energy_accel')) score += 12, reasons.push('エネ加速');

        // 2. Dynamic Board Context
        // Turn 1 setup priority
        if (board.turnCount <= 2 && profile.staticRoles.includes('bench_setup')) {
            score += 25;
            reasons.push('序盤の展開札');
        }

        // Mid-game evolution priority
        if (board.turnCount >= 2 && profile.staticRoles.includes('evolution_search')) {
            score += 20;
            reasons.push('中盤の進化安定');
        }

        // Critical consistency if hand is low
        if (board.hand.length <= 3 && profile.staticRoles.includes('draw')) {
            score += 30;
            reasons.push('手札細り時の生命線');
        }

        // Near victory gust priority
        if (board.prizesTakenByPlayer >= 4 && profile.staticRoles.includes('gust')) {
            score += 40;
            reasons.push('サイドを取り切る勝ち札');
        }

        // Archetype specific boost
        if (strategy.name.toLowerCase().includes('charizard') && profile.cardName.includes('ヒート')) {
            score += 10;
            reasons.push('デッキ相性（高耐久化）');
        }

        if (score > 30) {
            keyCards.push({
                cardId: profile.cardId,
                cardName: profile.cardName,
                score: score,
                reason: reasons.join(' / ')
            });
        }
    });

    return keyCards.sort((a, b) => b.score - a.score).slice(0, 5);
}
