import type { CardRoleProfile } from "../domain/types";
import type { CoachCard, CoachGameState, LegalAction } from "./types";

function idOf(card: CoachCard): string {
  return String(card.id ?? card.baseCardId ?? card.name);
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

import { buildEffectSpecForCard } from "../effects/effectSpecCatalog";
import type { EffectContext } from "../effects/effectSpecTypes";
import { extractBoardFeatures } from "./featureExtractor";

export function generateLegalActions(
  state: CoachGameState,
  profiles: CardRoleProfile[],
): LegalAction[] {
  const me = state.players.player1;
  const opp = state.players.player2;
  const allOwnPokemon = [me.active, ...me.bench].filter(Boolean) as CoachCard[];
  const actions: LegalAction[] = [];

  const handProfiles = profiles.filter((p) => me.hand.some(c => c.name === p.cardName));
  const features = extractBoardFeatures(state, handProfiles);

  const ctx: EffectContext = {
    phase: features.phase,
    setupNeed: features.setupNeed,
    drawNeed: features.drawNeed,
    gustNeed: features.gustNeed,
    safetyNeed: features.safetyNeed,
    handSize: me.hand.length,
    ownBenchCount: features.ownBenchCount,
    oppBenchCount: features.oppBenchCount,
    supporterUsed: me.supporterUsed,
    energyAttachedThisTurn: me.energyAttachedThisTurn,
    hasFreeBenchSlot: features.ownBenchCount < 5,
    opponentHasSystem: features.oppSystemCount > 0,
    opponentHasHeavyRetreat: features.oppHeavyRetreatCount > 0,
  };

  for (const card of me.hand) {
    const profile = profiles.find((p) => p.cardName === card.name);
    const category = effectCategoryFromProfile(profile);
    const spec = buildEffectSpecForCard(card.name, profile);

    if (spec && spec.canPlay && !spec.canPlay(ctx)) continue;

    if (card.type === "trainer" && card.kinds === "supporter" && !me.supporterUsed) {
      if (category === "gust") {
        for (const target of opp.bench) {
          actions.push({
            kind: "play_supporter",
            cardId: idOf(card),
            cardName: card.name,
            category: "gust",
            targetId: idOf(target),
            targetName: target.name,
          });
        }
      } else {
        actions.push({
          kind: "play_supporter",
          cardId: idOf(card),
          cardName: card.name,
          category: ["draw", "search", "disrupt", "recovery"].includes(category) ? (category as any) : "generic",
        });
      }
    }

    if (card.type === "trainer" && card.kinds === "item") {
      actions.push({
        kind: "play_item",
        cardId: idOf(card),
        cardName: card.name,
        category:
          category === "search_basic" || category === "search_any" || category === "switch" || category === "recovery"
            ? (category as any)
            : "generic",
      });
    }

    if (card.type === "trainer" && card.kinds === "stadium") {
      actions.push({
        kind: "play_stadium",
        cardId: idOf(card),
        cardName: card.name,
        category: category === "board_expansion" || category === "stadium_control" ? (category as any) : "generic",
      });
    }

    if (card.type === "trainer" && card.kinds === "tool") {
      for (const target of allOwnPokemon) {
        actions.push({
          kind: "play_tool",
          cardId: idOf(card),
          cardName: card.name,
          targetId: idOf(target),
          targetName: target.name,
        });
      }
    }

    if (card.type === "energy" && !me.energyAttachedThisTurn) {
      for (const target of allOwnPokemon) {
        actions.push({
          kind: "attach_energy",
          cardId: idOf(card),
          cardName: card.name,
          targetId: idOf(target),
          targetName: target.name,
        });
      }
    }
  }

  for (const pokemon of allOwnPokemon) {
    const profile = profiles.find((p) => p.cardName === pokemon.name);
    if (!profile) continue;
    const category = effectCategoryFromProfile(profile);
    if (["draw", "search", "energy"].includes(category)) {
      actions.push({
        kind: "use_ability",
        sourceId: idOf(pokemon),
        sourceName: pokemon.name,
        category: category as any,
      });
    }
  }

  if (me.active && me.bench.length > 0 && (features.canRetreat || features.hasFreePivot)) {
    for (const target of me.bench) {
      actions.push({
        kind: "retreat",
        fromId: idOf(me.active),
        fromName: me.active.name,
        toId: idOf(target),
        toName: target.name,
      });
    }
  }

  if (features.activeEnergyReady) {
    const attacks = me.active?.attacks?.length ? me.active.attacks : [{ name: "ワザ" }];
    for (const attack of attacks) {
      actions.push({
        kind: "attack",
        sourceId: idOf(me.active!),
        sourceName: me.active!.name,
        attackName: String(attack.name ?? "ワザ"),
        targetName: opp.active?.name,
      });
    }
  }

  return dedupe(actions);
}

function dedupe(actions: LegalAction[]): LegalAction[] {
  const seen = new Set<string>();
  const out: LegalAction[] = [];
  for (const action of actions) {
    const key = JSON.stringify(action);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
  }
  return out;
}
