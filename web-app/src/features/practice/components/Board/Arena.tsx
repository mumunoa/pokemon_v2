'use client';

import React, { useEffect, useState } from 'react';
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragCancelEvent
} from '@dnd-kit/core';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { ZoneType, CardInstance, DeckCard, PlayerId } from '@/types/game';
import { Zone } from './Zone';
import { Card } from './Card';
import { CardActionModal } from './CardActionModal';
import { ZonePopupModal, PopupState } from './ZonePopupModal';
import { AnalysisOverlay } from '../Modals/AnalysisOverlay';
import { TicketLimitModal } from '../Modals/TicketLimitModal';
import { UserButton, SignInButton } from "@clerk/nextjs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/lib/supabase';

// Temporary Mock Data for Testing
const sampleDeck: DeckCard[] = [
    { id: '1', name: 'ピカチュウex', imageUrl: 'none', count: 4, type: 'pokemon', kinds: 'has_rule', hp: 200 },
    { id: '2', name: '基本雷エネルギー', imageUrl: 'none', count: 10, type: 'energy', kinds: 'lightning' },
    { id: '3', name: 'ハイパーボール', imageUrl: 'none', count: 4, type: 'trainer', kinds: 'item' },
    { id: '4', name: 'でんきだま', imageUrl: 'none', count: 2, type: 'trainer', kinds: 'tool' },
    { id: '5', name: 'スパイクタウンジム', imageUrl: 'none', count: 1, type: 'trainer', kinds: 'stadium' },
];

