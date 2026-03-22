import type { ActionCandidate, BoardState, CardRoleProfile, DynamicRole } from "../domain/types";
import type { BoardUrgencyProfile } from "./boardUrgency";
import { buildTemplateCandidates } from "./candidateTemplates";

type HandCardLike = { instanceId?: string; name: string };

function actionId(cardName: string, seed: string): string {
  return `${cardName}:${seed}`;
}

function dedupeCandidates(actions: ActionCandidate[]): ActionCandidate[] {
  const map = new Map<string, ActionCandidate>();
  for (const action of actions) {
    const key = `${action.cardName}::${action.line}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, action);
      continue;
    }
    const nextValue = action.estimatedPrizeSwing + action.estimatedSetupGain + action.estimatedStabilityGain;
    const prevValue = prev.estimatedPrizeSwing + prev.estimatedSetupGain + prev.estimatedStabilityGain;
    if (nextValue > prevValue) map.set(key, action);
  }
  return [...map.values()];
}

function buildSequenceAwareCandidates(
  board: BoardState,
  handCard: HandCardLike,
  profile: CardRoleProfile,
  urgency: BoardUrgencyProfile,
): ActionCandidate[] {
  const actions: ActionCandidate[] = [];
  const isOpening = urgency.phase === "opening";
  const hasBenchRoom = board.bench.length < 5;

  if (profile.staticRoles.includes("bench_setup" as never) && hasBenchRoom) {
    actions.push({
      id: actionId(handCard.name, "sequence:bench-first"),
      cardName: handCard.name,
      line: "先にベンチを伸ばして次ターンの主力ラインを確保する",
      target: undefined,
      tags: ["bench_setup", "setup", "future_line"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: isOpening ? 3 : 2,
      estimatedStabilityGain: 2,
    });
  }

  if (profile.staticRoles.includes("draw" as never) || profile.staticRoles.includes("draw_support" as never)) {
    actions.push({
      id: actionId(handCard.name, "sequence:draw-bridge"),
      cardName: handCard.name,
      line: "必要札が足りない場合にだけ手札を更新して再現性を確保する",
      target: undefined,
      tags: ["draw", "future_line"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: urgency.needSetupNow >= 60 ? 1 : 0,
      estimatedStabilityGain: urgency.reachability.hasImmediateBenchAccess ? 1 : 3,
    });
  }

  if (
    profile.staticRoles.includes("energy" as never) ||
    profile.staticRoles.includes("energy_search" as never) ||
    profile.staticRoles.includes("energy_search_item" as never)
  ) {
    actions.push({
      id: actionId(handCard.name, "sequence:energy-attach"),
      cardName: handCard.name,
      line: "エネルギー到達を確保して攻撃成立を前倒しする",
      target: board.active?.name,
      tags: ["energy", "setup", "tempo"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 1,
      estimatedStabilityGain: 2,
    });
  }

  if (
    profile.staticRoles.includes("search" as never) ||
    profile.staticRoles.includes("search_support" as never)
  ) {
    actions.push({
      id: actionId(handCard.name, "sequence:search-main-line"),
      cardName: handCard.name,
      line: "主力アタッカーかシステム札へ接続して次ターンの再現性を上げる",
      target: undefined,
      tags: ["search", "bench_setup", "future_line"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 2,
      estimatedStabilityGain: 2,
    });
  }

  return actions;
}

export function buildActionCandidatesFromProfiles(
  board: BoardState,
  handCards: HandCardLike[],
  profiles: CardRoleProfile[],
  urgency: BoardUrgencyProfile,
): ActionCandidate[] {
  const actions: ActionCandidate[] = [];

  for (const handCard of handCards) {
    const profile = profiles.find((p) => p.cardName === handCard.name);
    if (!profile) continue;

    const templated = buildTemplateCandidates({ urgency, profile }).map((row, index) => ({
      id: actionId(handCard.name, `${index}`),
      cardName: handCard.name,
      ...row,
    }));

    actions.push(...templated);
    actions.push(...buildSequenceAwareCandidates(board, handCard, profile, urgency));

    if (profile.staticRoles.includes("gust" as never)) {
      for (const target of board.opponentBench) {
        actions.push({
          id: actionId(handCard.name, `gust:${target.cardId}`),
          cardName: handCard.name,
          line: `${target.name} を呼び出して盤面を崩す`,
          target: target.name,
          tags: ["gust", "tempo", "force_response"],
          estimatedPrizeSwing: target.isSystem ? 2 : 1,
          estimatedSetupGain: 0,
          estimatedStabilityGain: target.isSystem ? 2 : 1,
        });
      }
      if (board.opponentActive) {
        actions.push({
          id: actionId(handCard.name, "gust-active-check"),
          cardName: handCard.name,
          line: "ボスを温存して次ターンの詰め札として構える",
          target: undefined,
          tags: ["future_line", "endgame"],
          estimatedPrizeSwing: 0,
          estimatedSetupGain: 0,
          estimatedStabilityGain: 1,
        });
      }
    }

    if (
      profile.staticRoles.includes("damage_boost" as never) &&
      board.opponentActive &&
      ((board.opponentActive.hp ?? 999) - board.opponentActive.damage <= 240)
    ) {
      actions.push({
        id: actionId(handCard.name, "damage-push"),
        cardName: handCard.name,
        line: "このターンの打点を伸ばしてサイドを先行する",
        target: board.opponentActive.name,
        tags: ["damage", "tempo", "endgame"],
        estimatedPrizeSwing: 2,
        estimatedSetupGain: 0,
        estimatedStabilityGain: 0,
      });
    }
  }

  return dedupeCandidates(actions);
}

export function inferDynamicRoles(
  action: ActionCandidate,
  board: BoardState,
  urgency: BoardUrgencyProfile,
): DynamicRole[] {
  const roles: DynamicRole[] = [];

  if (action.tags.includes("gust")) {
    if (action.target && board.opponentBench.some((p) => p.name === action.target && p.isSystem)) {
      roles.push("system_snipe");
    } else if (action.target && board.opponentBench.some((p) => p.name === action.target && (p.retreat ?? 0) >= 2)) {
      roles.push("stall_trap");
    } else {
      roles.push("finisher_gust");
    }
  }

  if (action.tags.includes("draw") && urgency.needDrawNow >= 60 && !urgency.reachability.hasImmediateBenchAccess) {
    roles.push("desperate_draw");
  }
  if (action.tags.includes("bench_setup")) roles.push("bench_fill_now", "setup_priority");
  if (action.tags.includes("switch")) roles.push("retreat_pivot");
  if (action.tags.includes("recover")) roles.push("recover_board");
  if (action.tags.includes("tempo")) roles.push("swing_turn");
  if (action.tags.includes("force_response")) roles.push("force_response");

  return [...new Set(roles)];
}
