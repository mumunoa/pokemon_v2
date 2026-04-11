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

  const warnings = [];
  if (risk.checkmateRisk > 70) warnings.push("【警告】相手のリーサル（詰め）圏内です。このターン、確実に負け筋を消す行動が必須です。");
  if (risk.deckOutRisk > 60) warnings.push("【注意】山札が少なくなっています。リソースを使い切る前に勝ち切るか、ドローを抑える判断が求められます。");
  if (risk.resourceLossRisk > 60) warnings.push("【戦略助言】手札の重要札（エネやサーチ等）を不用意にトラッシュに送ると、終盤の失速を招く懸念があります。");

  return [
    `〖環境認識〗${phase === "opening" ? "ゲーム序盤" : phase === "midgame" ? "攻防の中盤" : "決着の終盤"}です。${goal.primaryReason}`,
    `〖戦略目標〗最優先ゴールは「${goal.type}」。サイドプラン [${prizePlan.pattern.join("→")}] の完遂を目指します。`,
    `〖返し考察〗相手の最大打点は ${opponentThreat.expectedMaxDamage}。${opponentThreat.lethalThreat ? "返しで気絶するリスクが高いため、ベンチの質を保つ必要があります。" : "致命傷は避けられそうな盤面です。"}`,
    ...warnings,
    `〖プロの手順〗${bestLineText}`,
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
    `プロの視点では、現在の役割を「${goal.type}」と定義します。`,
    `${goal.primaryReason}`,
    `サイドを [${prizePlan.pattern.join(", ")}] と刻むプランを軸に、${opponentThreat.expectedMaxDamage} 点の返しダメージを考慮した盤面を維持してください。`,
    `推奨する手順「${bestLineText}」は、目先の盤面形成だけでなく、数ターン先の勝ち筋を太くするための妥当な選択です。`,
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
