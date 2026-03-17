export type CardType = 'pokemon' | 'energy' | 'trainer';
export type CardKind =
    | 'has_rule' | 'non_rule'
    | 'grass' | 'fire' | 'water' | 'lightning' | 'psychic' | 'fighting' | 'darkness' | 'metal' | 'dragon' | 'colorless'
    | 'item' | 'tool' | 'supporter' | 'stadium';

export interface Attack {
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
}

export interface Ability {
    name: string;
    text: string;
}

export interface Rule {
    text: string;
    prize?: string;
    ace?: boolean;
}

export interface DeckCard {
    id: string; // The base image ID or identifier
    no?: string; // Collection number
    name: string;
    imageUrl: string;
    count: number;
    type: CardType;
    kinds?: CardKind;
    hp?: number;
    types?: string[];
    weakness?: string;
    resistance?: string;
    retreat?: string;
    ability?: Ability[];
    attacks?: Attack[];
    rules?: Rule[];
    energy?: any[];
    support?: any[];
    packs?: any[];
    evolves?: string[];
    roles?: string[];
    archetypes?: string[];
}

// Instance representing a single card in play
export interface CardInstance {
    instanceId: string; // Unique ID for this specific copy of the card
    baseCardId: string;
    no?: string;
    name: string;
    imageUrl: string;
    type: CardType;
    kinds?: CardKind;
    ownerId: PlayerId; // Player who originally owns the card

    // Game State variables
    damage: number;
    isReversed: boolean; // For face-down (e.g. prizes)
    specialConditions: string[]; // 'poisoned', 'burned', 'asleep', 'paralyzed', 'confused'
    attachedEnergyIds: string[]; // Array of Energy instance IDs attached to this Pokemon
    hasUsedAbility?: boolean;
    hp?: number;
    rotation?: number; // 0, 90, 180, 270 degrees

    // DB fields carried over
    types?: string[];
    weakness?: string;
    resistance?: string;
    retreat?: string;
    ability?: Ability[];
    attacks?: Attack[];
    rules?: Rule[];
}

export interface StructuredLog {
    id: string;
    gameId: string;
    turn: number;
    playerId: PlayerId;
    actionType: string;
    sourceZone?: ZoneType;
    targetZone?: ZoneType;
    cardInstanceId?: string;
    baseCardId?: string;
    payload?: Record<string, any>;
    createdAt: string;
}

export interface StateSnapshot {
    id: string;
    gameId: string;
    turn: number;
    phase: 'setup' | 'main' | 'attack' | 'end';
    state: {
        cards: Record<string, CardInstance>;
        zones: Record<ZoneType, string[]>;
        currentTurnPlayer: PlayerId;
    };
    createdAt: string;
}

export interface AiAnalysisResult {
    accidentRate: number; // 0-100
    setupRate: number;    // 0-100
    recommendedAction: string;
    description: string;
}

export type PlayerId = 'player1' | 'player2';

export type ZoneType =
    | 'player1-deck'
    | 'player1-hand'
    | 'player1-active'
    | 'player1-bench-1'
    | 'player1-bench-2'
    | 'player1-bench-3'
    | 'player1-bench-4'
    | 'player1-bench-5'
    | 'player1-trash'
    | 'player1-prizes'
    | 'player2-deck'
    | 'player2-hand'
    | 'player2-active'
    | 'player2-bench-1'
    | 'player2-bench-2'
    | 'player2-bench-3'
    | 'player2-bench-4'
    | 'player2-bench-5'
    | 'player2-trash'
    | 'player2-prizes'
    | 'stadium';

export interface GameState {
    // Dictionary of all card instances in the game
    cards: Record<string, CardInstance>;

    // Current deck configurations
    player1Deck: DeckCard[];
    player2Deck: DeckCard[];

    // Mapping of zone names to an array of card instance IDs
    zones: Record<ZoneType, string[]>;

    // Global game state logs
    coinFlips: Array<'heads' | 'tails'>;

    // Turn Management
    turnCount: number;
    currentTurnPlayer: PlayerId;
    isOpponentView: boolean;
    displayMode: 'text' | 'compact' | 'local-image';
    logs: string[];
    structuredLogs: StructuredLog[];
    stateSnapshots: StateSnapshot[];
    gameId: string;
    deckHistory: string[];
    isGameStarted: boolean;
    isAnalyzing: boolean;
    aiAnalysis?: AiAnalysisResult;
    coachResult?: any; // To allow lazy import from ai-next
    coachLoading: boolean;

    // History
    pastStates: {
        cards: Record<string, CardInstance>;
        zones: Record<ZoneType, string[]>;
        turnCount: number;
        currentTurnPlayer: PlayerId;
        isOpponentView: boolean;
        logs: string[];
        structuredLogs: StructuredLog[];
        stateSnapshots: StateSnapshot[];
        deckHistory: string[];
        isGameStarted: boolean;
    }[];
    futureStates: {
        cards: Record<string, CardInstance>;
        zones: Record<ZoneType, string[]>;
        turnCount: number;
        currentTurnPlayer: PlayerId;
        isOpponentView: boolean;
        logs: string[];
        structuredLogs: StructuredLog[];
        stateSnapshots: StateSnapshot[];
        deckHistory: string[];
        isGameStarted: boolean;
    }[];

    // Actions
    getGameState: () => GameState;
    saveState: () => void;
    pushHistory: (snapshot: {
        cards: Record<string, CardInstance>;
        zones: Record<ZoneType, string[]>;
        turnCount: number;
        currentTurnPlayer: PlayerId;
        isOpponentView: boolean;
        logs: string[];
        structuredLogs: StructuredLog[];
        stateSnapshots: StateSnapshot[];
        deckHistory: string[];
        isGameStarted: boolean;
    }) => void;
    undo: () => void;
    redo: () => void;
    addLog: (message: string) => void;
    addStructuredLog: (log: Omit<StructuredLog, 'id' | 'createdAt' | 'gameId' | 'turn'>) => void;
    takeSnapshot: (phase: StateSnapshot['phase']) => void;
    startGame: () => void;

    initializeDeck: (deckList1: DeckCard[], deckList2: DeckCard[]) => void;
    moveCard: (cardId: string, fromZone: ZoneType, toZone: ZoneType, newIndex?: number) => void;
    attachEnergy: (energyId: string, pokemonId: string) => void;
    detachEnergy: (energyId: string, pokemonId: string, toZone: ZoneType) => void;
    updateCardState: (cardId: string, updates: Partial<Omit<CardInstance, 'instanceId' | 'baseCardId'>>) => void;
    drawCards: (playerId: PlayerId, count: number) => void;
    discardHandAndDraw: (playerId: PlayerId, count: number) => void;
    shuffleHandAndDraw: (playerId: PlayerId, count: number) => void;
    judgeMan: () => void;
    shuffleDeck: (playerId: PlayerId) => void;
    returnHandToDeck: (playerId: PlayerId) => void;
    tossCoin: () => void;
    resetGame: () => void;
    loadDeckFromCode: (playerId: PlayerId, code: string) => Promise<{ success: boolean; error?: string }>;

    // Turn control
    endTurn: () => void;
    setOpponentView: (isOpponent: boolean) => void;
    setDisplayMode: (mode: 'text' | 'compact' | 'local-image') => void;
    analyzeGame: () => Promise<{ success: boolean; errorType?: string }>;
    runCoachAnalysis: () => Promise<void>;
    syncToSupabase: (userId: string, clerkToken?: string) => Promise<{ success: boolean; error?: string }>;
}
