import type { CardRoleProfile } from "../domain/types";
import { buildEffectSpecForCard } from "../effects/effectSpecCatalog";
import type { EffectContext } from "../effects/effectSpecTypes";
import { extractBoardFeatures } from "./featureExtractor";
import { interpretCoachCard } from "./cardInterpreter";
import {
  selectAttackTargets,
  selectBenchTargets,
  selectEnergyTargets,
  selectEvolutionTargets,
  selectGustTargets,
  selectRecoveryTargets,
} from "./targetSelector";
import type { CoachCard, CoachGameState, LegalAction } from "./types";

type LooseCardRecord = Record<string, unknown>;
type ScopedCardMap = Record<string, LooseCardRecord>;

function idOf(card: CoachCard): string {
  return String(card.id ?? card.baseCardId ?? card.name);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function scopedCards(state: CoachGameState): ScopedCardMap {
  return asRecord(state.cards) as ScopedCardMap;
}

function resolveScopedCardRecord(state: CoachGameState, card: CoachCard): LooseCardRecord | undefined {
  const map = scopedCards(state);
  return map[idOf(card)] ?? map[String(card.baseCardId ?? "")] ?? map[card.name];
}

function enrichWithScopedRecord(state: CoachGameState, card: CoachCard): CoachCard {
  const record = resolveScopedCardRecord(state, card);
  if (!record) return card;

  return {
    ...card,
    type: typeof record.type === "string" ? record.type : card.type,
    kinds: typeof record.kinds === "string" ? record.kinds : card.kinds,
    hp: typeof record.hp === "number" ? record.hp : card.hp,
    retreat: typeof record.retreat === "number" ? record.retreat : card.retreat,
    attacks: Array.isArray(record.attacks) ? (record.attacks as CoachCard["attacks"]) : card.attacks,
    ability: Array.isArray(record.ability) ? (record.ability as CoachCard["ability"]) : card.ability,
    rules: Array.isArray(record.rules) ? (record.rules as CoachCard["rules"]) : card.rules,
    support: Array.isArray(record.support) ? (record.support as CoachCard["support"]) : card.support,
    weakness: typeof record.weakness === "string" ? record.weakness : card.weakness,
    resistance: typeof record.resistance === "string" ? record.resistance : card.resistance,
    evolves: Array.isArray(record.evolves) ? (record.evolves as string[]) : card.evolves,
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : card.tags,
    baseCardId: typeof record.id === "string" ? record.id : card.baseCardId,
  };
}

function profileForCard(card: CoachCard, profiles: CardRoleProfile[]): CardRoleProfile | undefined {
  return profiles.find(
    (profile) =>
      profile.cardId === String(card.baseCardId ?? card.id) || profile.cardName === card.name,
  );
}

function inferPlayableCategory(card: CoachCard): "supporter" | "item" | "stadium" | "tool" | "energy" | "pokemon" | "unknown" {
  const type = (card.type ?? "").toLowerCase();
  const kinds = (card.kinds ?? "").toLowerCase();

  if (type === "energy") return "energy";
  if (type === "pokemon") return "pokemon";
  if (type === "trainer" || type === "trainers") {
    if (kinds === "support" || kinds === "supporter") return "supporter";
    if (kinds === "item") return "item";
    if (kinds === "tool") return "tool";
    if (kinds === "stadium" || kinds === "studium") return "stadium";
  }

  return "unknown";
}

function effectCategoryFromProfile(profile?: CardRoleProfile):
  | "draw"
  | "search"
  | "gust"
  | "disrupt"
  | "recovery"
  | "generic"
  | "search_basic"
  | "search_any"
  | "switch"
  | "board_expansion"
  | "stadium_control"
  | "energy" {
  if (!profile) return "generic";
  const roles = new Set(profile.staticRoles);
  if (roles.has("gust" as never)) return "gust";
  if (roles.has("draw" as never) || roles.has("hand_refresh" as never) || roles.has("topdeck_tutor" as never)) return "draw";
  if (roles.has("basic_search" as never)) return "search_basic";
  if (roles.has("pokemon_search" as never) || roles.has("pokemon_ex_search" as never) || roles.has("evolution_search" as never)) return "search_any";
  if (roles.has("switch" as never) || roles.has("pivot" as never)) return "switch";
  if (roles.has("resource_recovery" as never) || roles.has("recovery" as never) || roles.has("energy_recovery" as never)) return "recovery";
  if (roles.has("stadium_control" as never)) return "stadium_control";
  if (roles.has("board_expansion" as never)) return "board_expansion";
  if (roles.has("energy_accel" as never) || roles.has("energy_search" as never)) return "energy";
  if (roles.has("disrupt" as never) || roles.has("stall" as never)) return "disrupt";
  if (roles.has("search" as never) || roles.has("item_search" as never) || roles.has("supporter_search" as never)) return "search";
  return "generic";
}

function buildEffectContext(state: CoachGameState, profiles: CardRoleProfile[]): EffectContext {
  const handNames = new Set(state.players.player1.hand.map((card) => card.name));
  const handProfiles = profiles.filter((profile) => handNames.has(profile.cardName));
  const features = extractBoardFeatures(state, handProfiles);

  return {
    phase: features.phase,
    setupNeed: features.setupNeed,
    drawNeed: features.drawNeed,
    gustNeed: features.gustNeed,
    safetyNeed: features.safetyNeed,
    handSize: state.players.player1.hand.length,
    ownBenchCount: features.ownBenchCount,
    oppBenchCount: features.oppBenchCount,
    supporterUsed: state.players.player1.supporterUsed,
    energyAttachedThisTurn: state.players.player1.energyAttachedThisTurn,
    hasFreeBenchSlot: state.players.player1.bench.length < 5,
    opponentHasSystem: features.oppSystemCount > 0,
    opponentHasHeavyRetreat: features.oppHeavyRetreatCount > 0,
  };
}

function canUseAbilityThisTurn(card: CoachCard): boolean {
  const interpreted = interpretCoachCard(card);
  if (!interpreted) return false;
  return interpreted.abilities.length > 0 && !card.turnFlags?.abilityUsed;
}

function canBenchBasic(state: CoachGameState, card: CoachCard): boolean {
  const interpreted = interpretCoachCard(card);
  if (!interpreted) return false;
  return interpreted.type === "pokemon" && interpreted.pokemonStage === "basic" && state.players.player1.bench.length < 5;
}

function canEvolveFromBoard(state: CoachGameState, handCard: CoachCard): boolean {
  const interpreted = interpretCoachCard(handCard);
  if (!interpreted || interpreted.type !== "pokemon") return false;
  if (interpreted.pokemonStage !== "stage1" && interpreted.pokemonStage !== "stage2") return false;

  const boardCards = [
    ...(state.players.player1.active ? [state.players.player1.active] : []),
    ...state.players.player1.bench,
  ];

  return boardCards.some((boardCard) => {
    const enteredTurn = boardCard.enteredTurn ?? 0;
    if (enteredTurn >= state.turn) return false;
    const alreadyEvolvedThisTurn = (boardCard.evolvedTurn ?? -1) === state.turn;
    if (alreadyEvolvedThisTurn) return false;

    const baseName = boardCard.name;
    return interpreted.evolves.includes(baseName) || (boardCard.evolves ?? []).includes(interpreted.name);
  });
}

export function generateLegalActions(state: CoachGameState, profiles: CardRoleProfile[]): LegalAction[] {
  const actions: LegalAction[] = [];
  const ctx = buildEffectContext(state, profiles);

  const ownActive = state.players.player1.active ? enrichWithScopedRecord(state, state.players.player1.active) : null;
  const ownBench = state.players.player1.bench.map((card) => enrichWithScopedRecord(state, card));
  const ownHand = state.players.player1.hand.map((card) => enrichWithScopedRecord(state, card));
  const ownDiscard = state.players.player1.discard.map((card) => enrichWithScopedRecord(state, card));
  const scopedState: CoachGameState = {
    ...state,
    players: {
      ...state.players,
      player1: {
        ...state.players.player1,
        active: ownActive,
        bench: ownBench,
        hand: ownHand,
        discard: ownDiscard,
      },
    },
  };

  const boardCards = [...(ownActive ? [ownActive] : []), ...ownBench];

  for (const boardCard of boardCards) {
    const profile = profileForCard(boardCard, profiles);
    const category = effectCategoryFromProfile(profile);
    if (!canUseAbilityThisTurn(boardCard)) continue;

    const spec = buildEffectSpecForCard(boardCard.name, profile);
    if (spec?.canPlay && !spec.canPlay(ctx)) continue;

    actions.push({
      kind: "use_ability",
      sourceId: idOf(boardCard),
      sourceName: boardCard.name,
      category: category === "draw" || category === "search" || category === "energy" ? category : "generic",
    });
  }

  for (const handCard of ownHand) {
    const profile = profileForCard(handCard, profiles);
    const category = effectCategoryFromProfile(profile);
    const playable = inferPlayableCategory(handCard);
    const spec = buildEffectSpecForCard(handCard.name, profile);

    if (spec?.canPlay && !spec.canPlay(ctx)) continue;

    if (playable === "pokemon") {
      if (canBenchBasic(scopedState, handCard)) {
        const benchScore = selectBenchTargets({ state: scopedState, profiles }, handCard)[0];
        if (!benchScore || benchScore.score >= -8) {
          actions.push({
            kind: "bench_pokemon",
            cardId: idOf(handCard),
            cardName: handCard.name,
            category: "basic",
          });
        }
      }

      if (canEvolveFromBoard(scopedState, handCard)) {
        const evoTargets = selectEvolutionTargets({ state: scopedState, profiles }, handCard).slice(0, 3);
        const interpreted = interpretCoachCard(handCard, profile);
        if (interpreted) {
          const evolveCategory = interpreted.pokemonStage === "stage2" ? "stage2" : "stage1";
          for (const target of evoTargets) {
            actions.push({
              kind: "evolve",
              cardId: idOf(handCard),
              cardName: handCard.name,
              targetId: target.targetId,
              targetName: target.targetName,
              category: evolveCategory,
            });
          }
        }
      }

      continue;
    }

    if (playable === "energy") {
      if (state.players.player1.energyAttachedThisTurn) continue;
      const interpreted = interpretCoachCard(handCard, profile);
      if (!interpreted || !interpreted.types) continue;
      const energyType = interpreted.types[0] ?? "special";
      const targets = selectEnergyTargets({ state: scopedState, profiles }, energyType).slice(0, 3);
      for (const target of targets) {
        actions.push({
          kind: "attach_energy",
          cardId: idOf(handCard),
          cardName: handCard.name,
          targetId: target.targetId,
          targetName: target.targetName,
        });
      }
      continue;
    }

    if (playable === "supporter") {
      if (state.players.player1.supporterUsed) continue;

      if (category === "gust") {
        const targets = selectGustTargets({ state: scopedState, profiles }, ownActive ?? undefined).slice(0, 3);
        if (targets.length === 0) {
          actions.push({
            kind: "play_supporter",
            cardId: idOf(handCard),
            cardName: handCard.name,
            category: "gust",
          });
        } else {
          for (const target of targets) {
            actions.push({
              kind: "play_supporter",
              cardId: idOf(handCard),
              cardName: handCard.name,
              category: "gust",
              targetId: target.targetId,
              targetName: target.targetName,
            });
          }
        }
      } else if (category === "recovery") {
        const targets = selectRecoveryTargets({ state: scopedState, profiles }).slice(0, 3);
        if (targets.length === 0) {
          actions.push({
            kind: "play_supporter",
            cardId: idOf(handCard),
            cardName: handCard.name,
            category: "recovery",
          });
        } else {
          for (const target of targets) {
            actions.push({
              kind: "play_supporter",
              cardId: idOf(handCard),
              cardName: handCard.name,
              category: "recovery",
              targetId: target.targetId,
              targetName: target.targetName,
            });
          }
        }
      } else {
        actions.push({
          kind: "play_supporter",
          cardId: idOf(handCard),
          cardName: handCard.name,
          category: category === "draw" || category === "search" || category === "disrupt" ? category : "generic",
        });
      }
      continue;
    }

    if (playable === "item") {
      const itemCategory =
        category === "search_basic" || category === "search_any" || category === "switch" || category === "recovery"
          ? category
          : "generic";

      if (itemCategory === "recovery") {
        const targets = selectRecoveryTargets({ state: scopedState, profiles }).slice(0, 3);
        if (targets.length === 0) {
          actions.push({
            kind: "play_item",
            cardId: idOf(handCard),
            cardName: handCard.name,
            category: "recovery",
          });
        } else {
          for (const target of targets) {
            actions.push({
              kind: "play_item",
              cardId: idOf(handCard),
              cardName: handCard.name,
              category: "recovery",
              targetId: target.targetId,
              targetName: target.targetName,
            });
          }
        }
      } else {
        actions.push({
          kind: "play_item",
          cardId: idOf(handCard),
          cardName: handCard.name,
          category: itemCategory,
        });
      }
      continue;
    }

    if (playable === "stadium") {
      actions.push({
        kind: "play_stadium",
        cardId: idOf(handCard),
        cardName: handCard.name,
        category: category === "stadium_control" ? "stadium_control" : category === "board_expansion" ? "board_expansion" : "generic",
      });
      continue;
    }

    if (playable === "tool") {
      for (const targetCard of boardCards) {
        actions.push({
          kind: "play_tool",
          cardId: idOf(handCard),
          cardName: handCard.name,
          targetId: idOf(targetCard),
          targetName: targetCard.name,
        });
      }
    }
  }

  if (ownActive && (ownActive.retreat ?? 0) <= (ownActive.attachedEnergyIds?.length ?? 0) && ownBench.length > 0) {
    for (const benchCard of ownBench) {
      actions.push({
        kind: "retreat",
        fromId: idOf(ownActive),
        fromName: ownActive.name,
        toId: idOf(benchCard),
        toName: benchCard.name,
      });
    }
  }

  if (ownActive) {
    const interpretedActive = interpretCoachCard(ownActive, profileForCard(ownActive, profiles));
    if (interpretedActive && interpretedActive.attacks.length > 0) {
      const targets = selectAttackTargets({ state: scopedState, profiles }, ownActive);
      const top = targets[0];
      for (const attack of interpretedActive.attacks) {
        actions.push({
          kind: "attack",
          sourceId: idOf(ownActive),
          sourceName: ownActive.name,
          attackName: attack.name,
          targetId: top?.targetId,
          targetName: top?.targetName,
        });
      }
    }
  }

  const seen = new Set<string>();
  return actions.filter((action) => {
    const key =
      action.kind === "attack"
        ? `${action.kind}:${action.sourceId}:${action.attackName}:${action.targetId ?? ""}`
        : action.kind === "retreat"
          ? `${action.kind}:${action.fromId}:${action.toId}`
          : action.kind === "bench_pokemon"
            ? `${action.kind}:${action.cardId}`
            : action.kind === "evolve"
              ? `${action.kind}:${action.cardId}:${action.targetId}`
              : "cardId" in action
                ? `${action.kind}:${action.cardId}:${"targetId" in action && action.targetId ? action.targetId : ""}:${"category" in action ? action.category : ""}`
                : `${action.kind}:${"sourceId" in action ? action.sourceId : ""}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
