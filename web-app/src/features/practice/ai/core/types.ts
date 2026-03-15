import { PlayerId } from '@/types/game';

/**
 * AIが解釈しやすいように正規化されたゲーム状態のルート
 */
export interface CanonicalGameState {
    turn: number;
    phase: GamePhase;
    activePlayer: 'self' | 'opponent';
    currentPlayerId: PlayerId;
    isFirstPlayer: boolean;
    firstTurnForSelf: boolean;
    
    self: AIPlayerState;
    opponent: AIOpponentState;

    knownInfo: KnownInfoState;
    hiddenInfo: HiddenInfoState;
    meta: MetaContext;
}

export type GamePhase = 'PREPARE' | 'EARLY' | 'MID' | 'LATE';

/**
 * カードへの参照
 */
export interface AICardRef {
    instanceId: string;
    baseCardId: string;
    name: string;
    type: string;
    kinds?: string;
    superType?: string;
}

/**
 * 盤面上のポケモンの状態
 */
export interface AIBoardPokemon extends AICardRef {
    damage: number;
    hp: number;
    maxHp: number;
    attachedEnergyIds: string[];
    specialConditions: string[];
    stage: 'BASIC' | 'STAGE1' | 'STAGE2';
    ownerId: PlayerId;
}

/**
 * 自分の状態
 */
export interface AIPlayerState {
    hand: AICardRef[];
    deckCount: number;
    discard: AICardRef[];
    prizeCount: number;
    active: AIBoardPokemon | null;
    bench: AIBoardPokemon[];
    lostZone: AICardRef[];
    
    // ターン内フラグ
    supporterUsed: boolean;
    energyAttachedThisTurn: boolean;
    retreatUsed: boolean;
    attackUsed: boolean;
}

/**
 * 相手の状態（非公開情報を含む）
 */
export interface AIOpponentState {
    handCount: number;
    deckCount: number;
    discard: AICardRef[];
    prizeCount: number;
    active: AIBoardPokemon | null;
    bench: AIBoardPokemon[];
    knownHandCards: AICardRef[]; // 公開された手札
    revealedCards: AICardRef[];   // 以前見えたカード（サイド落ちしていないことが確定したものなど）
}

/**
 * 公開情報のサマリー
 */
export interface KnownInfoState {
    // 自分・相手が何枚どのカードを消費したか
    seenCards: {
        self: Record<string, number>;
        opponent: Record<string, number>;
    };
    // サイド落ちしている可能性のあるカードの推定（カウンティング）
    prizedCandidates: Record<string, number>;
}

/**
 * 非公開状態（シミュレーション用）
 */
export interface HiddenInfoState {
    deckOrder: string[]; // 非公開の山札順（シミュレーション時に決定化される）
    opponentHand: string[]; // 相手の手札（推定またはサンプル）
    prizes: string[]; // サイドの中身
}

/**
 * 戦略コンテキスト
 */
export interface MetaContext {
    archetype?: string;
    winConditions: string[];
    riskTolerance: number; // 0.0 ~ 1.0
}
