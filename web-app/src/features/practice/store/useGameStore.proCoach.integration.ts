import { createRoleProfile } from "@/features/practice/ai-next/inference/sectionRoleInference";
import { getSectionTexts } from "@/features/practice/ai-next/utils/text";
import { buildProfessionalCoachResult } from "@/features/practice/ai-next/pro-coach/recommendationEngine";
import type { CardRoleProfile } from "@/features/practice/ai-next/domain/types";
import { GameState, ZoneType } from "@/types/game";
import { CoachCard } from "../ai-next/pro-coach/types";

export function buildProfilesFromCurrentState(state: GameState): CardRoleProfile[] {
  const cards = Object.values(state.cards ?? {});
  return cards.map((card: any) => createRoleProfile(card, getSectionTexts(card)));
}

export function toCoachGameStateFromStore(state: GameState) {
  const getZoneCards = (zone: ZoneType) => (state.zones[zone] || []).map(id => state.cards[id]).filter(Boolean);

  const normalizeCard = (card: any): CoachCard | null => {
    if (!card) return null;
    
    // 付着しているエネルギーの実体を引いて、タイプを特定
    const attachedEnergyIds = Array.isArray(card.attachedEnergyIds) ? card.attachedEnergyIds : [];
    const attachedEnergyTypes = attachedEnergyIds
      .map((id: string) => state.cards[id])
      .filter(Boolean)
      .map((c: any) => (c.kinds || c.energyType || "colorless") as any);

    return {
      id: String(card.instanceId ?? card.id ?? card.cardId ?? card.baseCardId ?? card.name),
      baseCardId: card.baseCardId ?? card.cardId,
      name: card.name,
      type: card.type,
      kinds: card.kinds,
      hp: Number(card.hp ?? 0) || null,
      damage: Number(card.damage ?? 0) || 0,
      retreat: Number(card.retreatCost ?? card.retreat ?? 0) || null,
      attachedEnergyIds,
      attachedEnergyTypes,
      canAttack: !!card.canAttack,
      attacks: (card.attacks || []).map((a: any) => ({
        ...a,
        cost: Array.isArray(a.cost) ? a.cost : []
      })),
      ability: card.ability ?? [],
      tags: card.tags ?? [],
    };
  };

  const p1Active = getZoneCards('player1-active')[0];
  const p1Bench = [
    ...getZoneCards('player1-bench-1'),
    ...getZoneCards('player1-bench-2'),
    ...getZoneCards('player1-bench-3'),
    ...getZoneCards('player1-bench-4'),
    ...getZoneCards('player1-bench-5'),
  ];
  const p1Hand = getZoneCards('player1-hand');
  const p1Discard = getZoneCards('player1-trash');

  const p2Active = getZoneCards('player2-active')[0];
  const p2Bench = [
    ...getZoneCards('player2-bench-1'),
    ...getZoneCards('player2-bench-2'),
    ...getZoneCards('player2-bench-3'),
    ...getZoneCards('player2-bench-4'),
    ...getZoneCards('player2-bench-5'),
  ];
  const p2Hand = getZoneCards('player2-hand');
  const p2Discard = getZoneCards('player2-trash');

  return {
    turn: state.turnCount ?? 1,
    currentTurnPlayer: state.currentTurnPlayer ?? "player1",
    firstPlayer: "player1" as const,
    selectedArchetype: "generic",
    players: {
      player1: {
        active: normalizeCard(p1Active),
        bench: p1Bench.map(normalizeCard).filter((c): c is CoachCard => !!c),
        hand: p1Hand.map(normalizeCard).filter((c): c is CoachCard => !!c),
        discard: p1Discard.map(normalizeCard).filter((c): c is CoachCard => !!c),
        prizesTaken: 6 - state.zones['player2-prizes'].length,
        supporterUsed: false,
        energyAttachedThisTurn: false,
      },
      player2: {
        active: normalizeCard(p2Active),
        bench: p2Bench.map(normalizeCard).filter((c): c is CoachCard => !!c),
        hand: p2Hand.map(normalizeCard).filter((c): c is CoachCard => !!c),
        discard: p2Discard.map(normalizeCard).filter((c): c is CoachCard => !!c),
        prizesTaken: 6 - state.zones['player1-prizes'].length,
        supporterUsed: false,
        energyAttachedThisTurn: false,
      },
    },
    cards: state.cards ?? {},
  };
}


export function runProfessionalCoachAnalysis(state: GameState) {
  const profiles = buildProfilesFromCurrentState(state);
  const coachState = toCoachGameStateFromStore(state);

  const deckForOpeningSimulation = Object.values(state.cards ?? {}).map((card: any) => ({
    id: card.instanceId ?? card.id ?? card.cardId ?? card.baseCardId ?? card.name,
    cardId: card.baseCardId ?? card.cardId ?? card.id ?? card.name,
    name: card.name,
    type: card.type,
    kinds: card.kinds,
  }));

  return buildProfessionalCoachResult({
    state: coachState,
    profiles,
    deckForOpeningSimulation,
  });
}
