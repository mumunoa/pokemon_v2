import { GameState, PlayerId, ZoneType, CardInstance } from '@/types/game';

/**
 * AIに送信するための正規化されたデータ形式。
 * 将来的なPython側（またはLangChain等）での解析を容易にするために、
 * GameStateから不要なUI情報を削ぎ落とし、盤面構成を整理したもの。
 */
export interface AIInputSchema {
    gameId: string;
    turn: number;
    activePlayer: PlayerId;
    opponentPlayer: PlayerId;
    board: {
        active: AIFieldPokemon | null;
        bench: AIFieldPokemon[];
        prizesCount: number;
        deckCount: number;
        handCount: number;
        trashCount: number;
    };
    opponentBoard: {
        active: AIFieldPokemon | null;
        bench: AIFieldPokemon[];
        prizesCount: number;
        deckCount: number;
        handCount: number;
        trashCount: number;
    };
    hand: AICard[]; // 自分の手札の中身
    stadium: string | null;
    recentLogs: string[];
}

export interface AIFieldPokemon {
    cardId: string;
    name: string;
    hp: number;
    currentDamage: number;
    energies: { type: string; count: number }[];
    tools: string[];
    specialConditions: string[];
}

export interface AICard {
    cardId: string;
    name: string;
    type: string;
    kinds?: string;
}

/**
 * 現在のGameStateからAI用入力を生成する
 */
export const buildAIInput = (state: GameState): AIInputSchema => {
    const activePlayer = state.currentTurnPlayer;
    const opponentPlayer: PlayerId = activePlayer === 'player1' ? 'player2' : 'player1';

    const getFieldPokemon = (zone: ZoneType): AIFieldPokemon | null => {
        const cardIds = state.zones[zone] || [];
        const pokemonId = [...cardIds].reverse().find(id => state.cards[id]?.type === 'pokemon');
        if (!pokemonId) return null;

        const pokemon = state.cards[pokemonId];
        const attachedEnergies = pokemon.attachedEnergyIds.map(eid => state.cards[eid]);

        // エネルギー集計
        const energyCounts: Record<string, number> = {};
        attachedEnergies.forEach(e => {
            if (e && e.kinds) {
                energyCounts[e.kinds] = (energyCounts[e.kinds] || 0) + 1;
            }
        });

        const tools = cardIds
            .filter(id => state.cards[id]?.kinds === 'tool')
            .map(id => state.cards[id].name);

        return {
            cardId: pokemon.baseCardId,
            name: pokemon.name,
            hp: pokemon.hp || 0,
            currentDamage: pokemon.damage,
            energies: Object.entries(energyCounts).map(([type, count]) => ({ type, count })),
            tools,
            specialConditions: pokemon.specialConditions
        };
    };

    const getBench = (playerId: PlayerId) => {
        const bench: AIFieldPokemon[] = [];
        for (let i = 1; i <= 5; i++) {
            const poke = getFieldPokemon(`${playerId}-bench-${i}` as ZoneType);
            if (poke) bench.push(poke);
        }
        return bench;
    };

    return {
        gameId: state.gameId,
        turn: state.turnCount,
        activePlayer,
        opponentPlayer,
        board: {
            active: getFieldPokemon(`${activePlayer}-active`),
            bench: getBench(activePlayer),
            prizesCount: state.zones[`${activePlayer}-prizes`].length,
            deckCount: state.zones[`${activePlayer}-deck`].length,
            handCount: state.zones[`${activePlayer}-hand`].length,
            trashCount: state.zones[`${activePlayer}-trash`].length,
        },
        opponentBoard: {
            active: getFieldPokemon(`${opponentPlayer}-active`),
            bench: getBench(opponentPlayer),
            prizesCount: state.zones[`${opponentPlayer}-prizes`].length,
            deckCount: state.zones[`${opponentPlayer}-deck`].length,
            handCount: state.zones[`${opponentPlayer}-hand`].length,
            trashCount: state.zones[`${opponentPlayer}-trash`].length,
        },
        hand: state.zones[`${activePlayer}-hand`].map(id => {
            const c = state.cards[id];
            return {
                cardId: c.baseCardId,
                name: c.name,
                type: c.type,
                kinds: c.kinds
            };
        }),
        stadium: state.zones.stadium.length > 0 ? state.cards[state.zones.stadium[0]].name : null,
        recentLogs: state.logs.slice(-5)
    };
};
