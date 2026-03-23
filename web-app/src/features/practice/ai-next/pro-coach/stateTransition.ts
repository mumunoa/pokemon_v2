import type { CardRoleProfile } from "../domain/types";
import type { CoachCard, CoachGameState, LegalAction, StateTransitionResult } from "./types";

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function idOf(card: CoachCard): string {
  return String(card.id ?? card.baseCardId ?? card.name);
}

function removeFromHand(hand: CoachCard[], cardId: string): { hand: CoachCard[]; removed?: CoachCard } {
  let removed: CoachCard | undefined;
  const next = hand.filter((card) => {
    const hit = idOf(card) === cardId && !removed;
    if (hit) {
      removed = card;
      return false;
    }
    return true;
  });
  return { hand: next, removed };
}

function createVirtualPokemon(name: string, kind: "basic" | "evolution" = "basic"): CoachCard {
  return {
    id: `virtual:${name}:${Math.random().toString(36).slice(2, 8)}`,
    name,
    type: "pokemon",
    kinds: kind,
    hp: kind === "basic" ? 70 : 140,
    damage: 0,
    retreat: 1,
    attachedEnergyIds: [],
    canAttack: false,
  };
}

import { buildEffectSpecForCard } from "../effects/effectSpecCatalog";

export function applyStateTransition(
  state: CoachGameState,
  action: LegalAction,
  profiles: CardRoleProfile[],
): StateTransitionResult {
  const nextState = cloneState(state);
  const me = nextState.players.player1;
  const opp = nextState.players.player2;
  const transitionSummary: string[] = [];

  const cardName = "cardName" in action ? action.cardName : "sourceName" in action ? action.sourceName : "";
  const profile = profiles.find((p) => p.cardName === cardName);
  const spec = buildEffectSpecForCard(cardName, profile);
  const skeleton = spec?.buildSkeleton(profile);
  const impact = skeleton?.boardImpact;

  switch (action.kind) {
    case "play_supporter": {
      const { hand, removed } = removeFromHand(me.hand, action.cardId);
      me.hand = hand;
      if (removed) me.discard.push(removed);
      me.supporterUsed = true;

      if (impact?.handDelta) {
        for (let i = 0; i < impact.handDelta; i++) {
          me.hand.push({ id: `virtual:draw-${i}`, name: `drawn_card_${i}` });
        }
        transitionSummary.push("手札を補充した。");
      } else if (action.category === "draw") {
        me.hand.push({ id: "virtual:draw-1", name: "drawn_card_1" }, { id: "virtual:draw-2", name: "drawn_card_2" });
        transitionSummary.push("サポートで手札枚数を増やした。");
      }

      if (impact?.gust && action.targetId && opp.bench.length > 0) {
        const benchIndex = opp.bench.findIndex((c) => idOf(c) === action.targetId);
        if (benchIndex >= 0) {
          const oldActive = opp.active;
          opp.active = opp.bench[benchIndex];
          opp.bench.splice(benchIndex, 1);
          if (oldActive) opp.bench.push(oldActive);
        }
        transitionSummary.push("相手ベンチを呼び出した。");
      }

      return { nextState, consumedCardName: removed?.name, transitionSummary };
    }

    case "play_item": {
      const { hand, removed } = removeFromHand(me.hand, action.cardId);
      me.hand = hand;
      if (removed) me.discard.push(removed);

      if (impact?.benchDelta && me.bench.length < 5) {
        for (let i = 0; i < Math.min(impact.benchDelta, 5 - me.bench.length); i++) {
          me.bench.push(createVirtualPokemon("searched_basic", "basic"));
        }
        transitionSummary.push("たねポケモンを展開した。");
      }

      if (impact?.activeSwitch && me.active && me.bench.length > 0) {
        const nextActive = me.bench[0];
        me.bench[0] = me.active;
        me.active = nextActive;
        transitionSummary.push("入れ替えでテンポを作った。");
      }

      if (impact?.discardRecoveryDelta) {
        for (let i = 0; i < impact.discardRecoveryDelta; i++) {
          if (me.discard.length > 0) {
            me.hand.push(me.discard[0]);
            me.discard = me.discard.slice(1);
          }
        }
        transitionSummary.push("トラッシュからリソースを回収した。");
      }

      return { nextState, consumedCardName: removed?.name, transitionSummary };
    }

    case "play_stadium": {
      const { hand, removed } = removeFromHand(me.hand, action.cardId);
      me.hand = hand;
      if (removed) me.discard.push(removed);
      transitionSummary.push("スタジアムを張り替えた。");
      return { nextState, consumedCardName: removed?.name, transitionSummary };
    }

    case "attach_energy": {
      const { hand, removed } = removeFromHand(me.hand, action.cardId);
      me.hand = hand;
      const allTargets = [me.active, ...me.bench].filter(Boolean) as CoachCard[];
      const target = allTargets.find((c) => idOf(c) === action.targetId);
      if (target) {
        target.attachedEnergyIds = [...(target.attachedEnergyIds ?? []), action.cardId];
        target.canAttack = true;
      }
      me.energyAttachedThisTurn = true;
      transitionSummary.push("エネルギーを貼った。");
      return { nextState, consumedCardName: removed?.name, transitionSummary };
    }

    case "use_ability": {
      if (impact?.handDelta) {
        me.hand.push({ id: "virtual:ability-draw", name: "ability_drawn_card" });
        transitionSummary.push("特性でドローした。");
      }
      if (impact?.energyAttachDelta && me.active) {
        me.active.attachedEnergyIds = [...(me.active.attachedEnergyIds ?? []), "virtual:ability-energy"];
        me.active.canAttack = true;
        transitionSummary.push("特性でエネ加速した。");
      }
      return { nextState, transitionSummary };
    }

    case "retreat": {
      if (!me.active) return { nextState, transitionSummary };
      const idx = me.bench.findIndex((c) => idOf(c) === action.toId);
      if (idx >= 0) {
        const oldActive = me.active;
        me.active = me.bench[idx];
        me.bench[idx] = oldActive;
      }
      transitionSummary.push("にげた。");
      return { nextState, transitionSummary };
    }

    case "attack": {
      if (opp.active) {
        opp.active.damage = (opp.active.damage ?? 0) + 120;
      }
      transitionSummary.push("攻撃した。");
      return { nextState, transitionSummary };
    }
    
    default:
      return { nextState, transitionSummary };
  }
}
