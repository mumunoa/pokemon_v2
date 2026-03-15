import { GameState, PlayerId, ZoneType, CardInstance } from '@/types/game';
import { 
    CanonicalGameState, 
    AIPlayerState, 
    AIOpponentState, 
    AIBoardPokemon, 
    AICardRef, 
    GamePhase 
} from './types';

/**
 * GameStateをAI用の正規化された CanonicalGameState に変換します。
 */
export function normalizeGameState(state: GameState): CanonicalGameState {
    const selfId = state.currentTurnPlayer;
    const opponentId = selfId === 'player1' ? 'player2' : 'player1';

    // 1. 基本情報の抽出
    const turn = state.turnCount;
    const isFirstPlayer = true; // 仮：本来は先行後攻ログから取得
    const firstTurnForSelf = turn === 1 && isFirstPlayer;

    // 2. プレイヤー状態の抽出
    const self = extractPlayerState(state, selfId);
    const opponent = extractOpponentState(state, opponentId);

    // 3. フェーズの判定
    const phase = detectPhase(state.isGameStarted, turn, self.prizeCount, opponent.prizeCount);

    // 4. 公開情報の集計
    const seenCards = countSeenCards(state);

    return {
        turn,
        phase,
        activePlayer: 'self',
        currentPlayerId: selfId,
        isFirstPlayer,
        firstTurnForSelf,
        self,
        opponent,
        knownInfo: {
            seenCards,
            prizedCandidates: {} // 将来的に実装
        },
        hiddenInfo: {
            deckOrder: [],
            opponentHand: [],
            prizes: []
        },
        meta: {
            winConditions: ['相手のサイドを0にする', '相手の山札を切らす'],
            riskTolerance: 0.5
        },
        isGameStarted: state.isGameStarted
    };
}

function extractPlayerState(state: GameState, playerId: PlayerId): AIPlayerState {
    const getCards = (zone: ZoneType): AICardRef[] => {
        return (state.zones[zone] || []).map(id => mapToAICardRef(state.cards[id]));
    };

    const getPokemon = (zone: ZoneType): AIBoardPokemon | null => {
        const id = state.zones[zone]?.[0];
        if (!id) return null;
        return mapToAIBoardPokemon(state.cards[id], playerId);
    };

    const getBench = (): AIBoardPokemon[] => {
        const bench: AIBoardPokemon[] = [];
        for (let i = 1; i <= 5; i++) {
            const p = getPokemon(`${playerId}-bench-${i}` as ZoneType);
            if (p) bench.push(p);
        }
        return bench;
    };

    const turnLogs = state.structuredLogs.filter(l => l.turn === state.turnCount && l.playerId === playerId);

    return {
        hand: getCards(`${playerId}-hand` as ZoneType),
        deckCount: (state.zones[`${playerId}-deck` as ZoneType] || []).length,
        discard: getCards(`${playerId}-trash` as ZoneType),
        prizeCount: (state.zones[`${playerId}-prizes` as ZoneType] || []).length,
        active: getPokemon(`${playerId}-active` as ZoneType),
        bench: getBench(),
        lostZone: [], // 現状未実装
        supporterUsed: turnLogs.some(l => {
            const card = state.cards[l.cardInstanceId || ''];
            return card?.kinds === 'supporter';
        }),
        energyAttachedThisTurn: turnLogs.some(l => l.actionType === 'attach_energy'),
        retreatUsed: turnLogs.some(l => l.actionType === 'move_card' && l.sourceZone?.includes('active')),
        attackUsed: turnLogs.some(l => l.actionType === 'attack')
    };
}

function extractOpponentState(state: GameState, playerId: PlayerId): AIOpponentState {
    const getCards = (zone: ZoneType): AICardRef[] => {
        return (state.zones[zone] || []).map(id => mapToAICardRef(state.cards[id]));
    };

    const getPokemon = (zone: ZoneType): AIBoardPokemon | null => {
        const id = state.zones[zone]?.[0];
        if (!id) return null;
        return mapToAIBoardPokemon(state.cards[id], playerId);
    };

    const getBench = (): AIBoardPokemon[] => {
        const bench: AIBoardPokemon[] = [];
        for (let i = 1; i <= 5; i++) {
            const p = getPokemon(`${playerId}-bench-${i}` as ZoneType);
            if (p) bench.push(p);
        }
        return bench;
    };

    return {
        handCount: (state.zones[`${playerId}-hand` as ZoneType] || []).length,
        deckCount: (state.zones[`${playerId}-deck` as ZoneType] || []).length,
        discard: getCards(`${playerId}-trash` as ZoneType),
        prizeCount: (state.zones[`${playerId}-prizes` as ZoneType] || []).length,
        active: getPokemon(`${playerId}-active` as ZoneType),
        bench: getBench(),
        knownHandCards: [], // 将来的に実装
        revealedCards: []    // 将来的に実装
    };
}

function mapToAICardRef(card: CardInstance): AICardRef {
    return {
        instanceId: card.instanceId,
        baseCardId: card.baseCardId,
        name: card.name,
        type: card.type,
        kinds: card.kinds,
        superType: card.type === 'trainer' ? card.kinds : card.type
    };
}

function mapToAIBoardPokemon(card: CardInstance, ownerId: PlayerId): AIBoardPokemon {
    return {
        ...mapToAICardRef(card),
        damage: card.damage || 0,
        hp: card.hp || 100, // デフォルト値、本来はベースデータから取得
        maxHp: card.hp || 100,
        attachedEnergyIds: card.attachedEnergyIds || [],
        specialConditions: card.specialConditions || [],
        stage: 'BASIC', // 将来的にベースデータ連携
        ownerId
    };
}

function detectPhase(isGameStarted: boolean, turn: number, selfPrizes: number, opponentPrizes: number): GamePhase {
    if (!isGameStarted) return 'PREPARE';
    if (selfPrizes <= 2 || opponentPrizes <= 2) return 'LATE';
    if (turn <= 2) return 'EARLY';
    return 'MID';
}

function countSeenCards(state: GameState) {
    const counts = {
        self: {} as Record<string, number>,
        opponent: {} as Record<string, number>
    };

    // トラッシュ、場、手札（自分のみ）から既報枚数をカウント
    // ここでは簡易実装
    return counts;
}
