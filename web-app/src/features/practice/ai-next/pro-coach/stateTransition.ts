import type { CardRoleProfile } from "../domain/types";
import { interpretCoachCard } from "./cardInterpreter";
import { canPayAttackCost } from "./costEvaluator";
import { calculateExpectedAttackResult } from "./damageCalculator";
import type { CoachCard, CoachGameState, LegalAction, StateTransitionResult } from "./types";

type LooseCardRecord = Record<string, unknown>;
type ScopedCardMap = Record<string, LooseCardRecord>;

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

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

function findOwnBoardCard(state: CoachGameState, targetId: string): { zone: "active" | "bench"; index?: number; card: CoachCard | null } {
  const active = state.players.player1.active;
  if (active && idOf(active) === targetId) {
    return { zone: "active", card: active };
  }

  const index = state.players.player1.bench.findIndex((card) => idOf(card) === targetId);
  return { zone: "bench", index, card: index >= 0 ? state.players.player1.bench[index] : null };
}

function findOppBoardCard(state: CoachGameState, targetId: string): { zone: "active" | "bench"; index?: number; card: CoachCard | null } {
  const active = state.players.player2.active;
  if (active && idOf(active) === targetId) {
    return { zone: "active", card: active };
  }

  const index = state.players.player2.bench.findIndex((card) => idOf(card) === targetId);
  return { zone: "bench", index, card: index >= 0 ? state.players.player2.bench[index] : null };
}

function removeHandCard(state: CoachGameState, cardId: string): CoachCard | null {
  const index = state.players.player1.hand.findIndex((card) => idOf(card) === cardId);
  if (index < 0) return null;
  const [removed] = state.players.player1.hand.splice(index, 1);
  return removed ?? null;
}

function updateBoardCard(state: CoachGameState, targetId: string, nextCard: CoachCard): void {
  if (state.players.player1.active && idOf(state.players.player1.active) === targetId) {
    state.players.player1.active = nextCard;
    return;
  }
  const benchIndex = state.players.player1.bench.findIndex((card) => idOf(card) === targetId);
  if (benchIndex >= 0) {
    state.players.player1.bench[benchIndex] = nextCard;
  }
}

function recalcCanAttack(state: CoachGameState, card: CoachCard, profiles: CardRoleProfile[]): CoachCard {
  const interpreted = interpretCoachCard(enrichWithScopedRecord(state, card), profileForCard(card, profiles));
  const ready = interpreted ? interpreted.attacks.some((attack: any) =>
    canPayAttackCost({
      attackCost: attack.cost,
      attachedEnergies: interpreted.attachedEnergyTypes,
    }).ready
  ) : false;

  return {
    ...card,
    canAttack: ready,
  };
}

function pickRecoveryCard(state: CoachGameState, targetId?: string): CoachCard | null {
  if (targetId) {
    const index = state.players.player1.discard.findIndex((card) => idOf(card) === targetId);
    if (index >= 0) {
      const [picked] = state.players.player1.discard.splice(index, 1);
      return picked ?? null;
    }
  }
  return state.players.player1.discard.shift() ?? null;
}

function pushVirtualDraw(state: CoachGameState, roleLabel: string): void {
  state.players.player1.hand.push({
    id: `virtual:draw:${roleLabel}:${state.turn}:${state.players.player1.hand.length}`,
    name: `仮想ドロー(${roleLabel})`,
    type: "trainer",
    kinds: "item",
    tags: ["virtual", roleLabel],
  });
}

function pushRecoveredCardToHand(state: CoachGameState, card: CoachCard): void {
  state.players.player1.hand.push(card);
}

function computeConsumedCardName(action: LegalAction): string | undefined {
  if ("cardName" in action) return action.cardName;
  return undefined;
}