export const Arena: React.FC = () => {
    const {
        cards, zones, turnCount, currentTurnPlayer, isOpponentView,
        isGameStarted, startGame,
        endTurn, setOpponentView, initializeDeck, moveCard, attachEnergy, detachEnergy, drawCards, shuffleDeck, tossCoin, coinFlips,
        aiAnalysis, isAnalyzing, analyzeGame, syncToSupabase
    } = useGameStore();

    // カスタムフックを使用してClerkの状態を安全に取得
    const { user, isSignedIn, getToken } = useAuth();
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const isClerkEnabled = clerkKey && clerkKey.startsWith('pk_');

    const operatingPlayer = isOpponentView ? 'player2' : 'player1';
    const isTurnActive = operatingPlayer === currentTurnPlayer;

    const dragStartSnapshotRef = React.useRef<{
        cards: Record<string, CardInstance>;
        zones: Record<ZoneType, string[]>;
        turnCount: number;
        currentTurnPlayer: PlayerId;
        isOpponentView: boolean;
        logs: string[];
    } | null>(null);

    const handleFeedback = async (rating: 'good' | 'bad') => {
        const state = useGameStore.getState();
        try {
            const response = await fetch('/api/ai/coach/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: rating,
                    gameId: state.gameId,
                    turnCount: state.turnCount
                }),
            });
            const data = await response.json();
            if (data.success) {
                // 成功したらボタンを消すか、メッセージを出す（今回は簡易的にログのみ）
                console.log('Feedback submitted:', rating);
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
    };
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
    const [popupState, setPopupState] = useState<PopupState>(null);
    const [isModalDragging, setIsModalDragging] = useState(false);
    const [isCoinFlipping, setIsCoinFlipping] = useState(false);
    const [lastCoinResult, setLastCoinResult] = useState<'heads' | 'tails' | null>(null);
    const [escapePlayerId, setEscapePlayerId] = useState<PlayerId | null>(null);
    const [isDrawing, setIsDrawing] = useState<PlayerId | 'both' | null>(null);
    const [isReturning, setIsReturning] = useState<PlayerId | 'both' | null>(null);
    const [isShuffling, setIsShuffling] = useState<PlayerId | 'both' | null>(null);
    const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
    const [isEndTurnModalOpen, setIsEndTurnModalOpen] = useState(false);
    const [isStartGameModalOpen, setIsStartGameModalOpen] = useState(false);
    const [isToolbarOpen, setIsToolbarOpen] = useState(true);
    const [isAiAnalysisModalOpen, setIsAiAnalysisModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [tickets, setTickets] = useState<number | null>(null);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        if (isClerkEnabled && isSignedIn && user) {
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (data && data.ai_tickets !== undefined) {
                        setTickets(data.ai_tickets);
                        const trialUntil = data.pro_trial_until ? new Date(data.pro_trial_until) : null;
                        setIsPro(trialUntil !== null && trialUntil > new Date());
                    }
                })
                .catch(err => console.error('Failed to fetch profile', err));
        }
    }, [isClerkEnabled, isSignedIn, user]);

    // 初期起動時、カードが1枚もない場合にサンプルデータを投入
    useEffect(() => {
        if (Object.keys(cards).length === 0) {
            initializeDeck(sampleDeck, sampleDeck);
        }
    }, [cards, initializeDeck]);

    const handleAnalyzeGame = async () => {
        if (!isClerkEnabled || !isSignedIn) {
            // ローカルモードまたは未ログイン時はデモ用に通すかログインを促す
            alert("AI分析の利用にはログインが必要です。（デモ環境ではそのまま実行します）");
        } else if (!isPro && tickets !== null && tickets <= 0) {
            setIsTicketModalOpen(true);
            return;
        }

        analyzeGame();
        setIsAiAnalysisModalOpen(true);

        if (isClerkEnabled && isSignedIn && user) {
            try {
                const token = await getToken({ template: 'supabase' });
                if (token) {
                    syncToSupabase(user.id, token);
                }

                // Optimistic UI update
                if (!isPro && tickets !== null && tickets > 0) {
                    setTickets(tickets - 1);
                }
            } catch (e) {
                console.error('Failed to get Supabase token:', e);
            }
        }
    };

    const handleConfirmEndTurn = async () => {
        setIsEndTurnModalOpen(false);
        endTurn();

        // Sync to Supabase
        if (isClerkEnabled && isSignedIn && user) {
            try {
                const token = await getToken({ template: 'supabase' });
                if (token) {
                    syncToSupabase(user.id, token);
                }
            } catch (e) {
                console.error('Failed to get Supabase token:', e);
            }
        }

        // Auto-draw 1 card at the start of the next turn
        setTimeout(() => {
            const nextPlayer = useGameStore.getState().currentTurnPlayer;
            handleDraw1(nextPlayer);
        }, 300);
    };

    const handleConfirmStartGame = async () => {
        setIsStartGameModalOpen(false);
        startGame();

        // Sync to Supabase
        if (isClerkEnabled && isSignedIn && user) {
            try {
                const token = await getToken({ template: 'supabase' });
                if (token) {
                    syncToSupabase(user.id, token);
                }
            } catch (e) {
                console.error('Failed to get Supabase token:', e);
            }
        }

        // Initial draw for turn 1
        handleDraw1('player1');
    };

    const handleDraw1 = (playerId: PlayerId) => {
        if (zones[`${playerId}-deck`].length === 0) return;
        useGameStore.getState().saveState();
        setIsDrawing(playerId);
        setTimeout(() => {
            drawCards(playerId, 1);
            setIsDrawing(null);
        }, 500); // Increased animation duration for better visibility
    };

    const handleProfResearch = (playerId: PlayerId) => {
        useGameStore.getState().saveState();
        setIsDrawing(playerId); // Re-using draw animation for visual feedback
        setTimeout(() => {
            useGameStore.getState().discardHandAndDraw(playerId, 7);
            setIsDrawing(null);
        }, 500);
    };

    const handleJudge = (playerId: PlayerId) => {
        const store = useGameStore.getState();
        store.saveState();

        // 1. Return all cards to deck
        setIsReturning('both');
        setTimeout(() => {
            store.returnHandToDeck('player1');
            store.returnHandToDeck('player2');
            setIsReturning(null);

            // 2. Shuffle animation
            setIsShuffling('both');
            setTimeout(() => {
                store.shuffleDeck('player1');
                store.shuffleDeck('player2');
                setIsShuffling(null);

                // 3. Draw 4 cards animation
                setIsDrawing('both');
                setTimeout(() => {
                    store.drawCards('player1', 4);
                    store.drawCards('player2', 4);
                    setIsDrawing(null);
                }, 500);
            }, 800);
        }, 500);
    };

    const handleReturnToDeck = (playerId: PlayerId) => {
        useGameStore.getState().saveState();
        useGameStore.getState().returnHandToDeck(playerId);
        handleShuffleAnimation(playerId);
    };

    const handleUndo = () => {
        useGameStore.getState().undo();
    };

    const handleRedo = () => {
        useGameStore.getState().redo();
    };

    const handleShuffleAnimation = (playerId: PlayerId) => {
        if (zones[`${playerId}-deck`].length === 0) return;
        setIsShuffling(playerId);
        setTimeout(() => {
            shuffleDeck(playerId);
            setIsShuffling(null);
        }, 400); // 400ms animation
    };

    const [transferSnapshot, setTransferSnapshot] = useState<{
        sourcePokemonId: string;
        targetPokemonId: string;
        energies: string[];
        damage: number;
        specialConditions: string[];
        hasUsedAbility: boolean;
    } | null>(null);

    // Initialize deck once for testing if empty
    useEffect(() => {
        if (Object.keys(cards).length === 0) {
            initializeDeck(sampleDeck, sampleDeck);
        }
    }, [cards, initializeDeck]);

    // Configure sensors for both mouse and touch
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150, // Slightly longer delay to definitely distinguish tap from drag
                tolerance: 10, // Larger tolerance for shaky thumbs
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        dragStartSnapshotRef.current = JSON.parse(JSON.stringify({
            cards: useGameStore.getState().cards,
            zones: useGameStore.getState().zones,
            turnCount: useGameStore.getState().turnCount,
            currentTurnPlayer: useGameStore.getState().currentTurnPlayer,
            isOpponentView: useGameStore.getState().isOpponentView,
            logs: useGameStore.getState().logs,
        }));

        const activeIdStr = event.active.id as string;
        setActiveId(activeIdStr);
        setSelectedCard(null); // Close action modal when dragging starts
        if (popupState) {
            setIsModalDragging(true); // Hide the popup visually without unmounting so drag continues
        }

        // Find if this card has a tool attached (in the same zone, kind == 'tool')
        let draggedZoneInfo: ZoneType | null = null;
        for (const [zName, cardIds] of Object.entries(zones)) {
            if (cardIds.includes(activeIdStr)) {
                draggedZoneInfo = zName as ZoneType;
                break;
            }
        }
        const isFieldZone = draggedZoneInfo === 'player1-active' || draggedZoneInfo?.startsWith('player1-bench');
        if (isFieldZone && cards[activeIdStr]?.type === 'pokemon') {
            const index = zones[draggedZoneInfo!].indexOf(activeIdStr);
            // Tool is placed at the bottom (index 0). The pokemon immediately above it is at index 1.
            // If dragging the topmost stage 2 pokemon (index 2), index-1 is a Pokemon, not a Tool, so it won't be dragged.
            if (index > 0) {
                const prevCardId = zones[draggedZoneInfo!][index - 1];
                if (prevCardId && cards[prevCardId]?.kinds === 'tool') {
                    setDraggedToolId(prevCardId);
                }
            }
        }

        // Feature: Peel top Pokemon, leaving energy/damage on the bottom Pokemon
        const targetCard = cards[activeIdStr];
        const hasAttachments = (targetCard?.attachedEnergyIds?.length > 0) ||
            (targetCard?.damage > 0) ||
            (targetCard?.specialConditions?.length > 0) ||
            targetCard?.hasUsedAbility;

        if (targetCard?.type === 'pokemon' && hasAttachments) {
            let sourceZone: ZoneType | null = null;
            let cardIndex = -1;
            for (const [zName, cardIds] of Object.entries(zones)) {
                if (cardIds.includes(activeIdStr)) {
                    sourceZone = zName as ZoneType;
                    cardIndex = cardIds.indexOf(activeIdStr);
                    break;
                }
            }

            if (sourceZone && (sourceZone.startsWith('player1-bench') || sourceZone === 'player1-active')) {
                // Find a pokemon below it in the same zone
                const belowCards = zones[sourceZone].slice(0, cardIndex);
                const bottomPokemonId = [...belowCards].reverse().find(id => cards[id]?.type === 'pokemon');

                if (bottomPokemonId) {
                    const energies = [...targetCard.attachedEnergyIds];
                    const damage = targetCard.damage || 0;
                    const specialConditions = [...(targetCard.specialConditions || [])];
                    const hasUsedAbility = targetCard.hasUsedAbility || false;

                    // Snapshot for rollback
                    setTransferSnapshot({
                        sourcePokemonId: activeIdStr,
                        targetPokemonId: bottomPokemonId,
                        energies,
                        damage,
                        specialConditions,
                        hasUsedAbility
                    });

                    // Transfer eagerly via store
                    useGameStore.getState().updateCardState(activeIdStr, { attachedEnergyIds: [], damage: 0, specialConditions: [], hasUsedAbility: false });

                    const currentBottomEnergies = cards[bottomPokemonId].attachedEnergyIds || [];
                    useGameStore.getState().updateCardState(bottomPokemonId, {
                        attachedEnergyIds: [...currentBottomEnergies, ...energies],
                        damage,
                        specialConditions,
                        hasUsedAbility
                    });
                }
            }
        }
    };

    const handleDragCancel = (event: DragCancelEvent | { active: any }) => {
        if (transferSnapshot) {
            const { sourcePokemonId, targetPokemonId, energies, damage, specialConditions, hasUsedAbility } = transferSnapshot;
            const targetCurrentEnergies = cards[targetPokemonId]?.attachedEnergyIds || [];

            // Revert on target (bottom pokemon)
            useGameStore.getState().updateCardState(targetPokemonId, {
                attachedEnergyIds: targetCurrentEnergies.filter(e => !energies.includes(e)),
                damage: 0,
                specialConditions: [],
                hasUsedAbility: false
            });

            // Revert on source (top pokemon)
            const sourceCurrentEnergies = cards[sourcePokemonId]?.attachedEnergyIds || [];
            useGameStore.getState().updateCardState(sourcePokemonId, {
                attachedEnergyIds: [...sourceCurrentEnergies, ...energies],
                damage,
                specialConditions,
                hasUsedAbility
            });
            setTransferSnapshot(null);
        }

        if (isModalDragging) {
            setIsModalDragging(false);
            // On cancel, restore popup visibility
        }
        setActiveId(null);
        setDraggedToolId(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        let isValidDrop = false;

        if (over && active.id !== over.id) {
            const cardId = active.id as string;
            const draggedCard = cards[cardId];
            const targetZone = over.id as ZoneType;
            const targetCard = cards[over.id as string];

            // Calculate sourceZone early 
            let sourceZone: ZoneType | null = null;
            for (const [zoneName, cardIds] of Object.entries(zones)) {
                if (cardIds.includes(cardId)) {
                    sourceZone = zoneName as ZoneType;
                    break;
                }
            }

            // --- Drag Restraints ---
            const operatingPlayer = useGameStore.getState().isOpponentView ? 'player2' : 'player1';
            const opponentPrefix = operatingPlayer === 'player1' ? 'player2-' : 'player1-';

            let finalTargetZone = targetZone;
            if (cards[targetZone]) {
                for (const [zName, cIds] of Object.entries(zones)) {
                    if (cIds.includes(targetZone)) {
                        finalTargetZone = zName as ZoneType;
                        break;
                    }
                }
            }

            if (sourceZone?.startsWith(`${operatingPlayer}-`) && finalTargetZone.startsWith(opponentPrefix)) {
                // Cannot place possessed cards onto the opponent's field
                handleDragCancel(event);
                return;
            }

            // Feature: Find where energy was attached previously to remove it if moved
            let energySourcePokemonId: string | null = null;
            if (draggedCard?.type === 'energy') {
                for (const pCard of Object.values(cards)) {
                    if (pCard.attachedEnergyIds?.includes(cardId)) {
                        energySourcePokemonId = pCard.instanceId;
                        break;
                    }
                }
            }

            // 1. Dropped on a Pokemon (Attach Energy, Evolve, Tool)
            if (targetCard && targetCard.type === 'pokemon') {
                const isTargetInHand = zones['player1-hand'].includes(targetCard.instanceId);

                if (!isTargetInHand) {
                    if (draggedCard && draggedCard.type === 'energy') {
                        if (energySourcePokemonId !== targetCard.instanceId) {
                            if (energySourcePokemonId) {
                                useGameStore.getState().updateCardState(energySourcePokemonId, {
                                    attachedEnergyIds: cards[energySourcePokemonId].attachedEnergyIds.filter(id => id !== cardId)
                                });
                            }
                            attachEnergy(cardId, targetCard.instanceId);
                        }
                        isValidDrop = true;
                    }
                    else if (draggedCard && draggedCard.type === 'pokemon') {
                        // Evolution Stacking: Transfer attached Energy & Damage to new top Pokemon. Clear status/ability.
                        const updates: Partial<CardInstance> = {};
                        if (targetCard.attachedEnergyIds && targetCard.attachedEnergyIds.length > 0) {
                            updates.attachedEnergyIds = [...targetCard.attachedEnergyIds];
                            useGameStore.getState().updateCardState(targetCard.instanceId, { attachedEnergyIds: [] });
                        }
                        if (targetCard.damage && targetCard.damage > 0) {
                            updates.damage = targetCard.damage;
                            useGameStore.getState().updateCardState(targetCard.instanceId, { damage: 0 });
                        }

                        // Clear special conditions and ability for the new top Pokemon (just in case), and also for the target/bottom Pokemon
                        updates.specialConditions = [];
                        updates.hasUsedAbility = false;

                        // Clear from the bottom Pokemon explicitly
                        useGameStore.getState().updateCardState(targetCard.instanceId, { specialConditions: [], hasUsedAbility: false });

                        if (Object.keys(updates).length > 0) {
                            useGameStore.getState().updateCardState(cardId, updates);
                        }

                        if (sourceZone) {
                            moveCard(cardId, sourceZone, targetZone);
                            if (draggedToolId) {
                                // Put tool at the bottom of the new zone
                                moveCard(draggedToolId, sourceZone, targetZone, 0);
                            }
                        }
                        isValidDrop = true;
                    }
                    else if (draggedCard && draggedCard.type === 'trainer' && draggedCard.kinds === 'tool') {
                        // Tool Stacking at bottom
                        let targetZoneForTool: ZoneType | null = null;
                        for (const [zName, cardIds] of Object.entries(zones)) {
                            if (cardIds.includes(targetCard.instanceId)) {
                                targetZoneForTool = zName as ZoneType;
                                break;
                            }
                        }

                        if (sourceZone && targetZoneForTool) {
                            moveCard(cardId, sourceZone, targetZoneForTool, 0);
                            isValidDrop = true;
                        } else {
                            isValidDrop = false;
                        }
                    }
                    else if (targetCard.instanceId && sourceZone) {
                        // Check if dropping onto a card in hand
                        let cardZone: string | null = null;
                        for (const [zName, cardIds] of Object.entries(zones)) {
                            if (cardIds.includes(targetCard.instanceId)) {
                                cardZone = zName;
                                break;
                            }
                        }
                        if (cardZone && (cardZone === 'player1-hand' || cardZone === 'player2-hand')) {
                            moveCard(cardId, sourceZone, cardZone as ZoneType);
                            isValidDrop = true;
                        } else {
                            isValidDrop = false;
                        }
                    }
                    else {
                        isValidDrop = false;
                    }
                } else {
                    isValidDrop = false;
                }
            }
            // 2. Dropped on a Zone (or a Card which we resolve to its Zone)
            else if (Object.keys(zones).includes(finalTargetZone)) {
                if (finalTargetZone === sourceZone && (finalTargetZone.startsWith('player1-bench') || finalTargetZone === 'player1-active')) {
                    isValidDrop = false; // Cannot re-order field slots manually just by dropping on itself. Protects active/bench self-drops.
                } else if (finalTargetZone === 'stadium') {
                    if (draggedCard.kinds !== 'stadium') {
                        isValidDrop = false; // Only stadium cards can be placed in the stadium zone
                    } else if (sourceZone !== 'stadium') {
                        // Trashing the old stadium
                        const currentStadiumId = zones.stadium[0];
                        if (currentStadiumId) {
                            const currentOwner = cards[currentStadiumId]?.ownerId || 'player1';
                            moveCard(currentStadiumId, 'stadium', `${currentOwner}-trash` as ZoneType);
                        }
                        if (sourceZone) {
                            moveCard(cardId, sourceZone, finalTargetZone);
                        }
                        isValidDrop = true;
                    } else {
                        isValidDrop = false;
                    }
                } else {
                    // Feature: Drop Constraints
                    const isFieldSlot = finalTargetZone.startsWith('player1-bench') || finalTargetZone === 'player1-active';
                    const isEmptyFieldSlot = isFieldSlot && zones[finalTargetZone].length === 0;

                    // Handle return to Hand or Deck or Trash or Prizes for resetting equipped cards and statuses
                    if (['player1-hand', 'player1-deck', 'player1-trash', 'player1-prizes'].includes(finalTargetZone) && draggedCard.type === 'pokemon') {
                        if (draggedCard.attachedEnergyIds && draggedCard.attachedEnergyIds.length > 0) {
                            const energies = [...draggedCard.attachedEnergyIds];
                            useGameStore.getState().updateCardState(cardId, { attachedEnergyIds: [] });
                            energies.forEach(eid => {
                                detachEnergy(eid, cardId, finalTargetZone);
                                useGameStore.getState().updateCardState(eid, { isReversed: false });
                            });
                        }
                        useGameStore.getState().updateCardState(cardId, {
                            damage: 0,
                            specialConditions: [],
                            hasUsedAbility: false
                        });
                    }

                    // Restrict dropping non-Pokemon onto empty Active/Bench slots
                    if (isEmptyFieldSlot && draggedCard.type !== 'pokemon') {
                        // Invalid Drop: Treat exactly like a cancel
                        isValidDrop = false;
                    }
                    // Intercept drops on populated field slots
                    else if (isFieldSlot && !isEmptyFieldSlot) {
                        const pokemonIdInZone = [...zones[finalTargetZone]].reverse().find(id => cards[id]?.type === 'pokemon');

                        if (pokemonIdInZone) {
                            if (draggedCard.type === 'energy') {
                                if (energySourcePokemonId !== pokemonIdInZone) {
                                    if (energySourcePokemonId) {
                                        useGameStore.getState().updateCardState(energySourcePokemonId, {
                                            attachedEnergyIds: cards[energySourcePokemonId].attachedEnergyIds.filter(id => id !== cardId)
                                        });
                                    }
                                    attachEnergy(cardId, pokemonIdInZone);
                                }
                                isValidDrop = true;
                            }
                            else if (draggedCard.type === 'pokemon') {
                                const tCard = cards[pokemonIdInZone];
                                const updates: Partial<CardInstance> = {};

                                if (tCard.attachedEnergyIds && tCard.attachedEnergyIds.length > 0) {
                                    updates.attachedEnergyIds = [...tCard.attachedEnergyIds];
                                    useGameStore.getState().updateCardState(pokemonIdInZone, { attachedEnergyIds: [] });
                                }
                                if (tCard.damage && tCard.damage > 0) {
                                    updates.damage = tCard.damage;
                                    useGameStore.getState().updateCardState(pokemonIdInZone, { damage: 0 });
                                }

                                updates.specialConditions = [];
                                updates.hasUsedAbility = false;

                                if (Object.keys(updates).length > 0) {
                                    useGameStore.getState().updateCardState(cardId, updates);
                                }

                                if (sourceZone) {
                                    moveCard(cardId, sourceZone, finalTargetZone);
                                    if (draggedToolId) {
                                        moveCard(draggedToolId, sourceZone, finalTargetZone, 0);
                                    }
                                }
                                isValidDrop = true;
                            }
                            else if (draggedCard.type === 'trainer' && draggedCard.kinds === 'tool') {
                                if (sourceZone) moveCard(cardId, sourceZone, finalTargetZone, 0);
                                isValidDrop = true;
                            }
                            else {
                                isValidDrop = false;
                            }
                        } else {
                            isValidDrop = false;
                        }
                    }
                    else {
                        isValidDrop = true;

                        // Support detaching energy if dragged away manually to a non-pokemon target
                        if (energySourcePokemonId) {
                            detachEnergy(cardId, energySourcePokemonId, finalTargetZone);
                        } else if (sourceZone && sourceZone !== finalTargetZone) {
                            // Normal zone to zone move
                            moveCard(cardId, sourceZone, finalTargetZone);
                            if (draggedToolId) {
                                // When moving to an empty field or matching zone, move tool over too
                                moveCard(draggedToolId, sourceZone, finalTargetZone, 0);
                            }

                            // Reset orientation when dropping onto the field
                            if (draggedCard && draggedCard.isReversed) {
                                useGameStore.getState().updateCardState(cardId, { isReversed: false });
                            }
                        }
                    }
                }
            }
        }

        if (isValidDrop && dragStartSnapshotRef.current) {
            useGameStore.getState().pushHistory({
                ...dragStartSnapshotRef.current,
                deckHistory: useGameStore.getState().deckHistory,
                isGameStarted: useGameStore.getState().isGameStarted
            });
        }

        if (transferSnapshot) {
            if (!isValidDrop) {
                // If the drag was not successful, trigger rollback
                handleDragCancel(event);
            } else {
                // Successfully un-stacked (devolved). Clear the special conditions from the bottom Pokemon.
                useGameStore.getState().updateCardState(transferSnapshot.targetPokemonId, { specialConditions: [], hasUsedAbility: false });
            }
            setTransferSnapshot(null);
        }

        if (isModalDragging) {
            setIsModalDragging(false);
            if (isValidDrop) {
                setPopupState(null); // Truly close popup when drag ends on a valid target
            }
        }

        setActiveId(null);
        setDraggedToolId(null);
    };

    const handleCoinToss = () => {
        if (isCoinFlipping) return;
        setIsCoinFlipping(true);
        tossCoin();

        // Let animation play, then show result
        setTimeout(() => {
            const flips = useGameStore.getState().coinFlips;
            setLastCoinResult(flips[flips.length - 1]);
            setIsCoinFlipping(false);
        }, 1000); // 1s animation
    };

    const handleTrashActive = (playerId: PlayerId) => {
        const activeZone = `${playerId}-active` as ZoneType;
        const trashZone = `${playerId}-trash` as ZoneType;
        const activeCards = [...zones[activeZone]];
        if (activeCards.length === 0) return;

        // Move all cards to trash. Also detach energies.
        activeCards.forEach(cardId => {
            const card = cards[cardId];
            if (card?.attachedEnergyIds && card.attachedEnergyIds.length > 0) {
                card.attachedEnergyIds.forEach(eid => {
                    detachEnergy(eid, cardId, trashZone);
                    useGameStore.getState().updateCardState(eid, { isReversed: false });
                });
                useGameStore.getState().updateCardState(cardId, { attachedEnergyIds: [] });
            }
            useGameStore.getState().updateCardState(cardId, { isReversed: false, damage: 0, specialConditions: [] });
            moveCard(cardId, activeZone, trashZone);
        });
    };

    const handleTrashBench = (playerId: PlayerId, benchId: ZoneType) => {
        const benchCards = [...zones[benchId]];
        if (benchCards.length === 0) return;

        benchCards.forEach(cardId => {
            const card = cards[cardId];
            if (card?.attachedEnergyIds && card.attachedEnergyIds.length > 0) {
                card.attachedEnergyIds.forEach(eid => {
                    detachEnergy(eid, cardId, `${playerId}-trash`);
                    useGameStore.getState().updateCardState(eid, { isReversed: false });
                });
                useGameStore.getState().updateCardState(cardId, { attachedEnergyIds: [] });
            }
            useGameStore.getState().updateCardState(cardId, { isReversed: false, damage: 0, specialConditions: [] });
            moveCard(cardId, benchId, `${playerId}-trash`);
        });
    };

    const handleEscapeActive = (playerId: PlayerId) => {
        // Check if bench has any pokemon
        let hasBenchPokemon = false;
        for (let i = 1; i <= 5; i++) {
            if (zones[`${playerId}-bench-${i}` as ZoneType].find(id => cards[id]?.type === 'pokemon')) {
                hasBenchPokemon = true;
                break;
            }
        }

        if (hasBenchPokemon) {
            setEscapePlayerId(playerId);
        }
    };

    const handleBenchSlotClick = (playerId: PlayerId, benchId: ZoneType) => {
        // Only swap if bench actually has a pokemon
        const hasPokemon = zones[benchId].find(id => cards[id]?.type === 'pokemon');
        if (!hasPokemon) return;

        // Perform swap
        const activeZone = `${playerId}-active` as ZoneType;
        const activeCards = [...zones[activeZone]];
        const benchCards = [...zones[benchId]];

        // Clear specialConditions for cards moving from active to bench
        activeCards.forEach(cardId => {
            useGameStore.getState().updateCardState(cardId, { specialConditions: [] });
        });

        const activePocket = cards[activeCards[0]];
        const benchPocket = cards[benchCards[0]];
        const logMsg = `${playerId === 'player1' ? 'プレイヤー1' : 'プレイヤー2'}: ${activePocket?.name || 'ポケモン'} と ${benchPocket?.name || 'ポケモン'} を入れ替えました。`;

        useGameStore.setState(state => ({
            zones: {
                ...state.zones,
                [activeZone]: benchCards,
                [benchId]: activeCards
            },
            logs: [...state.logs, logMsg]
        }));

        if (escapePlayerId === playerId) {
            setEscapePlayerId(null);
        }
    };

    const renderCardsInZone = (playerId: PlayerId, zoneName: ZoneType, isStacked = false, isPrizes = false) => {
        // Collect all attached instances in this zone so we don't render them separately
        const attachedIds = new Set<string>();
        zones[zoneName].forEach(id => {
            const c = cards[id];
            if (c && c.type === 'pokemon' && c.attachedEnergyIds) {
                c.attachedEnergyIds.forEach(eid => attachedIds.add(eid));
            }
        });

        let activeZoneRotation = '';
        if (zoneName === `${playerId}-active`) {
            const activeTopCardId = [...zones[`${playerId}-active` as ZoneType]].reverse().find(id => cards[id]?.type === 'pokemon');
            const activeTopCard = activeTopCardId ? cards[activeTopCardId] : null;
            if (activeTopCard && activeTopCard.specialConditions) {
                if (activeTopCard.specialConditions.includes('asleep') || activeTopCard.specialConditions.includes('paralyzed')) {
                    activeZoneRotation = 'rotate(-90deg) ';
                } else if (activeTopCard.specialConditions.includes('confused')) {
                    activeZoneRotation = 'rotate(-180deg) ';
                }
            }
        }

        return zones[zoneName].map((cardId, index) => {
            const card = cards[cardId];
            if (!card) return null;

            // Hide cards that are attached to a pokemon
            if (attachedIds.has(cardId)) return null;

            let stackStyles: React.CSSProperties = {};
            let cardProps = { ...card };

            if (zoneName === `${playerId}-trash`) {
                // For trash, we only render the last card (top of the pile) exactly in the center
                if (index !== zones[`${playerId}-trash` as ZoneType].length - 1) return null;
                stackStyles = {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    zIndex: 10
                };
            } else if (isPrizes) {
                // Prizes are face-down, rotated 90deg, scaled to fit 95% of width and height
                // Shifted up by 20px as requested to fit 0-6 index cards within the visible area
                const prizeScale = 0.68;
                stackStyles = {
                    position: 'absolute',
                    top: `calc(${index * 9.3}% - 20px)`,
                    left: '50%',
                    transform: `translateX(-50%) rotate(90deg) scale(${prizeScale})`,
                    zIndex: activeId === cardId ? 999 : index + 1
                };
                cardProps.isReversed = true; // Always face down on field
            } else if (zoneName === 'stadium') {
                stackStyles = {
                    width: 'var(--card-w)',
                    height: 'var(--card-h)',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: activeId === cardId ? 999 : index + 1
                };
            } else if (zoneName.startsWith(`${playerId}-bench`) || zoneName === `${playerId}-active`) {
                stackStyles = {
                    width: 'var(--card-w)',
                    height: 'var(--card-h)',
                    position: index === 0 ? 'relative' : 'absolute',
                    transform: `translateY(calc(${index} * var(--card-overlap)))`,
                    zIndex: activeId === cardId ? 999 : index + 1
                };
            } else if (isStacked) {
                stackStyles = {
                    position: 'absolute',
                    top: `calc(${index} * 2px)`,
                    left: `calc(${index} * 2px)`,
                    zIndex: activeId === cardId ? 999 : index + 1
                };
            }
            if (draggedToolId === cardId) {
                stackStyles.opacity = 0;
            }

            const isOpponentTarget = zoneName.startsWith(operatingPlayer === 'player1' ? 'player2-' : 'player1-');
            const isSelfTarget = zoneName.startsWith(`${operatingPlayer}-`);

            let disableDrag = isOpponentTarget && (zoneName.endsWith('-deck') || zoneName.endsWith('-prizes'));
            if (!isTurnActive && isSelfTarget) disableDrag = true;

            return <Card key={card.instanceId} card={cardProps} style={{ ...stackStyles }} onClick={(c) => setSelectedCard(c)} zoneName={zoneName} forcedTransform={activeZoneRotation || undefined} disableDrag={disableDrag} />;
        });
    };

    const renderHandCards = (playerId: PlayerId) => {
        return zones[`${playerId}-hand` as ZoneType].map((cardId) => {
            const card = cards[cardId];
            if (!card) return null;
            return (
                <div key={card.instanceId} className="flex-shrink-0 origin-bottom sm:hover:scale-110 sm:hover:-translate-y-4 hover:z-50 transition-transform relative z-10 cursor-pointer active:scale-95">
                    <Card card={card} className="card-in-hand" onClick={(c) => setSelectedCard(c)} zoneName={`${playerId}-hand` as ZoneType} />
                </div>
            );
        });
    };
    const renderPlayerField = (playerId: PlayerId, isOpponent: boolean) => {
        const spacerFlex = isOpponent ? "var(--spacer-f-opp)" : "var(--spacer-f-self)";
        return (
            <div className={`field ${playerId}-field relative flex flex-col px-2 py-1 overflow-visible ${isOpponent ? 'rotate-180' : ''}`} style={{ flex: isOpponent ? undefined : 'var(--field-f-self)', minHeight: 0 }}>
                <div style={{ flex: isOpponent ? "var(--spacer-f-top)" : spacerFlex }} />
                <div className={`active-row flex justify-center items-center w-full max-w-4xl mx-auto gap-[var(--card-gap)] flex-shrink-0 ${isOpponent ? 'scale-[var(--row-s-opp-active)] origin-center' : 'scale-[var(--row-s-self-active)] origin-bottom'}`}>

                    <div className="relative">
                        <Zone id={`${playerId}-prizes` as ZoneType} className="prizes-zone horizontal-prizes relative w-[var(--card-w)] h-[var(--card-h)] border border-dashed border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setPopupState({ zone: `${playerId}-prizes` as ZoneType })}>
                            {zones[`${playerId}-prizes` as ZoneType].length > 0 && (
                                <div className={`absolute w-7 h-7 bg-red-600 border-2 border-slate-900 text-white font-bold text-sm rounded-full flex items-center justify-center z-[1001] shadow-lg ${isOpponent ? '-top-3 -right-3 rotate-180' : '-bottom-3 -left-3'}`}>
                                    {zones[`${playerId}-prizes` as ZoneType].length}
                                </div>
                            )}
                            {renderCardsInZone(playerId, `${playerId}-prizes` as ZoneType, false, true)}
                            <div className="absolute inset-0 z-40" onClick={(e) => { e.stopPropagation(); setPopupState({ zone: `${playerId}-prizes` as ZoneType }); }}></div>
                        </Zone>
                    </div>

                    <div className="relative flex-shrink-0">
                        {zones[`${playerId}-active` as ZoneType].find(id => cards[id]?.type === 'pokemon') && (
                            <div className="absolute -top-3 -right-6 flex flex-col space-y-2 z-[1000] opacity-80 hover:opacity-100 transition-opacity">
                                <button className="bg-red-900 p-1 rounded-full shadow-lg border border-red-700 hover:bg-red-800 text-white" onClick={(e) => { e.stopPropagation(); handleTrashActive(playerId); }} title="トラッシュへ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                </button>
                                <button className="bg-green-700 p-1 rounded-full shadow-lg border border-green-600 hover:bg-green-600 text-white" onClick={(e) => { e.stopPropagation(); handleEscapeActive(playerId); }} title="にげる・入れ替え">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" /></svg>
                                </button>
                            </div>
                        )}

                        <Zone id={`${playerId}-active` as ZoneType} className="battle-zone w-[var(--card-w)] h-[var(--card-h)] border-2 border-yellow-500 rounded-md bg-slate-800/80 flex items-center justify-center relative">
                            {zones[`${playerId}-active` as ZoneType].length > 0 ? renderCardsInZone(playerId, `${playerId}-active` as ZoneType) : <div className="text-white opacity-30 text-[10px] sm:text-xs font-bold">バトル場</div>}
                        </Zone>
                    </div>

                    <div className="deck-trash-zone flex space-x-4 relative flex-shrink-0">
                        <div className="flex flex-col items-center relative">
                            <div className="absolute -top-3 -right-6 flex flex-col space-y-2 z-[1002] opacity-80 hover:opacity-100 transition-opacity">
                                <button className="bg-blue-600 p-1 rounded-full shadow-lg border border-blue-500 hover:bg-blue-500 text-white" onClick={(e) => { e.stopPropagation(); handleDraw1(playerId); }} title="1枚ドロー">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                                </button>
                                <button className="bg-slate-600 p-1 rounded-full shadow-lg border border-slate-500 hover:bg-slate-500 text-white" onClick={(e) => { e.stopPropagation(); handleShuffleAnimation(playerId); }} title="シャッフル">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
                                </button>
                            </div>

                            <Zone id={`${playerId}-deck` as ZoneType} className="deck-zone horizontal-card w-[var(--card-w)] h-[var(--card-h)] relative border border-solid border-slate-600 flex items-center justify-center hover:border-slate-400 cursor-pointer" onClick={() => setPopupState({ zone: `${playerId}-deck` as ZoneType, viewMode: 'all' })}>
                                {zones[`${playerId}-deck` as ZoneType].length > 0 && (
                                    <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-slate-700 border border-slate-900 text-white font-bold text-[10px] rounded-full flex items-center justify-center z-[1001] shadow-md">
                                        {zones[`${playerId}-deck` as ZoneType].length}
                                    </div>
                                )}
                                <div className={`deck-stack player1-card-back w-[90%] h-[92%] absolute bg-slate-700 rounded-md shadow-md ${(isShuffling === playerId || isShuffling === 'both') ? 'animate-shuffle' : ''}`} style={{ backgroundImage: "url('https://www.pokemon-card.com/assets/images/card_images/back.png')", backgroundSize: "cover" }} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 rounded transition-opacity">
                                    <span className="text-white text-[10px] font-bold text-center">タップで<br />アクション<br />を見る</span>
                                </div>
                            </Zone>

                            {(isDrawing === playerId || isDrawing === 'both') && (
                                <div className="absolute z-[9999] pointer-events-none" style={{
                                    top: '0', left: '0', width: '90%', height: '92%',
                                    animation: 'drawAnim 1.0s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                                }}>
                                    <div className="w-full h-full rounded-md shadow-xl" style={{ backgroundImage: "url('https://www.pokemon-card.com/assets/images/card_images/back.png')", backgroundSize: "cover" }} />
                                </div>
                            )}

                            {(isReturning === playerId || isReturning === 'both') && (
                                <div className="absolute z-[9999] pointer-events-none" style={{
                                    top: '0', left: '0', width: '90%', height: '92%',
                                    animation: 'returnToDeckAnim 0.5s ease-in forwards'
                                }}>
                                    <div className="w-full h-full rounded-md shadow-xl" style={{ backgroundImage: "url('https://www.pokemon-card.com/assets/images/card_images/back.png')", backgroundSize: "cover" }} />
                                </div>
                            )}
                        </div>

                        <Zone id={`${playerId}-trash` as ZoneType} className="trash-zone horizontal-card w-[var(--card-w)] h-[var(--card-h)] relative border border-solid border-slate-500 bg-slate-800/40 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setPopupState({ zone: `${playerId}-trash` as ZoneType })}>
                            {zones[`${playerId}-trash` as ZoneType].length > 0 && (
                                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-slate-700 border border-slate-900 text-white font-bold text-[10px] rounded-full flex items-center justify-center z-[1001] shadow-md">
                                    {zones[`${playerId}-trash` as ZoneType].length}
                                </div>
                            )}
                            {renderCardsInZone(playerId, `${playerId}-trash` as ZoneType, true)}
                            <div className="absolute inset-0 z-40" onClick={(e) => {
                                e.stopPropagation();
                                setPopupState({ zone: `${playerId}-trash` as ZoneType });
                            }}></div>
                        </Zone>
                    </div>
                </div>

                <div style={{ flex: spacerFlex }} />

                <div className={`bench-row flex justify-center w-full max-w-4xl mx-auto flex-shrink-0 ${isOpponent ? 'scale-[var(--row-s-opp-bench)] origin-top' : 'scale-[var(--row-s-self-bench)] origin-top'}`}>
                    <div className="bench-zone flex gap-[calc(var(--card-gap)*0.5)] p-1 bg-slate-800/40 rounded-lg">
                        {([1, 2, 3, 4, 5] as const).map(num => {
                            const bZone = `${playerId}-bench-${num}` as ZoneType;
                            const hasPoke = escapePlayerId === playerId && zones[bZone].find(id => cards[id]?.type === 'pokemon');
                            const outlineClass = hasPoke ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-pulse cursor-pointer z-[5001]' : 'border-slate-600';
                            const benchHasPokemon = zones[bZone].find(id => cards[id]?.type === 'pokemon');

                            const renderBenchArea = () => (
                                <div className="relative">
                                    {benchHasPokemon && (
                                        <div className="absolute -top-3 -right-3 z-[1000] opacity-80 hover:opacity-100 transition-opacity flex flex-col space-y-1">
                                            <button
                                                className="bg-red-900 p-1 rounded-full shadow-lg border border-red-700 hover:bg-red-800 text-white"
                                                onClick={(e) => { e.stopPropagation(); handleTrashBench(playerId, bZone); }}
                                                title="トラッシュへ"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                            </button>
                                            <button
                                                className="bg-blue-700 p-1 rounded-full shadow-lg border border-blue-500 hover:bg-blue-600 text-white"
                                                onClick={(e) => { e.stopPropagation(); handleBenchSlotClick(playerId, bZone); }}
                                                title="バトル場と入れ替え"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.31 1.97-.81 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.31-1.97.81-2.8L5.35 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" /></svg>
                                            </button>
                                        </div>
                                    )}
                                    <Zone id={bZone} className={`bench-slot w-[var(--card-w)] h-[var(--card-h)] bg-slate-800/80 rounded-md border ${outlineClass} relative overflow-visible flex items-center justify-center`} onClick={() => escapePlayerId === playerId && handleBenchSlotClick(playerId, bZone)}>
                                        {escapePlayerId === playerId && <div className="absolute inset-0 z-[5002]" />}
                                        {renderCardsInZone(playerId, bZone)}
                                    </Zone>
                                </div>
                            );

                            return <React.Fragment key={`bench-${num}`}>{renderBenchArea()}</React.Fragment>;
                        })}
                    </div>
                </div>

                <div style={{ flex: spacerFlex }} />

                {isOpponent ? (
                    <Zone id={`${playerId}-hand` as ZoneType} className={`${playerId}-hand-opponent relative w-full flex justify-center space-x-[calc(var(--card-w)*-0.6)] overflow-visible z-[10] opacity-90 flex-shrink-0`} style={{ height: 'calc(var(--card-h) * 0.5)' }}>
                        {zones[`${playerId}-hand` as ZoneType].map((cardId) => (
                            <div key={cardId} className="w-[var(--card-w)] h-[calc(var(--card-w)*1.4)] bg-slate-700 rounded shadow-md border border-slate-600 scale-[0.6] origin-top" style={{ backgroundImage: "url('https://www.pokemon-card.com/assets/images/card_images/back.png')", backgroundSize: "cover" }} />
                        ))}
                    </Zone>
                ) : (
                    <Zone id={`${playerId}-hand` as ZoneType} className={`${playerId}-hand relative w-full bg-slate-900/90 border-t border-slate-700 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] flex items-start justify-center space-x-[calc(var(--card-w)*-0.4)] overflow-visible z-50 pb-1 flex-shrink-0`} style={{ height: 'calc(var(--card-h) * var(--hand-h-mult))' }}>
                        {/* Toolbar Toggle Button */}
                        <button
                            className="absolute -top-[var(--bar-h)] right-[5vw] z-[70] bg-slate-800/95 rounded-full border-2 border-slate-500 text-white shadow-xl flex items-center justify-center transition-all hover:bg-slate-700 active:scale-90"
                            onClick={(e) => { e.stopPropagation(); setIsToolbarOpen(!isToolbarOpen); }}
                            style={{ width: 'var(--bar-h)', height: 'var(--bar-h)' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-300 ${isToolbarOpen ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19l7-7-7-7" />
                            </svg>
                        </button>

                        {/* Operations Toolbar */}
                        <div className={`absolute -top-[var(--bar-h)] right-[16vw] z-[60] bg-slate-800/90 rounded-lg border border-slate-600 shadow-xl backdrop-blur-sm items-center responsive-panel transition-all duration-300 ease-out ${isToolbarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0 pointer-events-none'}`}>
                            <button className="bg-slate-700 hover:bg-slate-600 text-white rounded-full shadow border border-slate-500 transition-colors flex items-center justify-center" style={{ width: 'calc(var(--btn-fs) * 2.5)', height: 'calc(var(--btn-fs) * 2.5)' }} onClick={handleUndo} title="1つ手前へ戻る (Undo)">
                                <svg xmlns="http://www.w3.org/2000/svg" className="res-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                            </button>
                            <button className="bg-slate-700 hover:bg-slate-600 text-white rounded-full shadow border border-slate-500 transition-colors flex items-center justify-center" style={{ width: 'calc(var(--btn-fs) * 2.5)', height: 'calc(var(--btn-fs) * 2.5)' }} onClick={handleRedo} title="1つ先へ進める (Redo)">
                                <svg xmlns="http://www.w3.org/2000/svg" className="res-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>
                            </button>
                            <span className="w-px bg-slate-600 self-stretch my-2" />
                            <button className="bg-green-700 hover:bg-green-600 text-white rounded shadow font-bold border border-green-500 transition-colors responsive-btn" onClick={() => handleDraw1(playerId)}>ドロー</button>
                            <button className="bg-blue-700 hover:bg-blue-600 text-white rounded shadow font-bold border border-blue-500 transition-colors responsive-btn" onClick={() => handleJudge(playerId)}>ジャッジマン</button>
                            <button className="bg-purple-700 hover:bg-purple-600 text-white rounded shadow font-bold border border-purple-500 transition-colors responsive-btn" onClick={() => handleProfResearch(playerId)}>博士の研究</button>
                            <button className="bg-orange-700 hover:bg-orange-600 text-white rounded shadow font-bold border border-orange-500 transition-colors responsive-btn" onClick={() => handleReturnToDeck(playerId)}>山札に戻す</button>
                        </div>

                        {/* Hand Count Display */}
                        <div className="absolute top-2 right-[12vw] text-slate-400 text-[var(--btn-font-size)] scale-[0.8] origin-right font-bold font-mono bg-slate-800 px-2 py-1 rounded-full border border-slate-700 shadow-inner z-[70]">
                            手札 : {zones[`${playerId}-hand` as ZoneType].length}
                        </div>
                        {renderHandCards(playerId)}
                    </Zone>
                )}
            </div>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <style>{`
                @keyframes shuffleAnim {
                    0% { transform: translateX(0) rotate(0); }
                    25% { transform: translateX(-4px) rotate(-4deg); }
                    50% { transform: translateX(4px) rotate(4deg); }
                    75% { transform: translateX(-4px) rotate(-4deg); }
                    100% { transform: translateX(0) rotate(0); }
                }
                .animate-shuffle {
                    animation: shuffleAnim 0.15s ease-in-out infinite;
                }
                @keyframes drawAnim {
                    0% { transform: scale(1) translate(0, 0); opacity: 1; }
                    40% { transform: scale(1.2) translate(-20vw, 10vh) rotate(-10deg); opacity: 1; }
                    70% { transform: scale(1.1) translate(-10vw, 30vh) rotate(0deg); opacity: 0.8; }
                    100% { transform: scale(0.8) translate(5vw, 60vh) rotate(0deg); opacity: 0; }
                }
                @keyframes returnToDeckAnim {
                    0% { transform: scale(0.6); opacity: 0; top: 250px; left: -20px; }
                    50% { transform: scale(1.1); opacity: 1; top: -50px; left: -20px; }
                    100% { transform: scale(1); opacity: 1; top: 0; left: 0; }
                }
                @keyframes pokeballSpin {
                    0% { transform: rotateX(0deg) scale(1.1); }
                    100% { transform: rotateX(1080deg) scale(1.1); }
                }
                .animate-pokeball {
                    animation: pokeballSpin 0.7s ease-in-out forwards;
                    transform-style: preserve-3d;
                }
                .coin-face {
                    backface-visibility: hidden;
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                }
                .coin-back {
                    transform: rotateX(180deg);
                }
            `}</style>

            <div className="battle-arena h-full w-full relative flex flex-col overflow-hidden bg-slate-950 overscroll-none touch-none">

                {/* Top Field */}
                {renderPlayerField(isOpponentView ? 'player1' : 'player2', true)}

                {/* Middle Area */}
                <div className="mid-divider custom-mid relative h-[var(--bar-h)] shrink-0 flex items-center px-[3vw] bg-slate-800 z-[200]">
                    <Zone id="stadium" className="stadium-slot square-stadium w-[var(--stadium-w)] h-[var(--stadium-w)] bg-indigo-950 absolute left-[calc(50%-var(--stadium-w)/2)] border-2 border-yellow-600 top-1/2 -translate-y-1/2 z-[5000] flex items-center justify-center text-center cursor-pointer shadow-xl overflow-hidden hover:border-yellow-400 transition-colors" onClick={() => setPopupState({ zone: 'stadium' })}>
                        {zones.stadium.length > 0 ? renderCardsInZone('player1', 'stadium') : <div className="text-white opacity-30 text-[10px] sm:text-xs font-bold">スタジアム</div>}
                    </Zone>

                    <div className="flex items-center space-x-3 ml-4">
                        {isClerkEnabled ? <AuthStatus /> : <div className="text-[10px] text-slate-500">Local Mode</div>}
                    </div>

                    {/* Operation Buttons (Right side of bar) */}
                    <div className="flex space-x-[var(--card-gap)] absolute right-[2vw] z-[5000]">
                        {useGameStore.getState().currentTurnPlayer === (isOpponentView ? 'player2' : 'player1') && (
                            <>
                                <button
                                    className="bg-purple-700 hover:bg-purple-600 text-white rounded shadow-md font-bold border border-purple-500 transition-colors responsive-btn relative flex items-center justify-center gap-1"
                                    onClick={handleAnalyzeGame}
                                >
                                    AI分析
                                    {(isClerkEnabled && isSignedIn && !isPro && tickets !== null) && (
                                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-full border border-yellow-300 shadow-md transform scale-90 sm:scale-100">
                                            ⚡️{tickets}
                                        </span>
                                    )}
                                    {(isClerkEnabled && isSignedIn && isPro) && (
                                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-yellow-300 shadow-md">
                                            PRO
                                        </span>
                                    )}
                                </button>
                                <button
                                    className={`text-white rounded shadow-md font-bold border transition-colors responsive-btn ${isGameStarted ? 'bg-red-700 hover:bg-red-600 border-red-500' : 'bg-blue-700 hover:bg-blue-600 border-blue-500'}`}
                                    onClick={() => isGameStarted ? setIsEndTurnModalOpen(true) : setIsStartGameModalOpen(true)}
                                >
                                    {isGameStarted ? 'ターン終了' : 'バトル開始'}
                                </button>
                            </>
                        )}
                        <button
                            className="bg-slate-700 hover:bg-slate-600 text-white rounded shadow-md font-bold border border-slate-500 transition-colors responsive-btn"
                            onClick={() => setOpponentView(!isOpponentView)}
                        >
                            {isOpponentView ? '自分視点' : '相手視点'}
                        </button>
                    </div>
                </div>

                {/* Bottom Field */}
                {renderPlayerField(isOpponentView ? 'player2' : 'player1', false)}

            </div>

            {/* Action Modal */}
            {selectedCard && (
                <CardActionModal card={selectedCard} onClose={() => setSelectedCard(null)} />
            )}

            {/* Side Pokemon Coin UI */}
            <div className="fixed left-[1vw] top-[45%] -translate-y-1/2 z-[8000] flex flex-col items-center space-y-[1vh] bg-slate-900/60 p-[1vw] rounded-full border border-slate-700 backdrop-blur-sm shadow-2xl">
                <div
                    className={`rounded-full cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 transition-all duration-300 relative ${isCoinFlipping ? 'animate-pokeball pointer-events-none border-red-500' : 'hover:scale-110 border-slate-500'}`}
                    onClick={() => {
                        if (isCoinFlipping) return;
                        setIsCoinFlipping(true);
                        const result = Math.random() < 0.5 ? 'heads' : 'tails';
                        setTimeout(() => {
                            setLastCoinResult(result);
                            setIsCoinFlipping(false);
                            useGameStore.setState(state => ({ coinFlips: [result, ...state.coinFlips] }));
                        }, 700);
                    }}
                    style={{
                        transformStyle: 'preserve-3d',
                        width: 'var(--coin-size)',
                        height: 'var(--coin-size)'
                    }}
                >
                    {/* Front Face (Heads / Default Red) */}
                    <div className="coin-face" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#ef4444',
                        filter: (!isCoinFlipping && lastCoinResult === 'tails') ? 'grayscale(100%) brightness(0.8)' : 'none',
                        zIndex: (!isCoinFlipping && lastCoinResult === 'tails') ? 1 : 2
                    }}>
                        <div className="absolute top-0 left-0 w-full h-[50%] bg-red-500 border-b-[max(1px,0.15vw)] border-black rounded-t-full relative overflow-hidden"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[50%] bg-white border-t-[max(1px,0.15vw)] border-black rounded-b-full"></div>
                        <div className="absolute w-[35%] h-[35%] rounded-full bg-white border-[max(1px,0.1vw)] border-black z-10 flex items-center justify-center"></div>
                    </div>

                    {/* Back Face (Tails / Grayish) */}
                    <div className="coin-face coin-back" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#94a3b8',
                        zIndex: (!isCoinFlipping && lastCoinResult === 'tails') ? 2 : 1
                    }}>
                        <div className="absolute top-0 left-0 w-full h-[50%] bg-slate-400 border-b-[max(1px,0.15vw)] border-black rounded-t-full relative overflow-hidden"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[50%] bg-white border-t-[max(1px,0.15vw)] border-black rounded-b-full"></div>
                        <div className="absolute w-[35%] h-[35%] rounded-full bg-white border-[max(1px,0.1vw)] border-black z-10 flex items-center justify-center"></div>
                    </div>
                </div>

                {coinFlips.length > 0 && (
                    <div className="flex flex-col space-y-[0.5vh] opacity-80 bg-black/40 p-1 rounded-full border border-slate-800">
                        {coinFlips.slice(0, 4).map((flip, i) => (
                            <span key={i} className={`rounded-full flex justify-center items-center text-[min(10px,1.5vw)] font-bold border-[max(1px,0.1vw)] border-black/50 ${flip === 'heads' ? 'bg-red-500 text-white' : 'bg-white text-slate-900'}`} style={{ width: 'calc(var(--coin-size)*0.45)', height: 'calc(var(--coin-size)*0.45)' }}>
                                {flip === 'heads' ? 'H' : 'T'}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {isEndTurnModalOpen && (
                <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center pointer-events-auto backdrop-blur-sm" onClick={() => setIsEndTurnModalOpen(false)}>
                    <div
                        className="bg-slate-800 border-2 border-slate-600 rounded-xl p-[5vw] shadow-2xl min-w-[300px] max-w-[90vw] text-center transform scale-100 animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-white text-[clamp(14px,4vw,20px)] font-bold mb-[4vh]">
                            {currentTurnPlayer === 'player1' ? 'プレイヤー1' : 'プレイヤー2'} のターンを終了しますか？
                        </h2>
                        <div className="flex space-x-[2vw] justify-center mt-[4vh]">
                            <button className="bg-slate-700 hover:bg-slate-600 text-white rounded shadow font-bold border border-slate-500 transition-colors responsive-btn" onClick={() => setIsEndTurnModalOpen(false)}>
                                いいえ (戻る)
                            </button>
                            <button className="bg-red-700 hover:bg-red-600 text-white rounded shadow font-bold border border-red-500 transition-colors responsive-btn" onClick={handleConfirmEndTurn}>
                                はい (終了)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isStartGameModalOpen && (
                <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center pointer-events-auto backdrop-blur-sm" onClick={() => setIsStartGameModalOpen(false)}>
                    <div
                        className="bg-slate-800 border-2 border-slate-600 rounded-xl p-[5vw] shadow-2xl min-w-[300px] max-w-[90vw] text-center transform scale-100 animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-white text-[clamp(14px,4vw,20px)] font-bold mb-[4vh]">
                            バトルを開始しますか？
                        </h2>
                        <div className="flex space-x-[2vw] justify-center mt-[4vh]">
                            <button className="bg-slate-700 hover:bg-slate-600 text-white rounded shadow font-bold border border-slate-500 transition-colors responsive-btn" onClick={() => setIsStartGameModalOpen(false)}>
                                いいえ (準備中)
                            </button>
                            <button className="bg-blue-700 hover:bg-blue-600 text-white rounded shadow font-bold border border-blue-500 transition-colors responsive-btn" onClick={handleConfirmStartGame}>
                                はい (対戦開始)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Analysis Overlay (Stylish) */}
            <AnalysisOverlay
                isOpen={isAiAnalysisModalOpen}
                isAnalyzing={isAnalyzing}
                analysis={aiAnalysis}
                onClose={() => setIsAiAnalysisModalOpen(false)}
                onFeedback={handleFeedback}
            />

            {/* Ticket Limitation Modal */}
            <TicketLimitModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
            />

            {/* Drag Overlay for smooth card visual out of hidden overflow areas (like Popup) */}
            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })
            }}>
                {activeId ? (() => {
                    const actingCard = cards[activeId];
                    let activeDragRotation = '';

                    // Determine if the dragged card should be rotated (status conditions in active zone)
                    let activeCardZone: string | null = null;
                    for (const [zName, cIds] of Object.entries(zones)) {
                        if (cIds.includes(activeId)) {
                            activeCardZone = zName;
                            break;
                        }
                    }

                    if (activeCardZone && activeCardZone.endsWith('-active')) {
                        if (actingCard && actingCard.specialConditions) {
                            if (actingCard.specialConditions.includes('asleep') || actingCard.specialConditions.includes('paralyzed')) {
                                activeDragRotation = 'rotate(-90deg) ';
                            } else if (actingCard.specialConditions.includes('confused')) {
                                activeDragRotation = 'rotate(-180deg) ';
                            }
                        }
                    }

                    return (
                        <div className="relative">
                            {draggedToolId && cards[draggedToolId] && (
                                <Card
                                    card={cards[draggedToolId]}
                                    isOverlay={true}
                                    style={{ width: 'var(--card-w)', height: 'var(--card-h)', pointerEvents: 'none', position: 'absolute', top: 'calc(var(--card-w) * 0.18)', left: 0, zIndex: 0 }}
                                />
                            )}
                            <Card
                                card={cards[activeId]}
                                isOverlay={true}
                                style={{ width: 'var(--card-w)', height: 'var(--card-h)', pointerEvents: 'none', position: 'relative', zIndex: 1 }}
                                forcedTransform={activeDragRotation || undefined}
                            />
                        </div>
                    );
                })() : null}
            </DragOverlay>

            {/* Zone Popup Modal */}
            {popupState && (
                <div className={`transition-opacity duration-200 z-[9000] relative ${isModalDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <ZonePopupModal state={popupState} onClose={() => { setPopupState(null); setIsModalDragging(false); }} onSelectCard={setSelectedCard} />
                </div>
            )}
        </DndContext>
    );
};

const AuthStatus: React.FC = () => {
    const { user, isSignedIn } = useAuth();
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const isClerkEnabled = clerkKey && clerkKey.startsWith('pk_');

    if (!isClerkEnabled) {
        return (
            <div className="bg-slate-800 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-700">
                Local Mode
            </div>
        );
    }

    return (
        <>
            {isSignedIn && isClerkEnabled ? (
                <div className="flex items-center space-x-2 bg-slate-900/50 p-1 px-2 rounded-full border border-slate-700">
                    <span className="text-[10px] text-slate-400 mr-1">Sync ON</span>
                    <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-6 h-6' } }} />
                </div>
            ) : isClerkEnabled ? (
                <div className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors cursor-pointer border border-blue-400/30">
                    <SignInButton mode="modal">Login to Sync</SignInButton>
                </div>
            ) : (
                <div className="bg-slate-800 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-700">
                    Offline
                </div>
            )}
        </>
    );
};
