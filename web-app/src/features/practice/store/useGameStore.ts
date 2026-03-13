import { create } from 'zustand';
import { CardInstance, DeckCard, GameState, ZoneType, PlayerId } from '@/types/game';
import { buildAIInput } from '@/lib/ai/buildAIInput';
import { supabase, createSupabaseClient } from '@/lib/supabase';
import { generateGameStatusContext } from '@/lib/ai/promptGenerator';

// Helper to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const defaultZones: Record<ZoneType, string[]> = {
    'player1-deck': [],
    'player1-hand': [],
    'player1-active': [],
    'player1-bench-1': [],
    'player1-bench-2': [],
    'player1-bench-3': [],
    'player1-bench-4': [],
    'player1-bench-5': [],
    'player1-trash': [],
    'player1-prizes': [],
    'player2-deck': [],
    'player2-hand': [],
    'player2-active': [],
    'player2-bench-1': [],
    'player2-bench-2': [],
    'player2-bench-3': [],
    'player2-bench-4': [],
    'player2-bench-5': [],
    'player2-trash': [],
    'player2-prizes': [],
    'stadium': []
};

export const useGameStore = create<GameState>((set, get) => ({
    cards: {},
    player1Deck: [],
    player2Deck: [],
    zones: { ...defaultZones },
    coinFlips: [],
    turnCount: 1,
    currentTurnPlayer: 'player1',
    isOpponentView: false,
    displayMode: 'compact',
    logs: [],
    structuredLogs: [],
    stateSnapshots: [],
    gameId: crypto.randomUUID(),
    deckHistory: [],
    isGameStarted: false,
    isAnalyzing: false,

    // Actions
    getGameState: () => get(),
    pastStates: [],
    futureStates: [],

    addLog: (message: string) => {
        set((state) => ({ logs: [...state.logs, message] }));
    },

    addStructuredLog: (logInput) => {
        set((state) => {
            const newLog = {
                ...logInput,
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                createdAt: new Date().toISOString()
            };
            return { structuredLogs: [...state.structuredLogs, newLog] };
        });
    },

    takeSnapshot: (phase: 'setup' | 'main' | 'attack' | 'end') => {
        set((state) => {
            const snapshot = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                phase,
                state: JSON.parse(JSON.stringify({
                    cards: state.cards,
                    zones: state.zones,
                    currentTurnPlayer: state.currentTurnPlayer
                })),
                createdAt: new Date().toISOString()
            };
            return { stateSnapshots: [...state.stateSnapshots, snapshot] };
        });
    },

    saveState: () => {
        set((state) => {
            const snapshot = JSON.parse(JSON.stringify({
                cards: state.cards,
                zones: state.zones,
                turnCount: state.turnCount,
                currentTurnPlayer: state.currentTurnPlayer,
                isOpponentView: state.isOpponentView,
                displayMode: state.displayMode,
                logs: state.logs,
                structuredLogs: state.structuredLogs,
                stateSnapshots: state.stateSnapshots,
                deckHistory: state.deckHistory,
                isGameStarted: state.isGameStarted,
            }));
            return {
                pastStates: [...state.pastStates, snapshot],
                futureStates: [] // Clear redo history on new action
            };
        });
    },

    pushHistory: (snapshot) => {
        set((state) => ({
            pastStates: [...state.pastStates, snapshot],
            futureStates: [] // Clear redo history
        }));
    },

    undo: () => {
        set((state) => {
            if (state.pastStates.length === 0) return state;

            const currentSnapshot = JSON.parse(JSON.stringify({
                cards: state.cards,
                zones: state.zones,
                turnCount: state.turnCount,
                currentTurnPlayer: state.currentTurnPlayer,
                isOpponentView: state.isOpponentView,
                displayMode: state.displayMode,
                logs: state.logs,
                structuredLogs: state.structuredLogs,
                stateSnapshots: state.stateSnapshots,
                deckHistory: state.deckHistory,
                isGameStarted: state.isGameStarted,
            }));

            const newPast = [...state.pastStates];
            const previousState = newPast.pop()!;

            return {
                ...previousState, // Apply previous cards, zones, turnCount, currentTurnPlayer, isOpponentView, logs
                pastStates: newPast,
                futureStates: [currentSnapshot, ...state.futureStates]
            };
        });
    },

    redo: () => {
        set((state) => {
            if (state.futureStates.length === 0) return state;

            const currentSnapshot = JSON.parse(JSON.stringify({
                cards: state.cards,
                zones: state.zones,
                turnCount: state.turnCount,
                currentTurnPlayer: state.currentTurnPlayer,
                isOpponentView: state.isOpponentView,
                displayMode: state.displayMode,
                logs: state.logs,
                structuredLogs: state.structuredLogs,
                stateSnapshots: state.stateSnapshots,
                deckHistory: state.deckHistory,
                isGameStarted: state.isGameStarted,
            }));

            const newFuture = [...state.futureStates];
            const nextState = newFuture.shift()!;

            return {
                ...nextState, // Apply next cards, zones, turnCount, currentTurnPlayer, isOpponentView, logs
                pastStates: [...state.pastStates, currentSnapshot],
                futureStates: newFuture
            };
        });
    },

    initializeDeck: (deckList1: DeckCard[], deckList2: DeckCard[]) => {
        set((state) => {
            const newCards: Record<string, CardInstance> = {};

            const createPlayerDeck = (deckList: DeckCard[], playerId: 'player1' | 'player2') => {
                const deckInstanceIds: string[] = [];
                deckList.forEach((card) => {
                    for (let i = 0; i < card.count; i++) {
                        const instanceId = `${playerId}-${card.id}-${i}-${crypto.randomUUID()}`;

                        // Feature: Detect energy symbols/types from name
                        let detectedType = card.type;
                        let detectedKinds = card.kinds;
                        if (card.name.includes('基本') && card.name.includes('エネルギー')) {
                            detectedType = 'energy';
                            if (card.name.includes('草')) detectedKinds = 'grass';
                            else if (card.name.includes('炎')) detectedKinds = 'fire';
                            else if (card.name.includes('水')) detectedKinds = 'water';
                            else if (card.name.includes('雷')) detectedKinds = 'lightning';
                            else if (card.name.includes('超')) detectedKinds = 'psychic';
                            else if (card.name.includes('闘')) detectedKinds = 'fighting';
                            else if (card.name.includes('悪')) detectedKinds = 'darkness';
                            else if (card.name.includes('鋼')) detectedKinds = 'metal';
                            else if (card.name.includes('ドラゴン')) detectedKinds = 'dragon';
                            else detectedKinds = 'colorless';
                        }

                        newCards[instanceId] = {
                            instanceId,
                            baseCardId: card.id,
                            name: card.name,
                            imageUrl: card.imageUrl,
                            type: detectedType,
                            kinds: detectedKinds,
                            damage: 0,
                            isReversed: false,
                            specialConditions: [],
                            attachedEnergyIds: [],
                            ownerId: playerId,
                            hp: card.hp,
                        };
                        deckInstanceIds.push(instanceId);
                    }
                });
                return shuffleArray(deckInstanceIds);
            };

            const shuffledDeck1 = createPlayerDeck(deckList1, 'player1');
            const hand1 = shuffledDeck1.splice(0, 7);
            const prizes1 = shuffledDeck1.splice(0, 6);

            const shuffledDeck2 = createPlayerDeck(deckList2, 'player2');
            const hand2 = shuffledDeck2.splice(0, 7);
            const prizes2 = shuffledDeck2.splice(0, 6);

            const initialLogs = [
                `準備フェーズを開始しました。`,
                `プレイヤー1: デッキ${deckList1.reduce((s, c) => s + c.count, 0)}枚`,
                `プレイヤー2: デッキ${deckList2.reduce((s, c) => s + c.count, 0)}枚`
            ];

            const deckCounts = {
                player1: deckList1.reduce((s, c) => s + c.count, 0),
                player2: deckList2.reduce((s, c) => s + c.count, 0)
            };

            const setupLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: 1,
                playerId: 'player1' as PlayerId,
                actionType: 'game_initialize',
                payload: { deckCounts },
                createdAt: new Date().toISOString()
            };

            const setupSnapshot = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: 1,
                phase: 'setup' as const,
                state: JSON.parse(JSON.stringify({
                    cards: newCards,
                    zones: {
                        ...defaultZones,
                        'player1-deck': shuffledDeck1,
                        'player1-hand': hand1,
                        'player1-prizes': prizes1,
                        'player2-deck': shuffledDeck2,
                        'player2-hand': hand2,
                        'player2-prizes': prizes2,
                    },
                    currentTurnPlayer: 'player1'
                })),
                createdAt: new Date().toISOString()
            };

            return {
                cards: newCards,
                player1Deck: deckList1,
                player2Deck: deckList2,
                gameId: crypto.randomUUID(), // New game sessions should have new IDs
                zones: {
                    ...defaultZones,
                    'player1-deck': shuffledDeck1,
                    'player1-hand': hand1,
                    'player1-prizes': prizes1,
                    'player2-deck': shuffledDeck2,
                    'player2-hand': hand2,
                    'player2-prizes': prizes2,
                },
                turnCount: 1,
                currentTurnPlayer: 'player1',
                isOpponentView: false,
                displayMode: state.displayMode,
                logs: initialLogs,
                structuredLogs: [setupLog],
                stateSnapshots: [setupSnapshot],
                deckHistory: state.deckHistory,
                isGameStarted: false,
                pastStates: [],
                futureStates: []
            };
        });
    },

    moveCard: (cardId: string, fromZone: ZoneType, toZone: ZoneType, newIndex?: number) => {
        set((state) => {
            // Don't modify if it's the exact same spot without an index change
            if (fromZone === toZone && newIndex === undefined) return state;

            const sourceArray = [...state.zones[fromZone]];
            const destArray = fromZone === toZone ? sourceArray : [...state.zones[toZone]];

            const cardIndex = sourceArray.indexOf(cardId);
            if (cardIndex === -1) return state;

            // Remove from source
            sourceArray.splice(cardIndex, 1);

            // Add to destination
            if (newIndex !== undefined) {
                destArray.splice(newIndex, 0, cardId);
            } else {
                destArray.push(cardId);
            }

            const card = state.cards[cardId];
            const logMsg = card ? `${card.name} を ${fromZone} から ${toZone} へ移動しました。` : `カードを ${fromZone} から ${toZone} へ移動しました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: state.currentTurnPlayer,
                actionType: 'move_card',
                sourceZone: fromZone,
                targetZone: toZone,
                cardInstanceId: cardId,
                baseCardId: card?.baseCardId,
                createdAt: new Date().toISOString()
            };

            return {
                zones: {
                    ...state.zones,
                    [fromZone]: sourceArray,
                    [toZone]: destArray
                },
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };
        });
    },

    updateCardState: (cardId: string, updates: Partial<Omit<CardInstance, 'instanceId' | 'baseCardId'>>) => {
        set((state) => {
            const card = state.cards[cardId];
            if (!card) return state;
            return {
                cards: {
                    ...state.cards,
                    [cardId]: { ...card, ...updates }
                }
            };
        });
    },

    attachEnergy: (energyId: string, pokemonId: string) => {
        set((state) => {
            const pokemon = state.cards[pokemonId];
            const energy = state.cards[energyId];
            if (!pokemon || pokemon.type !== 'pokemon' || !energy) return state;

            // Remove energy from its current zone
            let sourceZone: ZoneType | null = null;
            const newZones = { ...state.zones };
            for (const [zName, cardIds] of Object.entries(newZones)) {
                if (cardIds.includes(energyId)) {
                    sourceZone = zName as ZoneType;
                    newZones[sourceZone] = cardIds.filter((id) => id !== energyId);
                    break;
                }
            }

            const logMsg = `${pokemon.name} に ${energy.name} をつけました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: state.currentTurnPlayer,
                actionType: 'attach_energy',
                sourceZone: sourceZone as ZoneType,
                targetZone: `${sourceZone?.startsWith('player1') ? 'player1' : 'player2'}-active` as ZoneType, // Placeholder for logic
                cardInstanceId: energyId,
                baseCardId: energy.baseCardId,
                payload: { pokemonId },
                createdAt: new Date().toISOString()
            };

            return {
                zones: newZones,
                cards: {
                    ...state.cards,
                    [pokemonId]: {
                        ...pokemon,
                        attachedEnergyIds: [...(pokemon.attachedEnergyIds || []), energyId]
                    }
                },
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };
        });
    },

    returnHandToDeck: (playerId: PlayerId) => {
        set((state) => {
            const handZone = `${playerId}-hand` as ZoneType;
            const deckZone = `${playerId}-deck` as ZoneType;
            const handCards = [...state.zones[handZone]];
            if (handCards.length === 0) return state;

            const newDeck = [...state.zones[deckZone], ...handCards];
            const logMsg = `${playerId} の手札を山札に戻しました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: playerId,
                actionType: 'return_hand_to_deck',
                sourceZone: handZone,
                targetZone: deckZone,
                createdAt: new Date().toISOString()
            };

            return {
                zones: {
                    ...state.zones,
                    [handZone]: [],
                    [deckZone]: newDeck
                },
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };
        });
    },

    detachEnergy: (energyId: string, pokemonId: string, toZone: ZoneType) => {
        set((state) => {
            const pokemon = state.cards[pokemonId];
            const energy = state.cards[energyId];
            if (!pokemon || !energy) return state;

            const newZones = { ...state.zones };
            if (!newZones[toZone].includes(energyId)) {
                newZones[toZone] = [...newZones[toZone], energyId];
            }

            const logMsg = `${pokemon.name} から ${energy.name} を ${toZone} へトラッシュしました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: state.currentTurnPlayer,
                actionType: 'detach_energy',
                sourceZone: 'active' as any, // Simplified
                targetZone: toZone,
                cardInstanceId: energyId,
                baseCardId: energy.baseCardId,
                payload: { pokemonId },
                createdAt: new Date().toISOString()
            };

            return {
                zones: newZones,
                cards: {
                    ...state.cards,
                    [pokemonId]: {
                        ...pokemon,
                        attachedEnergyIds: (pokemon.attachedEnergyIds || []).filter(id => id !== energyId)
                    }
                },
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };
        });
    },

    drawCards: (playerId: PlayerId, count: number) => {
        set((state) => {
            const deck = [...state.zones[`${playerId}-deck` as ZoneType]];
            const hand = [...state.zones[`${playerId}-hand` as ZoneType]];

            // Draw only max available
            const actualCount = Math.min(count, deck.length);
            const drawn = deck.splice(-actualCount, actualCount).reverse();

            const logMsg = `${playerId} がカードを ${actualCount} 枚引きました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: playerId,
                actionType: 'draw_cards',
                payload: { count: actualCount },
                createdAt: new Date().toISOString()
            };

            const newState = {
                zones: {
                    ...state.zones,
                    [`${playerId}-deck`]: deck,
                    [`${playerId}-hand`]: [...hand, ...drawn]
                },
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };

            // 手札が変化したのでスナップショットを撮る
            setTimeout(() => get().takeSnapshot('main'), 0);

            return newState;
        });
    },

    discardHandAndDraw: (playerId: PlayerId, count: number) => {
        set((state) => {
            const deck = [...state.zones[`${playerId}-deck` as ZoneType]];
            const hand = [...state.zones[`${playerId}-hand` as ZoneType]];
            const trash = [...state.zones[`${playerId}-trash` as ZoneType]];

            // Move hand to trash
            const newTrash = [...trash, ...hand];

            // Draw up to count from what's left
            const actualCount = Math.min(count, deck.length);
            const drawn = deck.splice(-actualCount, actualCount).reverse();

            const logMsg = `${playerId} が手札をトラッシュし、${actualCount} 枚引きました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: playerId,
                actionType: 'discard_hand_and_draw',
                payload: { count: actualCount, discardedCount: hand.length },
                createdAt: new Date().toISOString()
            };

            return {
                zones: {
                    ...state.zones,
                    [`${playerId}-deck`]: deck,
                    [`${playerId}-hand`]: drawn,
                    [`${playerId}-trash`]: newTrash
                },
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };
        });
    },

    shuffleHandAndDraw: (playerId: PlayerId, count: number) => {
        set((state) => {
            const deck = [...state.zones[`${playerId}-deck` as ZoneType]];
            const hand = [...state.zones[`${playerId}-hand` as ZoneType]];

            // Move hand to deck
            const combinedDeck = [...deck, ...hand];

            // Shuffle
            const shuffledDeck = shuffleArray(combinedDeck);

            // Draw up to count
            const actualCount = Math.min(count, shuffledDeck.length);
            const drawn = shuffledDeck.splice(-actualCount, actualCount).reverse();

            const logMsg = `${playerId} が手札を山札に戻して混ぜ、${actualCount} 枚引きました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: playerId,
                actionType: 'shuffle_hand_and_draw',
                payload: { count: actualCount, shuffledCount: hand.length },
                createdAt: new Date().toISOString()
            };

            return {
                zones: {
                    ...state.zones,
                    [`${playerId}-deck`]: shuffledDeck,
                    [`${playerId}-hand`]: drawn
                },
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };
        });
    },

    judgeMan: () => {
        set((state) => {
            const nextZones = { ...state.zones };

            // Player 1
            const deck1 = [...nextZones['player1-deck']];
            const hand1 = [...nextZones['player1-hand']];
            const combined1 = [...deck1, ...hand1];
            const shuffled1 = shuffleArray(combined1);
            const drawCount1 = Math.min(4, shuffled1.length);
            const drawn1 = shuffled1.splice(-drawCount1, drawCount1).reverse();
            nextZones['player1-deck'] = shuffled1;
            nextZones['player1-hand'] = drawn1;

            // Player 2
            const deck2 = [...nextZones['player2-deck']];
            const hand2 = [...nextZones['player2-hand']];
            const combined2 = [...deck2, ...hand2];
            const shuffled2 = shuffleArray(combined2);
            const drawCount2 = Math.min(4, shuffled2.length);
            const drawn2 = shuffled2.splice(-drawCount2, drawCount2).reverse();
            nextZones['player2-deck'] = shuffled2;
            nextZones['player2-hand'] = drawn2;

            const logMsg = `ジャッジマン: お互いの手札を山札に戻して混ぜ、それぞれ4枚引きました。`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: state.currentTurnPlayer,
                actionType: 'judge_man',
                payload: { drawCount1, drawCount2 },
                createdAt: new Date().toISOString()
            };

            return {
                zones: nextZones,
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog]
            };
        });
    },

    shuffleDeck: (playerId: PlayerId) => {
        set((state) => {
            const deck = [...state.zones[`${playerId}-deck` as ZoneType]];
            const logMsg = `${playerId} が山札を混ぜました。`;
            return {
                zones: {
                    ...state.zones,
                    [`${playerId}-deck`]: shuffleArray(deck)
                },
                logs: [...state.logs, logMsg]
            };
        });
    },

    tossCoin: () => {
        set((state) => {
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const logMsg = `コイントス: ${result === 'heads' ? 'オモテ' : 'ウラ'}`;
            return {
                coinFlips: [...state.coinFlips, result],
                logs: [...state.logs, logMsg]
            };
        });
    },

    startGame: () => {
        set((state) => ({
            isGameStarted: true,
            logs: [...state.logs, "バトルを開始しました！ プレイヤー1のターン1です。"]
        }));
    },

    resetGame: () => {
        set({
            cards: {},
            zones: { ...defaultZones },
            coinFlips: [],
            turnCount: 1,
            currentTurnPlayer: 'player1',
            isOpponentView: false,
            displayMode: 'compact',
            logs: ['ゲームをリセットしました。'],
            structuredLogs: [],
            stateSnapshots: [],
            gameId: crypto.randomUUID(),
            deckHistory: get().deckHistory,
            isGameStarted: false,
            pastStates: [],
            futureStates: []
        });
    },

    endTurn: () => {
        set((state) => {
            const nextPlayer = state.currentTurnPlayer === 'player1' ? 'player2' : 'player1';
            const nextTurnCount = state.currentTurnPlayer === 'player2' ? state.turnCount + 1 : state.turnCount;

            const logMsg = `ターン終了: Player ${nextPlayer} の番です (Turn ${nextTurnCount})`;

            const structuredLog = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                playerId: state.currentTurnPlayer,
                actionType: 'end_turn',
                payload: { nextPlayer, nextTurnCount },
                createdAt: new Date().toISOString()
            };

            const aiSnapshot = {
                id: crypto.randomUUID(),
                gameId: state.gameId,
                turn: state.turnCount,
                phase: 'end' as const,
                state: JSON.parse(JSON.stringify({
                    cards: state.cards,
                    zones: state.zones,
                    currentTurnPlayer: state.currentTurnPlayer
                })),
                createdAt: new Date().toISOString()
            };

            const snapshot = JSON.parse(JSON.stringify({
                cards: state.cards,
                zones: state.zones,
                turnCount: state.turnCount,
                currentTurnPlayer: state.currentTurnPlayer,
                isOpponentView: state.isOpponentView,
                displayMode: state.displayMode,
                logs: state.logs,
                structuredLogs: state.structuredLogs,
                stateSnapshots: state.stateSnapshots,
                deckHistory: state.deckHistory,
                isGameStarted: state.isGameStarted,
            }));

            return {
                currentTurnPlayer: nextPlayer,
                turnCount: nextTurnCount,
                isOpponentView: nextPlayer === 'player2',
                pastStates: [...state.pastStates, snapshot],
                futureStates: [],
                logs: [...state.logs, logMsg],
                structuredLogs: [...state.structuredLogs, structuredLog],
                stateSnapshots: [...state.stateSnapshots, aiSnapshot]
            };
        });
    },

    setOpponentView: (isOpponent: boolean) => {
        set((state) => {
            const snapshot = JSON.parse(JSON.stringify({
                cards: state.cards,
                zones: state.zones,
                turnCount: state.turnCount,
                currentTurnPlayer: state.currentTurnPlayer,
                isOpponentView: state.isOpponentView,
                displayMode: state.displayMode,
                logs: state.logs,
                structuredLogs: state.structuredLogs,
                stateSnapshots: state.stateSnapshots,
                deckHistory: state.deckHistory,
                isGameStarted: state.isGameStarted,
            }));

            return {
                isOpponentView: isOpponent,
                pastStates: [...state.pastStates, snapshot],
                futureStates: []
            };
        });
    },

    loadDeckFromCode: async (playerId: PlayerId, code: string) => {
        try {
            const res = await fetch(`/api/deck?code=${code}`);
            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || '不明なエラーが発生しました' };
            }

            const deckList: DeckCard[] = data.cards;

            if (playerId === 'player1') {
                set((state) => {
                    const newHistory = [code, ...state.deckHistory.filter(c => c !== code)].slice(0, 4);
                    return { player1Deck: deckList, deckHistory: newHistory };
                });
            } else {
                set((state) => {
                    const newHistory = [code, ...state.deckHistory.filter(c => c !== code)].slice(0, 4);
                    return { player2Deck: deckList, deckHistory: newHistory };
                });
            }

            return { success: true, count: deckList.reduce((sum, card) => sum + card.count, 0) };
        } catch (e) {
            console.error('Failed to load deck:', e);
            return { success: false, error: 'サーバーとの通信に失敗しました' };
        }
    },

    setDisplayMode: (mode: 'text' | 'compact' | 'local-image') => {
        set({ displayMode: mode });
    },

    analyzeGame: async () => {
        const state = get();
        const playerId = state.currentTurnPlayer;
        const hand = state.zones[`${playerId}-hand` as ZoneType];

        const handCards = hand.map(id => state.cards[id]);
        const pokemonCount = handCards.filter(c => c?.type === 'pokemon').length;
        const energyCount = handCards.filter(c => c?.type === 'energy').length;
        const supporterCount = handCards.filter(c => c?.kinds === 'supporter').length;

        let accidentRate = 0;
        let setupRate = 50;
        let recommendedAction = "AI分析中...";
        let description = "AIが盤面を読み解いています。少々お待ちください。";

        // 初手の簡易的な事故率計算（ローカルロジック）
        if (hand.length > 0) {
            if (pokemonCount === 0) {
                accidentRate = 90;
                recommendedAction = "たねポケモンを探す";
            } else if (energyCount === 0 && supporterCount === 0) {
                accidentRate = 75;
                recommendedAction = "ドローソースを確保する";
            } else if (energyCount > 0 && supporterCount > 0) {
                setupRate = 90;
            }
        }

        // 初期状態で一旦set（ローディング表示のため）
        set({
            isAnalyzing: true,
            aiAnalysis: { accidentRate, setupRate, recommendedAction, description }
        });

        try {
            // プロンプト生成
            const prompt = generateGameStatusContext(state);

            // デバイスフィンガープリント＆ローカルストレージIDの取得（不正利用対策）
            let fingerprintId = 'unknown';
            try {
                const fpPromise = import('@fingerprintjs/fingerprintjs').then(FingerprintJS => FingerprintJS.load());
                const fp = await fpPromise;
                const result = await fp.get();
                fingerprintId = result.visitorId;
            } catch (e) {
                console.warn('Failed to load fingerprintjs', e);
            }

            const localStorageId = typeof window !== 'undefined' ? (
                localStorage.getItem('guest_ai_id') ||
                (() => {
                    const newId = 'ls_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                    localStorage.setItem('guest_ai_id', newId);
                    return newId;
                })()
            ) : 'unknown';

            // API呼び出し (盤面データとメタデータを送信)
            const response = await fetch('/api/ai/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    boardState: buildAIInput(state), // 正規化された盤面データ
                    turnCount: state.turnCount,
                    gameId: state.gameId,
                    userId: 'user_dummy', // サーバー側でClerkから取得するためダミーでOK
                    fingerprintId,
                    localStorageId
                }),
            });

            const data = await response.json();

            if (data.error) {
                // Return structured error so UI knows if it needs to empty tickets
                throw { message: data.details || data.error, type: data.error };
            }

            set({
                isAnalyzing: false,
                aiAnalysis: {
                    accidentRate,
                    setupRate,
                    recommendedAction: "AIコーチのアドバイス",
                    description: data.analysis
                }
            });

            // 分析履歴保存（スナップショット）
            get().takeSnapshot('main');
            return { success: true };

        } catch (error: any) {
            console.error('AI Analysis Failed:', error);
            set({
                isAnalyzing: false,
                aiAnalysis: {
                    accidentRate,
                    setupRate,
                    recommendedAction: "分析エラー",
                    description: error.message || "AIとの通信に失敗しました。APIキーの設定を確認してください。"
                }
            });
            return { success: false, errorType: error.type || 'UNKNOWN' };
        }
    },

    syncToSupabase: async (userId: string, clerkToken?: string) => {
        const state = get();

        // 認証済みクライアントまたはデフォルトクライアントを使用
        const client = clerkToken ? createSupabaseClient(clerkToken) : supabase;
        if (!client) return { success: false, error: 'Supabase client not initialized' };

        try {
            // 1. セッション情報の保存
            const { error: sessionError } = await client
                .from('game_sessions')
                .upsert({
                    game_id: state.gameId,
                    user_id: userId,
                    deck_history: state.deckHistory,
                    created_at: new Date().toISOString() // 本来はセッション開始時が良いが簡易化
                }, { onConflict: 'game_id' });

            if (sessionError) throw sessionError;

            // 実際のDB側のID（UUID）を取得するために一度selectが必要な場合があるが
            // 今回はgameIdをキーに紐付ける設計にするか、
            // スキーマ側でsession_idをgameId(text)として持たせるのが楽かもしれない。
            // ここでは実装の簡略化のため、game_idをキーとしてそのまま使う想定（スキーマ調整が必要）

            // 2. ログの保存
            if (state.structuredLogs.length > 0) {
                const { error: logError } = await client
                    .from('game_logs')
                    .upsert(state.structuredLogs.map(log => ({
                        id: log.id,
                        game_id: state.gameId,
                        turn: log.turn,
                        player_id: log.playerId,
                        action_type: log.actionType,
                        payload: log.payload,
                        created_at: log.createdAt
                    })));
                if (logError) throw logError;
            }

            // 3. スナップショットの保存
            if (state.stateSnapshots.length > 0) {
                const { error: snapshotError } = await client
                    .from('game_snapshots')
                    .upsert(state.stateSnapshots.map(snap => ({
                        id: snap.id,
                        game_id: state.gameId,
                        turn: snap.turn,
                        phase: snap.phase,
                        state: snap.state,
                        created_at: snap.createdAt
                    })));
                if (snapshotError) throw snapshotError;
            }

            return { success: true };
        } catch (error: any) {
            console.error('Supabase Sync Error:', error);
            return { success: false, error: error.message };
        }
    }
}));