export function applyStateTransition(
  state: CoachGameState,
  action: LegalAction,
  profiles: CardRoleProfile[],
): StateTransitionResult {
  const nextState = cloneState(state);
  const transitionSummary: string[] = [];

  nextState.players.player1.active = nextState.players.player1.active
    ? enrichWithScopedRecord(nextState, nextState.players.player1.active)
    : null;
  nextState.players.player1.bench = nextState.players.player1.bench.map((card) => enrichWithScopedRecord(nextState, card));
  nextState.players.player1.hand = nextState.players.player1.hand.map((card) => enrichWithScopedRecord(nextState, card));
  nextState.players.player1.discard = nextState.players.player1.discard.map((card) => enrichWithScopedRecord(nextState, card));
  nextState.players.player2.active = nextState.players.player2.active
    ? enrichWithScopedRecord(nextState, nextState.players.player2.active)
    : null;
  nextState.players.player2.bench = nextState.players.player2.bench.map((card) => enrichWithScopedRecord(nextState, card));

  switch (action.kind) {
    case "bench_pokemon": {
      const card = removeHandCard(nextState, action.cardId);
      if (card && nextState.players.player1.bench.length < 5) {
        nextState.players.player1.bench.push({
          ...card,
          enteredTurn: nextState.turn,
          evolvedTurn: undefined,
          canAttack: false,
        });
        transitionSummary.push(`${action.cardName} をベンチに出しました。`);
      }
      break;
    }

    case "evolve": {
      const evoCard = removeHandCard(nextState, action.cardId);
      const target = findOwnBoardCard(nextState, action.targetId);

      if (evoCard && target.card) {
        const base = target.card;
        const evolved: CoachCard = {
          ...base,
          ...evoCard,
          id: base.id,
          baseCardId: evoCard.baseCardId ?? evoCard.id ?? base.baseCardId,
          attachedEnergyIds: base.attachedEnergyIds ?? [],
          attachedEnergyTypes: base.attachedEnergyTypes ?? [],
          damage: base.damage ?? 0,
          enteredTurn: base.enteredTurn,
          evolvedTurn: nextState.turn,
        };

        const recalced = recalcCanAttack(nextState, evolved, profiles);
        updateBoardCard(nextState, action.targetId, recalced);
        transitionSummary.push(`${action.targetName} を ${action.cardName} に進化させました。`);
      }
      break;
    }

    case "play_supporter": {
      const consumed = removeHandCard(nextState, action.cardId);
      nextState.players.player1.supporterUsed = true;

      if (action.category === "draw") {
        pushVirtualDraw(nextState, "draw");
        pushVirtualDraw(nextState, "draw");
        pushVirtualDraw(nextState, "draw");
        transitionSummary.push(`${action.cardName} を使い、手札の再現性を上げました。`);
      } else if (action.category === "search") {
        pushVirtualDraw(nextState, "search");
        transitionSummary.push(`${action.cardName} で必要札に触れるラインを作りました。`);
      } else if (action.category === "gust" && action.targetId) {
        const oppTarget = findOppBoardCard(nextState, action.targetId);
        if (oppTarget.zone === "bench" && typeof oppTarget.index === "number" && oppTarget.card && nextState.players.player2.active) {
          const currentActive = nextState.players.player2.active;
          nextState.players.player2.active = oppTarget.card;
          nextState.players.player2.bench[oppTarget.index] = currentActive;
          transitionSummary.push(`${action.cardName} で ${oppTarget.card.name} を前に呼びました。`);
        }
      } else if (action.category === "recovery") {
        const recovered = pickRecoveryCard(nextState, action.targetId);
        if (recovered) {
          pushRecoveredCardToHand(nextState, recovered);
          transitionSummary.push(`${action.cardName} で ${recovered.name} を回収しました。`);
        } else {
          transitionSummary.push(`${action.cardName} は使いましたが、有効な回収先はありませんでした。`);
        }
      } else if (action.category === "disrupt") {
        transitionSummary.push(`${action.cardName} で相手の返しの再現性を下げるラインを選びました。`);
      } else {
        transitionSummary.push(`${action.cardName} を使いました。`);
      }

      if (consumed) nextState.players.player1.discard.push(consumed);
      break;
    }

    case "play_item": {
      const consumed = removeHandCard(nextState, action.cardId);

      if (action.category === "switch" && action.targetId) {
        const ownTarget = findOwnBoardCard(nextState, action.targetId);
        if (ownTarget.zone === "bench" && typeof ownTarget.index === "number" && ownTarget.card && nextState.players.player1.active) {
          const currentActive = nextState.players.player1.active;
          nextState.players.player1.active = ownTarget.card;
          nextState.players.player1.bench[ownTarget.index] = currentActive;
          transitionSummary.push(`${action.cardName} で ${ownTarget.card.name} を前に出しました。`);
        }
      } else if (action.category === "search_basic" || action.category === "search_any") {
        pushVirtualDraw(nextState, action.category === "search_basic" ? "basic_search" : "search_any");
        transitionSummary.push(`${action.cardName} で必要な展開札に近づきました。`);
      } else if (action.category === "recovery") {
        const recovered = pickRecoveryCard(nextState, action.targetId);
        if (recovered) {
          pushRecoveredCardToHand(nextState, recovered);
          transitionSummary.push(`${action.cardName} で ${recovered.name} を回収しました。`);
        }
      } else {
        transitionSummary.push(`${action.cardName} を使いました。`);
      }

      if (consumed) nextState.players.player1.discard.push(consumed);
      break;
    }

    case "play_stadium": {
      const consumed = removeHandCard(nextState, action.cardId);
      transitionSummary.push(`${action.cardName} をスタジアムとして設置しました。`);
      if (consumed) nextState.players.player1.discard.push(consumed);
      break;
    }

    case "play_tool": {
      const consumed = removeHandCard(nextState, action.cardId);
      const target = findOwnBoardCard(nextState, action.targetId);
      if (target.card) {
        const updated: CoachCard = {
          ...target.card,
          tags: Array.from(new Set([...(target.card.tags ?? []), `tool:${action.cardName}`])),
        };
        updateBoardCard(nextState, action.targetId, updated);
        transitionSummary.push(`${action.targetName} に ${action.cardName} をつけました。`);
      }
      if (consumed) nextState.players.player1.discard.push(consumed);
      break;
    }

    case "use_ability": {
      const source = nextState.players.player1.active && idOf(nextState.players.player1.active) === action.sourceId
        ? nextState.players.player1.active
        : nextState.players.player1.bench.find((card) => idOf(card) === action.sourceId) ?? null;

      if (source) {
        const updated: CoachCard = {
          ...source,
          turnFlags: {
            ...(source.turnFlags ?? {}),
            abilityUsed: true,
          },
        };
        updateBoardCard(nextState, action.sourceId, updated);
      }

      if (action.category === "draw") {
        pushVirtualDraw(nextState, "ability_draw");
        pushVirtualDraw(nextState, "ability_draw");
        transitionSummary.push(`${action.sourceName} の特性で手札を補充しました。`);
      } else if (action.category === "search") {
        pushVirtualDraw(nextState, "ability_search");
        transitionSummary.push(`${action.sourceName} の特性で必要札に近づきました。`);
      } else if (action.category === "energy") {
        transitionSummary.push(`${action.sourceName} の特性でエネルギー線を補助しました。`);
      } else {
        transitionSummary.push(`${action.sourceName} の特性を使いました。`);
      }
      break;
    }

    case "attach_energy": {
      const energyCard = removeHandCard(nextState, action.cardId);
      const target = findOwnBoardCard(nextState, action.targetId);

      if (energyCard && target.card) {
        const interpretedEnergy = interpretCoachCard(energyCard, profileForCard(energyCard, profiles));
        const attachedType = interpretedEnergy?.type === "energy" ? (interpretedEnergy.types[0] ?? "special") : "special";

        const updated: CoachCard = {
          ...target.card,
          attachedEnergyIds: [...(target.card.attachedEnergyIds ?? []), idOf(energyCard)],
          attachedEnergyTypes: [...(target.card.attachedEnergyTypes ?? []), attachedType],
        };

        const recalced = recalcCanAttack(nextState, updated, profiles);
        updateBoardCard(nextState, action.targetId, recalced);
        nextState.players.player1.energyAttachedThisTurn = true;

        transitionSummary.push(`${action.targetName} に ${action.cardName} を手貼りしました。`);
        if (recalced.canAttack) {
          transitionSummary.push(`この手貼りで ${action.targetName} の攻撃可能ラインが開きました。`);
        }
      }
      break;
    }

    case "retreat": {
      const active = nextState.players.player1.active;
      const target = findOwnBoardCard(nextState, action.toId);
      if (active && target.zone === "bench" && typeof target.index === "number" && target.card) {
        nextState.players.player1.active = target.card;
        nextState.players.player1.bench[target.index] = active;
        transitionSummary.push(`${action.fromName} を下げて ${action.toName} を前に出しました。`);
      }
      break;
    }

    case "attack": {
      const attacker = nextState.players.player1.active;
      const defender = action.targetId ? findOppBoardCard(nextState, action.targetId).card : nextState.players.player2.active;
      if (attacker && defender) {
        const enrichedAttacker = enrichWithScopedRecord(nextState, attacker);
        const enrichedDefender = enrichWithScopedRecord(nextState, defender);
        const attackerProfile = profileForCard(enrichedAttacker, profiles);
        const defenderProfile = profileForCard(enrichedDefender, profiles);

        const result = calculateExpectedAttackResult({
          attacker: interpretCoachCard(enrichedAttacker, attackerProfile),
          defender: interpretCoachCard(enrichedDefender, defenderProfile),
          attackName: action.attackName,
        });

        const targetInfo = action.targetId ? findOppBoardCard(nextState, action.targetId) : { zone: "active" as const, card: nextState.players.player2.active, index: undefined };
        if (targetInfo.card) {
          const nextDefenderDamage = (targetInfo.card.damage ?? 0) + result.expectedDamage;
          const damaged = { ...targetInfo.card, damage: nextDefenderDamage };

          if (targetInfo.zone === "active") {
            nextState.players.player2.active = damaged;
          } else if (typeof targetInfo.index === "number") {
            nextState.players.player2.bench[targetInfo.index] = damaged;
          }

          transitionSummary.push(`${action.attackName} を使い ${result.expectedDamage} ダメージ見込みです。`);

          if (result.knockout) {
            nextState.players.player1.prizesTaken += result.expectedPrizes;
            transitionSummary.push(`${targetInfo.card.name} をきぜつさせ、サイドを ${result.expectedPrizes} 枚進める見込みです。`);

            if (targetInfo.zone === "active") {
              nextState.players.player2.discard.push(nextState.players.player2.active as CoachCard);
              nextState.players.player2.active = nextState.players.player2.bench.shift() ?? null;
            } else if (typeof targetInfo.index === "number") {
              const [koed] = nextState.players.player2.bench.splice(targetInfo.index, 1);
              if (koed) nextState.players.player2.discard.push(koed);
            }
          }
        }
      }
      break;
    }
  }

  return {
    nextState,
    consumedCardName: computeConsumedCardName(action),
    transitionSummary,
  };
}
