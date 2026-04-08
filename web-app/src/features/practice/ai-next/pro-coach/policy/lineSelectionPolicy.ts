import type { DynamicRole } from "../../domain/types";
import type {
  LegalAction,
  NextStateEvaluation,
  OpponentThreatInfo,
  PrizePlan,
  ProfessionalLine,
  RiskReport,
  TurnGoal,
} from "../types";

function goalBonus(goal: TurnGoal, action: LegalAction): number {
  if (goal.type === "attack" && action.kind === "attack") return 18;
  if (goal.type === "setup" && (action.kind === "play_item" || action.kind === "use_ability")) return 16;
  if (goal.type === "stall" && (action.kind === "retreat" || action.kind === "play_supporter")) return 14;
  if (goal.type === "disrupt" && action.kind === "play_supporter" && action.category === "gust") return 20;
  if (goal.type === "recover" && ((action.kind === "play_item" && action.category === "recovery") || (action.kind === "play_supporter" && action.category === "recovery"))) return 18;
  if (goal.type === "checkmate" && (action.kind === "attack" || (action.kind === "play_supporter" && action.category === "gust"))) return 22;
  return 0;
}

function roleHints(action: LegalAction, total: number): DynamicRole[] {
  const roles = new Set<string>();

  if (action.kind === "attack") roles.add("swing_turn");
  if (action.kind === "play_supporter" && action.category === "gust") roles.add("finisher_gust");
  if (action.kind === "play_item" && (action.category === "search_basic" || action.category === "search_any")) roles.add("setup_priority");
  if (action.kind === "use_ability" && action.category === "draw") roles.add("stability_engine");
  if (total >= 86) roles.add("force_response");

  return Array.from(roles) as DynamicRole[];
}

function primitiveReasons(action: LegalAction): string[] {
  switch (action.kind) {
    case "attack":
      return ["サイドレースを前進させます。", "相手に返しを要求します。"];
    case "attach_energy":
      return ["次ターン以降の攻撃線を太くします。"];
    case "play_supporter":
      if (action.category === "gust") return ["相手の勝ち筋の中核を直接触れる手です。"];
      if (action.category === "draw") return ["再現性を上げて分岐を増やす手です。"];
      return ["ターンの目的に沿って手札価値を最大化します。"];
    case "play_item":
      if (action.category === "search_basic" || action.category === "search_any") return ["次ターンの必要札に近づく手です。"];
      return ["行動密度を高めます。"];
    case "retreat":
      return ["返しの被害を抑えつつテンポを維持します。"];
    default:
      return ["現在の勝ち筋に沿う実行候補です。"];
  }
}

export function buildProfessionalLine(args: {
  action: LegalAction;
  transition: ProfessionalLine["transition"];
  nextEval: NextStateEvaluation;
  goal: TurnGoal;
  prizePlan: PrizePlan;
  opponentThreat: OpponentThreatInfo;
  risk: RiskReport;
}): ProfessionalLine {
  const { action, transition, nextEval, goal, prizePlan, opponentThreat, risk } = args;

  const lineScore =
    nextEval.total * 0.42 +
    goalBonus(goal, action) +
    prizePlan.successProbability * 0.18 -
    prizePlan.fragilityScore * 0.08 -
    risk.totalRiskScore * 0.14 -
    (opponentThreat.lethalThreat ? 8 : 0) +
    (action.kind === "attack" ? 6 : 0);

  return {
    action,
    transition,
    nextEval,
    replyPenalty: Math.round(opponentThreat.disruptValue * 0.2),
    lineScore,
    dynamicRoles: roleHints(action, lineScore),
    primitiveReasons: primitiveReasons(action),
  };
}
