// simulationCoachingEngine.ts
import type {
  CoachingImprovementSuggestion,
  DeckRoleSummary,
  OpeningSimulationRaw,
  SimulationCoachingInsight,
  SimulationMetric,
  SimulationThresholdProfile,
} from "./simulationCoachingTypes";
import { DEFAULT_SIMULATION_THRESHOLDS } from "./simulationCoachingTypes";

export type StandardCardCandidate = {
  cardName: string;
  regulation: "standard" | "expanded";
  roles: string[];
  priorityScore?: number;
};

export type AdviceEngineParams = {
  archetype?: string;
  simulation: OpeningSimulationRaw;
  deckRoleSummary?: DeckRoleSummary;
  standardCardPool?: StandardCardCandidate[];
  thresholds?: Partial<SimulationThresholdProfile>;
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function mergeThresholds(input?: Partial<SimulationThresholdProfile>): SimulationThresholdProfile {
  return {
    seedRate: { ...DEFAULT_SIMULATION_THRESHOLDS.seedRate, ...(input?.seedRate ?? {}) },
    setupRate: { ...DEFAULT_SIMULATION_THRESHOLDS.setupRate, ...(input?.setupRate ?? {}) },
    supportAccessRate: { ...DEFAULT_SIMULATION_THRESHOLDS.supportAccessRate, ...(input?.supportAccessRate ?? {}) },
    energyAccessRate: { ...DEFAULT_SIMULATION_THRESHOLDS.energyAccessRate, ...(input?.energyAccessRate ?? {}) },
  };
}

function toMetric(
  key: SimulationMetric["key"],
  label: string,
  value: number,
  greenMin: number,
  yellowMin: number,
  diagnosis: string,
): SimulationMetric {
  const bucket =
    value >= greenMin ? "green" :
    value >= yellowMin ? "yellow" :
    "red";

  const severity =
    bucket === "green"
      ? 0
      : bucket === "yellow"
      ? clamp((greenMin - value) * 2.2, 20, 65)
      : clamp((yellowMin - value) * 3.0 + 40, 50, 100);

  return { key, label, value, greenMin, yellowMin, severity, bucket, diagnosis };
}

function buildMetrics(
  simulation: OpeningSimulationRaw,
  thresholds: SimulationThresholdProfile,
): SimulationMetric[] {
  return [
    toMetric("seedRate", "たね率", simulation.seedRate, thresholds.seedRate.greenMin, thresholds.seedRate.yellowMin, "初手の試合成立率。"),
    toMetric("setupRate", "展開成功率", simulation.setupRate, thresholds.setupRate.greenMin, thresholds.setupRate.yellowMin, "2ターン目までの理想盤面到達率。"),
    toMetric("supportAccessRate", "サポート到達率", simulation.supportAccessRate, thresholds.supportAccessRate.greenMin, thresholds.supportAccessRate.yellowMin, "縦引きと中盤再現性の入口。"),
    toMetric("energyAccessRate", "エネルギー到達率", simulation.energyAccessRate, thresholds.energyAccessRate.greenMin, thresholds.energyAccessRate.yellowMin, "攻撃成立とテンポ維持の最低条件。"),
  ].sort((a, b) => b.severity - a.severity);
}

function pickCardsByRoles(cardPool: StandardCardCandidate[], wantedRoles: string[], limit = 5): string[] {
  if (!cardPool.length) return [];
  return cardPool
    .filter((card) => card.regulation === "standard")
    .map((card) => ({
      card,
      score: (card.priorityScore ?? 0) + wantedRoles.reduce((acc, role) => acc + (card.roles.includes(role) ? 20 : 0), 0),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.card.cardName.localeCompare(b.card.cardName, "ja"))
    .slice(0, limit)
    .map((row) => row.card.cardName);
}

function hasEnoughRawEnergy(deck?: DeckRoleSummary): boolean {
  const totalEnergy = (deck?.basicEnergyCount ?? 0) + (deck?.specialEnergyCount ?? 0);
  return totalEnergy >= 9;
}

function buildSeedSuggestion(cardPool: StandardCardCandidate[]): CoachingImprovementSuggestion {
  return {
    id: "seed-density",
    priority: 1,
    title: "初手成立率を上げる",
    issueKey: "seed_density",
    diagnosis: "たね率が低く、BO3での即敗北リスクが無視できません。",
    action: "たねポケモンそのもの、または初動でたねに触る札の密度を増やしてください。",
    whyItMatters: "たね率はすべての試合の入口です。",
    cutGuidance: ["初動に寄与しないピン刺しメタ札", "中盤専用で初手の質を改善しない札", "役割重複の過剰どうぐ"],
    addRoleTags: ["seed_pokemon", "seed_search_item", "bench_setup"],
    candidateCardNames: pickCardsByRoles(cardPool, ["seed_search_item", "bench_setup"]),
    expectedImpact: "たね率と展開成功率を同時に底上げしやすいです。",
  };
}

function buildSetupSuggestion(cardPool: StandardCardCandidate[], deck?: DeckRoleSummary): CoachingImprovementSuggestion {
  const searchItems = deck?.searchItemCount ?? 0;
  const diagnosis =
    searchItems < 10
      ? "展開成功率低下の主因は初動サーチ密度不足である可能性が高いです。"
      : "展開成功率低下の主因は進化・システム・打点ラインへの接続不足です。";

  return {
    id: "setup-consistency",
    priority: 1,
    title: "2ターン目の理想盤面到達率を上げる",
    issueKey: "setup_consistency",
    diagnosis,
    action: "盤面形成札を『たね確保』『進化接続』『次ターン再現性確保』に分けて、詰まり箇所を増量してください。",
    whyItMatters: "展開成功率は勝率そのものです。",
    cutGuidance: ["要求条件が重いコンボ札", "序盤の盤面形成に関与しない1枚差し", "展開失敗を補えない受け札の過剰採用"],
    addRoleTags: ["search_item", "draw_support", "bench_setup"],
    candidateCardNames: pickCardsByRoles(cardPool, ["search_item", "draw_support"]),
    expectedImpact: "理想盤面の再現性を安定帯へ近づけられます。",
  };
}

function buildSupportSuggestion(cardPool: StandardCardCandidate[]): CoachingImprovementSuggestion {
  return {
    id: "support-access",
    priority: 2,
    title: "中盤の縦引きを安定化する",
    issueKey: "support_access",
    diagnosis: "サポート到達率が低いと、序盤に並んでも中盤以降の再現性が落ちます。",
    action: "ドローサポート総量だけでなく、初手〜2ターン目で触れやすい経路を増やしてください。",
    whyItMatters: "サポートは中盤以降の事故回避だけでなく、プレイラインの選択肢を増やします。",
    cutGuidance: ["対面依存のメタ札", "役割が狭い状況依存サポート", "同じ局面でしか使わない重複札"],
    addRoleTags: ["draw_support", "search_support"],
    candidateCardNames: pickCardsByRoles(cardPool, ["draw_support", "search_support"]),
    expectedImpact: "手札の質が安定し、実戦で再現しやすくなります。",
  };
}

function buildEnergySuggestion(cardPool: StandardCardCandidate[], deck?: DeckRoleSummary): CoachingImprovementSuggestion {
  const enoughRawEnergy = hasEnoughRawEnergy(deck);
  return {
    id: "energy-access",
    priority: 1,
    title: "攻撃成立率を上げる",
    issueKey: "energy_access",
    diagnosis: enoughRawEnergy ? "問題はエネルギー総量より必要ターンまでの接触率です。" : "エネルギー総量とアクセスの両方が不足している可能性があります。",
    action: enoughRawEnergy ? "基本エネルギーの単純増量ではなく、エネルギーサーチや間接接触札の密度を優先してください。" : "まずは必要最低限のエネルギー総量を確保し、そのうえでサーチ札で到達率を上げてください。",
    whyItMatters: "展開できても攻撃できなければテンポ負けします。",
    cutGuidance: ["序盤の攻撃成立に関与しないピン刺し", "同一役割で過剰などうぐ", "対面が限定されるサブプラン札"],
    addRoleTags: enoughRawEnergy ? ["energy_search_item", "search_item"] : ["basic_energy", "energy_search_item"],
    candidateCardNames: enoughRawEnergy ? pickCardsByRoles(cardPool, ["energy_search_item", "search_item"]) : pickCardsByRoles(cardPool, ["basic_energy", "energy_search_item"]),
    expectedImpact: "攻撃の空振りターンを減らし、サイドプランとの一致率が上がります。",
  };
}

function buildBottlenecks(metrics: SimulationMetric[]): string[] {
  return metrics
    .filter((m) => m.bucket !== "green")
    .map((m) => {
      switch (m.key) {
        case "seedRate":
          return "初手の試合成立率が不安定";
        case "setupRate":
          return "2ターン目の理想盤面再現性が不足";
        case "supportAccessRate":
          return "中盤の縦引き経路が弱い";
        case "energyAccessRate":
          return "攻撃成立までの接触経路が弱い";
        default:
          return m.label;
      }
    });
}

function inBadBucket(metric: SimulationMetric): boolean {
  return metric.bucket === "yellow" || metric.bucket === "red";
}

function buildReproducibleRules(metrics: SimulationMetric[]): string[] {
  const rules: string[] = [];
  for (const metric of metrics) {
    if (metric.key === "seedRate" && inBadBucket(metric)) rules.push("たね率が90%未満なら、爆発札より初動札を優先する。");
    if (metric.key === "setupRate" && inBadBucket(metric)) rules.push("展開成功率が70%未満なら、初動サーチと盤面形成札を最優先で厚くする。");
    if (metric.key === "supportAccessRate" && inBadBucket(metric)) rules.push("サポート到達率が85%未満なら、縦引きの総量と経路を増やす。");
    if (metric.key === "energyAccessRate" && inBadBucket(metric)) rules.push("エネルギー到達率が75%未満なら、総量不足かアクセス不足かを切り分けて調整する。");
  }
  if (rules.length === 0) rules.push("全体数値が安定帯なら、メタ札は初動を壊さない範囲で採用する。");
  return rules;
}

function buildSuggestions(
  metrics: SimulationMetric[],
  deckRoleSummary: DeckRoleSummary | undefined,
  standardCardPool: StandardCardCandidate[],
): CoachingImprovementSuggestion[] {
  const suggestions: CoachingImprovementSuggestion[] = [];
  const metricMap = new Map(metrics.map((metric) => [metric.key, metric]));

  if (metricMap.get("seedRate")?.bucket !== "green") suggestions.push(buildSeedSuggestion(standardCardPool));
  if (metricMap.get("setupRate")?.bucket !== "green") suggestions.push(buildSetupSuggestion(standardCardPool, deckRoleSummary));
  if (metricMap.get("supportAccessRate")?.bucket !== "green") suggestions.push(buildSupportSuggestion(standardCardPool));
  if (metricMap.get("energyAccessRate")?.bucket !== "green") suggestions.push(buildEnergySuggestion(standardCardPool, deckRoleSummary));

  if (!suggestions.length) {
    suggestions.push({
      id: "maintain-stability",
      priority: 2,
      title: "安定帯を壊さずに微調整する",
      issueKey: "maintain_stability",
      diagnosis: "主要4指標が安定帯にあります。",
      action: "初動札の密度は維持しつつ、苦手対面を補うサブプラン札を限定採用してください。",
      whyItMatters: "安定構築は『強いカードを増やす』より『安定を壊さない』ことが重要です。",
      cutGuidance: ["役割重複の4枚目", "使用頻度の低い保険札"],
      addRoleTags: ["tech_slot", "matchup_tool"],
      candidateCardNames: pickCardsByRoles(standardCardPool, ["tech_slot", "matchup_tool"]),
      expectedImpact: "再現性を維持したままメタ適応力を上げられます。",
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

export function buildSimulationCoachingInsight(params: AdviceEngineParams): SimulationCoachingInsight {
  const thresholds = mergeThresholds(params.thresholds);
  const metrics = buildMetrics(params.simulation, thresholds);
  const bottlenecks = buildBottlenecks(metrics);
  const reproducibleRules = buildReproducibleRules(metrics);
  const suggestions = buildSuggestions(metrics, params.deckRoleSummary, params.standardCardPool ?? []);

  const mostSevere = metrics[0];
  const headline =
    mostSevere.bucket === "green"
      ? "再現性は安定帯です"
      : mostSevere.key === "energyAccessRate"
      ? "展開より攻撃成立の再現性が課題です"
      : mostSevere.key === "setupRate"
      ? "理想盤面の再現性が課題です"
      : mostSevere.key === "supportAccessRate"
      ? "中盤の縦引き再現性が課題です"
      : "初手成立率の改善が最優先です";

  const summary = suggestions.length > 0
    ? `${headline} 最優先は「${suggestions[0].title}」で、目的は“引ける構築”ではなく“再現できる構築”に寄せることです。`
    : `${headline} 現状は大きな修正より、安定性維持を前提にした微調整が有効です。`;

  return { headline, summary, metrics, bottlenecks, reproducibleRules, suggestions };
}
