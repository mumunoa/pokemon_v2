import { PlayerId, ZoneType } from './game';

/**
 * AIが盤面を評価するために簡略化・正規化されたポケモンデータ
 */
export type AIPokemon = {
    instanceId: string;
    baseCardId: string;
    name: string;
    damage: number;
    attachedEnergyIds: string[];
    specialConditions: string[];
    hp?: number;
};

/**
 * AIが手札などを評価するための簡略化されたカードデータ
 */
export type AICard = {
    instanceId: string;
    baseCardId: string;
    name: string;
    type: string;
    kinds?: string;
};

/**
 * AIが過去の行動を把握するための構造化アクションログ
 */
export type AIStructuredAction = {
    actionType: string;
    playerId: PlayerId;
    cardInstanceId?: string;
    baseCardId?: string;
    turn: number;
    payload?: any;
};

/**
 * デッキの基本戦略概要
 */
export type DeckPlanSummary = {
    archetype?: string;
    winConditions: string[];
    idealBoard: string[];
    earlyGamePlan: string[];
    midGamePlan: string[];
    lateGamePlan: string[];
};

/**
 * AI分析のための単一ターンの入力データ構造
 */
export type AIInput = {
    gameId: string;
    turn: number;
    currentPlayer: PlayerId;
    self: {
        active?: AIPokemon;
        bench: AIPokemon[];
        hand: AICard[];
        deckCount: number;
        prizeCount: number;
        discardCount: number;
        supporterUsedThisTurn: boolean;
        energyAttachedThisTurn: boolean;
        discardCards: AICard[];
    };
    opponent: {
        active?: AIPokemon;
        bench: AIPokemon[];
        handCount: number;
        deckCount: number;
        prizeCount: number;
        discardCount: number;
        discardCards: AICard[];
        resourcesConsumed: {
            bossOrders: number;
            energySwitch: number;
            superRod: number;
            switch: number;
        };
    };
    recentActions: AIStructuredAction[];
    deckPlan?: DeckPlanSummary;
};

/**
 * AIが提案する行動のタイプ
 */
export type CandidateMoveType =
    | "PLAY_ITEM"
    | "PLAY_SUPPORTER"
    | "ATTACH_ENERGY"
    | "EVOLVE"
    | "ATTACK"
    | "RETREAT"
    | "PLAY_TO_BENCH";

/**
 * AIが提案する具体的な候補手
 */
export type CandidateMove = {
    id: string;
    type: CandidateMoveType;
    label: string;
    score?: number;
    priority?: number;
    sourceCardInstanceId?: string;
    sourceBaseCardId?: string;
    targetCardInstanceId?: string;
    targetZone?: string;
    payload?: Record<string, unknown>;
    reasons?: string[];
};

/**
 * AIの分析結果
 */
export type AITurnAnalysisResult = {
    bestMove: CandidateMove | null;
    alternatives: CandidateMove[];
    reasonShort: string;
    reasonDetailed?: string[];
    source: "rule" | "heuristic" | "simulation" | "llm";
    cached: boolean;
};
