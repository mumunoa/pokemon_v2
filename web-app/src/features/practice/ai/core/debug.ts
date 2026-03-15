import { CanonicalGameState } from './types';

/**
 * 正規化されたステートのサマリーをコンソールに出力します（開発用）
 */
export function logCanonicalState(state: CanonicalGameState) {
    console.group(`AI Canonical State - Turn ${state.turn} (${state.phase})`);
    console.log('Self:', {
        hand: state.self.hand.length,
        active: state.self.active?.name,
        bench: state.self.bench.map(p => p.name),
        prizes: state.self.prizeCount
    });
    console.log('Opponent:', {
        hand: state.opponent.handCount,
        active: state.opponent.active?.name,
        bench: state.opponent.bench.map(p => p.name),
        prizes: state.opponent.prizeCount
    });
    console.groupEnd();
}
