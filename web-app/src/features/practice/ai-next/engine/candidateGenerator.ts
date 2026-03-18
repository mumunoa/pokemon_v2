import type { ActionCandidate, BoardState, CardRoleProfile, DynamicRole } from "../domain/types";
import type { BoardUrgencyProfile } from "./boardUrgency";

type CardInstanceLike = {
  instanceId?: string;
  name: string;
  type?: string;
};

type DeckContext = {
  archetype?: string;
  preferredAttackers?: string[];
};

function createCandidate(
  id: string,
  cardName: string,
  line: string,
  tags: string[],
  target: string | undefined,
  estimatedPrizeSwing: number,
  estimatedSetupGain: number,
  estimatedStabilityGain: number,
): ActionCandidate {
  return {
    id,
    cardName,
    line,
    tags,
    target,
    estimatedPrizeSwing,
    estimatedSetupGain,
    estimatedStabilityGain,
  };
}

function hasRole(profile: CardRoleProfile | undefined, role: string): boolean {
  return !!profile?.staticRoles?.includes(role as never);
}

export function buildActionCandidatesFromProfiles(
  board: BoardState,
  handCards: CardInstanceLike[],
  profiles: CardRoleProfile[],
  urgency: BoardUrgencyProfile,
  deckContext: DeckContext,
): ActionCandidate[] {
  const candidates: ActionCandidate[] = [];

  for (const handCard of handCards) {
    const profile = profiles.find((item) => item.cardName === handCard.name);
    if (!profile) continue;

    if (hasRole(profile, "basic_search")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-basic-setup`,
          handCard.name,
          "たねポケモンを確保してベンチを安定させる",
          ["bench_setup", "search", "setup"],
          undefined,
          0,
          urgency.needSetupNow >= 50 ? 3 : 2,
          2,
        ),
      );
    }

    if (hasRole(profile, "evolution_search")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-evo-line`,
          handCard.name,
          "進化ラインを揃えて次ターンの出力を確保する",
          ["search", "evolution", "future_line"],
          undefined,
          0,
          2,
          2,
        ),
      );
    }

    if (hasRole(profile, "pokemon_search")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-search-attacker`,
          handCard.name,
          "主力アタッカーかシステムポケモンを確保する",
          ["search", "setup", "stabilize"],
          undefined,
          0,
          2,
          2,
        ),
      );
    }

    if (hasRole(profile, "draw") || hasRole(profile, "hand_refresh") || hasRole(profile, "topdeck_tutor")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-draw-out`,
          handCard.name,
          "必要札へ到達するために手札を掘り進める",
          ["draw", "search", "stabilize"],
          undefined,
          0,
          urgency.needSetupNow >= 60 ? 1 : 0,
          urgency.needDrawNow >= 60 ? 4 : 3,
        ),
      );
    }

    if (hasRole(profile, "switch") || hasRole(profile, "pivot")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-switch-pivot`,
          handCard.name,
          "アクティブを入れ替えて攻撃役またはピボットへ繋ぐ",
          ["switch", "tempo", "recover"],
          undefined,
          0,
          1,
          2,
        ),
      );
    }

    if (hasRole(profile, "gust")) {
      for (const target of board.opponentBench) {
        candidates.push(
          createCandidate(
            `${handCard.instanceId ?? handCard.name}-gust-${target.cardId}`,
            handCard.name,
            `${target.name} を呼び出して盤面を崩す`,
            ["gust", "swing", "force_response"],
            target.name,
            target.isSystem ? 2 : 1,
            0,
            target.isSystem ? 2 : 1,
          ),
        );
      }
    }

    if (hasRole(profile, "energy_accel") || hasRole(profile, "energy_recovery")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-energy`,
          handCard.name,
          "エネルギー供給を進めて攻撃準備を整える",
          ["energy", "setup", "future_line"],
          undefined,
          0,
          2,
          1,
        ),
      );
    }

    if (hasRole(profile, "resource_recovery") || hasRole(profile, "recovery")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-recover-board`,
          handCard.name,
          "落ちた重要札や盤面を回復して立て直す",
          ["rebuild", "recover", "stabilize"],
          undefined,
          0,
          1,
          2,
        ),
      );
    }

    if (hasRole(profile, "stadium_control") || hasRole(profile, "board_expansion")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-stadium-control`,
          handCard.name,
          "スタジアムで盤面条件を有利に変える",
          ["stadium", "force_response", "swing"],
          undefined,
          0,
          2,
          1,
        ),
      );
    }

    if (hasRole(profile, "stall") || hasRole(profile, "disrupt")) {
      candidates.push(
        createCandidate(
          `${handCard.instanceId ?? handCard.name}-stall`,
          handCard.name,
          "相手のテンポを止めて育成ターンを稼ぐ",
          ["stall", "force_response", "swing"],
          undefined,
          0,
          1,
          1,
        ),
      );
    }
  }

  return candidates;
}

export function inferDynamicRolesForCandidate(action: ActionCandidate, board: BoardState): DynamicRole[] {
  const roles: DynamicRole[] = [];

  if (action.tags.includes("gust")) {
    if (action.target && board.opponentBench.some((card) => card.name === action.target && card.isSystem)) {
      roles.push("system_snipe");
    } else if (action.target && board.opponentBench.some((card) => card.name === action.target && (card.retreat ?? 0) >= 2)) {
      roles.push("stall_trap");
    } else {
      roles.push("finisher_gust");
    }
  }

  if (action.tags.includes("draw")) roles.push("desperate_draw");
  if (action.tags.includes("bench_setup")) roles.push("bench_fill_now", "setup_priority");
  if (action.tags.includes("switch")) roles.push("retreat_pivot");
  if (action.tags.includes("recover")) roles.push("recover_board");
  if (action.tags.includes("force_response")) roles.push("force_response");
  if (action.tags.includes("swing")) roles.push("swing_turn");

  return [...new Set(roles)];
}
