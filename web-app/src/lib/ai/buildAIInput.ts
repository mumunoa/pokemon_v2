import { GameState, PlayerId, ZoneType } from '@/types/game';
import { AIInput, AIPokemon, AICard, AIStructuredAction } from '@/types/ai';

/**
 * GameState（フロントエンドの生の状態）を AI分析用のクリーンな入力データ（AIInput）に変換します。
 */
export function buildAIInput(state: GameState): AIInput {
    const selfId = state.currentTurnPlayer;
    const opponentId = selfId === 'player1' ? 'player2' : 'player1';

    const getPokemonFromZone = (zone: ZoneType): AIPokemon | undefined => {
        const cardIds = state.zones[zone];
        if (!cardIds || cardIds.length === 0) return undefined;
        
        // ゾーンのトップにあるカードを対象とする（Activeやベンチの各枠は1枚想定）
        const cardId = cardIds[0];
        const card = state.cards[cardId];
        if (!card) return undefined;

        return {
            instanceId: card.instanceId,
            baseCardId: card.baseCardId,
            name: card.name,
            damage: card.damage || 0,
            attachedEnergyIds: card.attachedEnergyIds || [],
            specialConditions: card.specialConditions || [],
            hp: card.hp
        };
    };

    const getBenchPokemons = (playerId: PlayerId): AIPokemon[] => {
        const bench: AIPokemon[] = [];
        // 各ベンチ枠（1-5）を走査
        for (let i = 1; i <= 5; i++) {
            const p = getPokemonFromZone(`${playerId}-bench-${i}` as ZoneType);
            if (p) bench.push(p);
        }
        return bench;
    };

    const getCardsFromZone = (zone: ZoneType): AICard[] => {
        const cardIds = state.zones[zone] || [];
        return cardIds.map(id => {
            const card = state.cards[id];
            return {
                instanceId: id,
                baseCardId: card?.baseCardId || '',
                name: card?.name || '',
                type: card?.type || '',
                kinds: card?.kinds
            };
        });
    };

    // 今ターンの自分の行動ログを抽出して状態を算出
    const recentActionsInTurn = state.structuredLogs.filter(
        log => log.turn === state.turnCount && log.playerId === selfId
    );

    // サポート権の使用チェック（手札からトラッシュへサポートカードが移動したか、などのログから判定）
    const supporterUsed = recentActionsInTurn.some(log => {
        if (log.actionType === 'move_card' && log.targetZone?.includes('trash')) {
            const card = state.cards[log.cardInstanceId || ''];
            return card?.kinds === 'supporter';
        }
        return false;
    });

    // エネルギーの手貼りチェック
    const energyAttached = recentActionsInTurn.some(log => log.actionType === 'attach_energy');

    return {
        gameId: state.gameId,
        turn: state.turnCount,
        currentPlayer: selfId,
        self: {
            active: getPokemonFromZone(`${selfId}-active` as ZoneType),
            bench: getBenchPokemons(selfId),
            hand: getCardsFromZone(`${selfId}-hand` as ZoneType),
            deckCount: (state.zones[`${selfId}-deck` as ZoneType] || []).length,
            prizeCount: (state.zones[`${selfId}-prizes` as ZoneType] || []).length,
            discardCount: (state.zones[`${selfId}-trash` as ZoneType] || []).length,
            discardCards: getCardsFromZone(`${selfId}-trash` as ZoneType),
            supporterUsedThisTurn: supporterUsed,
            energyAttachedThisTurn: energyAttached
        },
        opponent: {
            active: getPokemonFromZone(`${opponentId}-active` as ZoneType),
            bench: getBenchPokemons(opponentId),
            handCount: (state.zones[`${opponentId}-hand` as ZoneType] || []).length,
            deckCount: (state.zones[`${opponentId}-deck` as ZoneType] || []).length,
            prizeCount: (state.zones[`${opponentId}-prizes` as ZoneType] || []).length,
            discardCount: (state.zones[`${opponentId}-trash` as ZoneType] || []).length,
            discardCards: getCardsFromZone(`${opponentId}-trash` as ZoneType),
            resourcesConsumed: {
                // 特定カードのトラッシュ枚数をカウント
                bossOrders: getCardsFromZone(`${opponentId}-trash` as ZoneType).filter(c => c.name.includes('ボスの指令')).length,
                energySwitch: getCardsFromZone(`${opponentId}-trash` as ZoneType).filter(c => c.name.includes('エネルギーつけかえ')).length,
                superRod: getCardsFromZone(`${opponentId}-trash` as ZoneType).filter(c => c.name.includes('すごいつりざお')).length,
                switch: getCardsFromZone(`${opponentId}-trash` as ZoneType).filter(c => c.name.includes('ポケモンいれかえ')).length,
            }
        },
        recentActions: state.structuredLogs.slice(-20).map(log => ({
            actionType: log.actionType,
            playerId: log.playerId,
            cardInstanceId: log.cardInstanceId,
            baseCardId: log.baseCardId,
            turn: log.turn,
            payload: log.payload
        })),
        // deckPlan は将来的に Deck AI から受け取る予定
    };
}
