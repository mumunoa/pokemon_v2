import type { ActionCandidate, BoardState, CardRoleProfile, DynamicRole } from "../domain/types";
import type { BoardUrgencyProfile } from "./boardUrgency";
import { buildTemplateCandidates } from "./candidateTemplates";

type HandCardLike = { instanceId?: string; name: string };

function actionId(cardName: string, seed: string): string {
  return `${cardName}:${seed}`;
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
          id: actionId(handCard.name, `gust-active-check`),
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

  return actions;
}

export function inferDynamicRoles(action: ActionCandidate, board: BoardState, urgency: BoardUrgencyProfile): DynamicRole[] {
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

  if (action.tags.includes("draw") && urgency.needDrawNow >= 60) roles.push("desperate_draw");
  if (action.tags.includes("bench_setup")) roles.push("bench_fill_now", "setup_priority");
  if (action.tags.includes("switch")) roles.push("retreat_pivot");
  if (action.tags.includes("recover")) roles.push("recover_board");
  if (action.tags.includes("tempo")) roles.push("swing_turn");
  if (action.tags.includes("force_response")) roles.push("force_response");

  return [...new Set(roles)];
}
