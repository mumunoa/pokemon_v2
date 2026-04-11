import type {
  OpponentThreatInfo,
  PrizePlan,
  ProfessionalCoachResult,
  RiskReport,
  TurnGoal,
} from "../types";

export function buildThoughts(args: {
  phase: "opening" | "midgame" | "endgame";
  goal: TurnGoal;
  prizePlan: PrizePlan;
  risk: RiskReport;
  opponentThreat: OpponentThreatInfo;
  bestLineText: string;
}): string[] {
  const { phase, goal, prizePlan, risk, opponentThreat, bestLineText } = args;

  const riskMessages = [
    `〖リスク〗総合リスク ${risk.totalRiskScore}/100。`,
    `手札崩壊:${risk.handCollapseRisk} / 盤面崩壊:${risk.boardCollapseRisk}`,
    `山札切れ:${risk.deckOutRisk} / リソース損失:${risk.resourceLossRisk}`
  ];

  const warnings = [];
  if (risk.deckOutRisk > 60) warnings.push("【警告】山札が枯渇寸前です。不用意なドロー/トラッシュを避けるべき局面です。");
  if (risk.resourceLossRisk > 50) warnings.push("【注意】手札に重要札が固まっています。コストとしての破棄には慎重な判断が必要です。");

  return [
    `〖局面〗${phase === "opening" ? "序盤" : phase === "midgame" ? "中盤" : "終盤"}。今ターンは「${goal.type}」として扱います。`,
    `〖ゴール〗${goal.primaryReason}`,
    `〖勝ち筋〗サイドプランは [${prizePlan.pattern.join(" → ")}] を主軸に見ます。`,
    `〖返し警戒〗相手の最大打点目安は ${opponentThreat.expectedMaxDamage}。${opponentThreat.lethalThreat ? "返しで倒される可能性が高いです。" : "即死圏までは届きにくいです。"}`,
    ...riskMessages,
    ...warnings,
    `〖採用ライン〗${bestLineText}`,
  ];
}

export function buildAnalysis(args: {
  goal: TurnGoal;
  prizePlan: PrizePlan;
  opponentThreat: OpponentThreatInfo;
  bestLineText: string;
}): string {
  const { goal, prizePlan, opponentThreat, bestLineText } = args;

  return [
    `現在の役割は「${goal.type}」です。`,
    goal.primaryReason,
    `勝ち筋は [${prizePlan.pattern.join(", ")}] の取り方を主軸に置きます。`,
    `相手の返し最大打点はおよそ ${opponentThreat.expectedMaxDamage} と見積もります。`,
    `そのため今ターンは「${bestLineText}」を通して、直近の最大値よりも数ターン後の勝ち筋を太くする判断です。`,
  ].join(" ");
}

export function decorateMappedLine(base: {
  score: number;
  line: string;
  reasons: string[];
}) {
  return {
    ...base,
    priority: base.score > 80 ? "high" : base.score > 48 ? "medium" : "low",
  } as const;
}

export function summarizeBoardState(phase: ProfessionalCoachResult["phase"], archetype: string, goalType?: string): string {
  const phaseLabel = phase === "opening" ? "序盤" : phase === "midgame" ? "中盤" : "終盤";
  return `${phaseLabel} / ${archetype}型 / ゴール=${goalType ?? "unknown"}`;
}
