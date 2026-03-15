import { CanonicalGameState, AIBoardPokemon } from '../core/types';
import { cloneState } from './cloneState';

/**
 * 盤面上で発生した気絶(KO)の判定、サイド取得、特殊状態の解決などを行います。
 */
export function resolveEffects(state: CanonicalGameState): CanonicalGameState {
    const nextState = cloneState(state);
    
    // 1. 気絶チェック (自分)
    checkKnockouts(nextState, 'self');
    
    // 2. 気絶チェック (相手)
    checkKnockouts(nextState, 'opponent');

    return nextState;
}

function checkKnockouts(state: CanonicalGameState, side: 'self' | 'opponent') {
    const player = state[side];
    const opponentSide = side === 'self' ? 'opponent' : 'self';
    const opponent = state[opponentSide];

    // バトル場のチェック
    if (player.active && player.active.damage >= player.active.maxHp) {
        const prizeCount = calculatePrizeValue(player.active);
        processKO(state, side, player.active);
        player.active = null;
        // 相手がサイドを取る（2枚以上のケースを考慮）
        opponent.prizeCount = Math.max(0, opponent.prizeCount - prizeCount);
    }

    // ベンチのチェック
    for (let i = player.bench.length - 1; i >= 0; i--) {
        const p = player.bench[i];
        if (p.damage >= p.maxHp) {
            const prizeCount = calculatePrizeValue(p);
            processKO(state, side, p);
            player.bench.splice(i, 1);
            opponent.prizeCount = Math.max(0, opponent.prizeCount - prizeCount);
        }
    }
}

/**
 * ポケモンが気絶した時に取られるサイドの枚数を算出します。
 */
function calculatePrizeValue(pokemon: AIBoardPokemon): number {
    // 1. 種類(kinds)で判定
    if (pokemon.kinds === 'has_rule') {
        // EXやVなど。本来はカードIDから厳密に判定すべきですが、現状のUI定義に合わせます
        // ※将来的にTAG TEAMやVMAX等の3枚引きもここに追加
        if (pokemon.name.includes('VMAX') || pokemon.name.includes('VSTAR')) {
            return 3;
        }
        return 2;
    }
    
    // 2. デフォルトは1枚
    return 1;
}

function processKO(state: CanonicalGameState, side: 'self' | 'opponent', pokemon: AIBoardPokemon) {
    const player = state[side];
    // トラッシュに送る
    player.discard.push({
        instanceId: pokemon.instanceId,
        baseCardId: pokemon.baseCardId,
        name: pokemon.name,
        type: pokemon.type,
        kinds: pokemon.kinds,
        superType: pokemon.superType
    });
}
