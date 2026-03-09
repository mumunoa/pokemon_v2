import { create } from 'zustand';
import { CardInstance, DeckCard, GameState, ZoneType, PlayerId } from '@/types/game';

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
    deckHistory: [],
    isGameStarted: false,
    pastStates: [],
    futureStates: [],

    addLog: (message: string) => {
        set((state) => ({ logs: [...state.logs, message] }));
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

            return {
                cards: newCards,
                player1Deck: deckList1,
                player2Deck: deckList2,
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

            return {
                zones: {
                    ...state.zones,
                    [fromZone]: sourceArray,
                    [toZone]: destArray
                },
                logs: [...state.logs, logMsg]
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

            return {
                zones: newZones,
                cards: {
                    ...state.cards,
                    [pokemonId]: {
                        ...pokemon,
                        attachedEnergyIds: [...(pokemon.attachedEnergyIds || []), energyId]
                    }
                },
                logs: [...state.logs, logMsg]
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

            return {
                zones: {
                    ...state.zones,
                    [handZone]: [],
                    [deckZone]: newDeck
                },
                logs: [...state.logs, logMsg]
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

            return {
                zones: newZones,
                cards: {
                    ...state.cards,
                    [pokemonId]: {
                        ...pokemon,
                        attachedEnergyIds: (pokemon.attachedEnergyIds || []).filter(id => id !== energyId)
                    }
                },
                logs: [...state.logs, logMsg]
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

            return {
                zones: {
                    ...state.zones,
                    [`${playerId}-deck`]: deck,
                    [`${playerId}-hand`]: [...hand, ...drawn]
                },
                logs: [...state.logs, logMsg]
            };
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

            return {
                zones: {
                    ...state.zones,
                    [`${playerId}-deck`]: deck,
                    [`${playerId}-hand`]: drawn,
                    [`${playerId}-trash`]: newTrash
                },
                logs: [...state.logs, logMsg]
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

            return {
                zones: {
                    ...state.zones,
                    [`${playerId}-deck`]: shuffledDeck,
                    [`${playerId}-hand`]: drawn
                },
                logs: [...state.logs, logMsg]
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

            return {
                zones: nextZones,
                logs: [...state.logs, logMsg]
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

            // Snapshot for history
            const snapshot = JSON.parse(JSON.stringify({
                cards: state.cards,
                zones: state.zones,
                turnCount: state.turnCount,
                currentTurnPlayer: state.currentTurnPlayer,
                isOpponentView: state.isOpponentView,
                displayMode: state.displayMode,
                logs: state.logs,
                deckHistory: state.deckHistory,
                isGameStarted: state.isGameStarted,
            }));

            return {
                currentTurnPlayer: nextPlayer,
                turnCount: nextTurnCount,
                isOpponentView: nextPlayer === 'player2',
                pastStates: [...state.pastStates, snapshot],
                futureStates: [],
                logs: [...state.logs, logMsg]
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
    }
}));
