import type { ActionCandidate, CardRoleProfile } from "../domain/types";
import type { BoardUrgencyProfile } from "./boardUrgency";

export type CandidateContext = {
  urgency: BoardUrgencyProfile;
  profile: CardRoleProfile;
};

export function buildTemplateCandidates(ctx: CandidateContext): Omit<ActionCandidate, "id" | "cardName">[] {
  const { urgency, profile } = ctx;
  const out: Omit<ActionCandidate, "id" | "cardName">[] = [];

  if (profile.staticRoles.includes("basic_search" as never)) {
    out.push({
      line: "たねポケモンを持ってきてベンチ基盤を作る",
      target: undefined,
      tags: ["search", "bench_setup", "opening"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: urgency.needSetupNow >= 60 ? 3 : 2,
      estimatedStabilityGain: 2,
    });
  }

  if (profile.staticRoles.includes("evolution_search" as never)) {
    out.push({
      line: "進化ラインを揃えて次ターンの主力を確保する",
      target: undefined,
      tags: ["search", "future_line", "evolution"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 2,
      estimatedStabilityGain: 2,
    });
  }

  if (profile.staticRoles.includes("pokemon_search" as never) || profile.staticRoles.includes("pokemon_ex_search" as never)) {
    out.push({
      line: "主力アタッカーかシステムポケモンを確保する",
      target: undefined,
      tags: ["search", "future_line", "stabilize"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 2,
      estimatedStabilityGain: 2,
    });
  }

  if (profile.staticRoles.includes("draw" as never)) {
    out.push({
      line: "追加ドローで必要札へ寄せる",
      target: undefined,
      tags: ["draw", "stabilize"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: urgency.needSetupNow > 55 ? 1 : 0,
      estimatedStabilityGain: 3,
    });
  }

  if (profile.staticRoles.includes("hand_refresh" as never)) {
    out.push({
      line: "手札を更新して事故を解消する",
      target: undefined,
      tags: ["draw", "refresh", "stabilize"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 1,
      estimatedStabilityGain: 4,
    });
  }

  if (profile.staticRoles.includes("topdeck_tutor" as never)) {
    out.push({
      line: "次ターンの確定ルートを上に固定する",
      target: undefined,
      tags: ["future_line", "topdeck", "stabilize"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 1,
      estimatedStabilityGain: 3,
    });
  }

  if (profile.staticRoles.includes("switch" as never) || profile.staticRoles.includes("pivot" as never)) {
    out.push({
      line: "アクティブを入れ替えてテンポを維持する",
      target: undefined,
      tags: ["switch", "tempo", "protect"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 1,
      estimatedStabilityGain: 2,
    });
  }

  if (profile.staticRoles.includes("energy_accel" as never)) {
    out.push({
      line: "エネルギーを前倒しして攻撃開始ターンを早める",
      target: undefined,
      tags: ["energy", "future_line", "setup"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 2,
      estimatedStabilityGain: 1,
    });
  }

  if (profile.staticRoles.includes("resource_recovery" as never) || profile.staticRoles.includes("recovery" as never)) {
    out.push({
      line: "落ちた重要札や盤面を回復して立て直す",
      target: undefined,
      tags: ["recover", "stabilize", "future_line"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 1,
      estimatedStabilityGain: 2,
    });
  }

  if (profile.staticRoles.includes("stadium_control" as never) || profile.staticRoles.includes("board_expansion" as never)) {
    out.push({
      line: "スタジアムで盤面条件を有利に変える",
      target: undefined,
      tags: ["stadium", "tempo", "force_response"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 2,
      estimatedStabilityGain: 1,
    });
  }

  if (profile.staticRoles.includes("stall" as never) || profile.staticRoles.includes("disrupt" as never)) {
    out.push({
      line: "相手のテンポを止めて育成ターンを確保する",
      target: undefined,
      tags: ["stall", "tempo", "force_response"],
      estimatedPrizeSwing: 0,
      estimatedSetupGain: 1,
      estimatedStabilityGain: 1,
    });
  }

  return out;
}
