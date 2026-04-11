import type { CardRoleProfile, DynamicRole } from "../domain/types";
import type {
  CoachGameState,
  EvaluatedActionLine,
  GeneratedActionLine,
  LegalAction,
  ProfessionalCoachResult,
  ProfessionalLine,
} from "./types";
import { extractBoardFeatures } from "./featureExtractor";
import { generateLegalActions } from "./legalAction";
import { applyStateTransition } from "./stateTransition";
import { evaluateNextState } from "./nextStateEvaluation";
import { simulateOpeningMetrics } from "./openingSimulation";
import { buildEffectSpecForCard } from "../effects/effectSpecCatalog";
import type { EffectContext } from "../effects/effectSpecTypes";
import { planTurnGoal } from "./policy/goalPlanner";
import { planPrizePath } from "./policy/prizePathPlanner";
import { evaluateRisk } from "./policy/riskEvaluator";
import { sortActionsByProfessionalPriority } from "./policy/sequencePlanner";
import { evaluateOpponentThreat } from "./policy/opponentModel";
import { buildProfessionalLine } from "./policy/lineSelectionPolicy";
import {
  buildAnalysis,
  buildThoughts,
  decorateMappedLine,
  summarizeBoardState,
} from "./policy/explanationPolicy";
import { generateActionLines } from "./generateActionLines";

function inferArchetype(state: CoachGameState, profiles: CardRoleProfile[]): string {
  if (state.selectedArchetype) return state.selectedArchetype;
  const names = new Set([
    ...state.players.player1.hand.map((c) => c.name),
    ...state.players.player1.bench.map((c) => c.name),
    state.players.player1.active?.name ?? "",
  ]);

  if ([...names].some((name) => name.includes("ドラパルト"))) return "tempo_midrange";
  if ([...names].some((name) => name.includes("リザードン"))) return "stage2_midrange";
  if (profiles.some((p) => p.deckRoles.includes("control" as any))) return "spread_control";
  return "generic";
}

function formatArchetype(arc: string): string {
  switch (arc) {
    case "tempo_midrange":
      return "テンポミッドレンジ";
    case "stage2_midrange":
      return "2進化ミッドレンジ";
    case "spread_control":
      return "バラマキ/コントロール";
    default:
      return arc || "汎用";
  }
}

function actionLineText(action: LegalAction): string {
  switch (action.kind) {
    case "play_supporter":
      return action.targetName
        ? `${action.cardName} で ${action.targetName} を主眼にプランを進める`
        : `${action.cardName} を使って分岐を広げる`;
    case "play_item":
      return action.targetName
        ? `${action.cardName} で ${action.targetName} に繋ぐ`
        : `${action.cardName} を先に使って情報量を増やす`;
    case "play_stadium":
      return `${action.cardName} で盤面要求を整える`;
    case "play_tool":
      return `${action.targetName} に ${action.cardName} をつけて勝ち筋を補強する`;
    case "use_ability":
      return `${action.sourceName} の特性で精度を上げる`;
    case "attach_energy":
      return `${action.targetName} にエネルギーを貼って後続を作る`;
    case "bench_pokemon":
      return `${action.cardName} をベンチに出して次ターンの線を増やす`;
    case "evolve":
      return `${action.targetName} を ${action.cardName} に進化させて盤面を強化する`;
    case "retreat":
      return `${action.toName} に引いて返しを弱くする`;
    case "attack":
      return `${action.attackName} で攻撃し主導権を取る`;
    default:
      return "行動する";
  }
}

function inferDynamicRoles(action: LegalAction, primitiveBonus: number): DynamicRole[] {
  const roles = new Set<string>();
  if (action.kind === "play_supporter" && action.category === "gust") roles.add("finisher_gust");
  if (action.kind === "play_item" && (action.category === "search_basic" || action.category === "search_any")) roles.add("setup_priority");
  if (action.kind === "play_item" && action.category === "recovery") roles.add("recover_board");
  if (action.kind === "use_ability" && action.category === "draw") roles.add("stability_engine");
  if (action.kind === "bench_pokemon") roles.add("setup_priority");
  if (action.kind === "evolve") roles.add("force_response");
  if (action.kind === "attack") roles.add("swing_turn");
  if (primitiveBonus >= 18) roles.add("force_response");
  return Array.from(roles) as DynamicRole[];
}

function keyCards(handProfiles: CardRoleProfile[]) {
  return handProfiles
    .map((p) => {
      let score = p.staticRoles.length * 7 + (p.primitives?.length ?? 0) * 2;
      if (p.staticRoles.includes("gust")) score += 12;
      if (p.staticRoles.includes("draw") || p.staticRoles.includes("hand_refresh")) score += 10;
      if (p.staticRoles.includes("basic_search") || p.staticRoles.includes("bench_setup")) score += 11;
      if (p.staticRoles.includes("evolution_search" as any) || p.staticRoles.includes("main_attacker" as any)) score += 9;
      return {
        cardName: p.cardName,
        score,
        reason: p.reasons?.[0] ?? "このターンの勝ち筋に関与する札です。",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function lineText(actions: LegalAction[]): string {
  return actions.map(actionLineText).join(" → ");
}

function lineRoles(actions: LegalAction[]): DynamicRole[] {
  const roles = new Set<DynamicRole>();
  actions.forEach((action) => {
    inferDynamicRoles(action, 0).forEach((role) => roles.add(role));
  });
  return Array.from(roles);
}

function evaluateActionLine(args: {
  line: GeneratedActionLine;
  archetype: string;
  handProfiles: CardRoleProfile[];
  replyPenaltyBase: number;
  goalType: string;
}): EvaluatedActionLine {
  const nextEval = evaluateNextState(args.line.finalState, args.handProfiles, args.archetype);

  const benchBonus = args.line.scoreHints.benchCount * 10;
  const evolveBonus = args.line.scoreHints.evolvedCount * 14;
  const attackBonus = args.line.scoreHints.attackIncluded ? 18 : 0;
  const consistencyBonus =
    (args.line.scoreHints.supporterUsed ? 4 : 0) +
    (args.line.scoreHints.manualEnergyUsed ? 6 : 0);

  const goalFit =
    args.goalType === "setup"
      ? benchBonus + evolveBonus
      : args.goalType === "attack"
        ? attackBonus + consistencyBonus
        : args.goalType === "checkmate"
          ? attackBonus + 10
          : consistencyBonus + evolveBonus * 0.5;

  // 戦略ゴールとの整合性ボーナス (Blueprint 5章)
  let goalAlignmentBonus = 0;
  if (args.goalType === "setup") {
    goalAlignmentBonus = benchBonus * 1.5 + evolveBonus * 1.2;
  } else if (args.goalType === "attack" || args.goalType === "checkmate") {
    goalAlignmentBonus = (args.line.scoreHints.attackIncluded ? 40 : 0) + (args.line.scoreHints.manualEnergyUsed ? 15 : 0);
  } else if (args.goalType === "disrupt") {
    goalAlignmentBonus = (args.line.scoreHints.supporterUsed ? 20 : 0);
  }

  const replyPenalty = Math.max(0, args.replyPenaltyBase - evolveBonus * 0.12 - benchBonus * 0.08);
  const lineScore =
    nextEval.total +
    benchBonus +
    evolveBonus +
    attackBonus +
    consistencyBonus +
    goalFit +
    goalAlignmentBonus -
    replyPenalty;

  const reasoning = [
    ...args.line.transitionSummaries.slice(0, 4),
    ...nextEval.reasons.slice(0, 3),
  ];

  return {
    id: args.line.id,
    actions: args.line.actions,
    finalState: args.line.finalState,
    transitionSummaries: args.line.transitionSummaries,
    lineScore,
    lineText: lineText(args.line.actions),
    reasoning,
    nextEval,
    replyPenalty,
    dynamicRoles: lineRoles(args.line.actions),
  };
}

export function buildProfessionalCoachResult(params: {
  state: CoachGameState;
  profiles: CardRoleProfile[];
  deckForOpeningSimulation?: Array<{ id?: string; cardId?: string; name: string; type?: string; kinds?: string }>;
}): ProfessionalCoachResult {
  const archetype = inferArchetype(params.state, params.profiles);
  const handNames = new Set(params.state.players.player1.hand.map((c) => c.name));
  const handProfiles = params.profiles.filter((p) => handNames.has(p.cardName));
  const features = extractBoardFeatures(params.state, handProfiles);

  const goal = planTurnGoal(features, params.state);
  const prizePlan = planPrizePath(features, params.state, params.profiles);
  const opponentThreat = evaluateOpponentThreat(features, params.state);
  
  // 山札枚数を明示的にリスク評価に渡す
  const enrichedState = { 
    ...params.state, 
    deckRemaining: params.state.players.player1.deckRemaining 
  };
  const risk = evaluateRisk(features, enrichedState);

  const rawActions = generateLegalActions(params.state, params.profiles);
  const actions = sortActionsByProfessionalPriority(rawActions);

  const ctx: EffectContext = {
    phase: features.phase,
    setupNeed: features.setupNeed,
    drawNeed: features.drawNeed,
    gustNeed: features.gustNeed,
    safetyNeed: features.safetyNeed,
    handSize: params.state.players.player1.hand.length,
    ownBenchCount: features.ownBenchCount,
    oppBenchCount: features.oppBenchCount,
    supporterUsed: params.state.players.player1.supporterUsed,
    energyAttachedThisTurn: params.state.players.player1.energyAttachedThisTurn,
    hasFreeBenchSlot: features.ownBenchCount < 5,
    opponentHasSystem: features.oppSystemCount > 0,
    opponentHasHeavyRetreat: features.oppHeavyRetreatCount > 0,
  };

  const lines: ProfessionalLine[] = actions
    .map((action) => {
      const cardName =
        "cardName" in action ? action.cardName : "sourceName" in action ? action.sourceName : "";
      const profile = params.profiles.find((p) => p.cardName === cardName);
      const spec = buildEffectSpecForCard(cardName, profile);
      const transition = applyStateTransition(params.state, action, params.profiles);
      const nextEval = evaluateNextState(transition.nextState, handProfiles, archetype);

      let priorityBonus = 0;
      let specReasons: string[] = [];
      if (spec && (!spec.canPlay || spec.canPlay(ctx))) {
        priorityBonus = spec.priorityBase - 40;
        specReasons = spec.explainWhyNow?.(ctx) ?? [];
      }

      // --- Strategic Risk Penalty Calculation (Phase 11.8) ---
      let riskPenalty = 0;
      if (profile?.primitives?.includes("risk_self_deck_discard")) {
        // 山札削り自体のリスク × 現在の山札切れリスク
        riskPenalty += Math.round(risk.deckOutRisk * 0.8);
      }
      if (profile?.primitives?.includes("risk_self_hand_discard")) {
        // 重要札損失リスク (将来的な拡張ポイント)
        riskPenalty += Math.round(risk.resourceLossRisk * 0.4);
      }
      priorityBonus -= riskPenalty;

      const baseLine = buildProfessionalLine({
        action,
        transition,
        nextEval,
        goal,
        prizePlan,
        opponentThreat,
        risk,
      });

      return {
        ...baseLine,
        lineScore: baseLine.lineScore + priorityBonus,
        dynamicRoles: Array.from(
          new Set<DynamicRole>([
            ...baseLine.dynamicRoles,
            ...inferDynamicRoles(action, priorityBonus),
          ]),
        ),
        primitiveReasons:
          specReasons.length > 0
            ? specReasons
            : baseLine.primitiveReasons.length > 0
              ? baseLine.primitiveReasons
              : (profile?.reasons?.slice(0, 2) ?? []),
      };
    })
    .sort((a, b) => b.lineScore - a.lineScore);

  const mappedLines: any[] = lines.map((line) => {
    const total = Number.isFinite(line.nextEval.total) ? line.nextEval.total : 0;
    const penalty = Number.isFinite(line.replyPenalty) ? line.replyPenalty : 0;
    const score = Number.isFinite(line.lineScore) ? line.lineScore : total - penalty;

    return {
      ...line,
      id:
        line.action.kind +
        "_" +
        (line.action.kind === "attack"
          ? line.action.attackName
          : "cardId" in line.action
            ? line.action.cardId
            : "sourceId" in line.action
              ? line.action.sourceId
              : "unknown"),
      cardName:
        "cardName" in line.action
          ? line.action.cardName
          : "sourceName" in line.action
            ? line.action.sourceName
            : "ポケモンの入れ替え",
      ...decorateMappedLine({
        score,
        line: actionLineText(line.action),
        reasons:
          line.primitiveReasons.length > 0
            ? line.primitiveReasons
            : line.nextEval.reasons,
      }),
      dynamicRoles: line.dynamicRoles,
    };
  });

  const bestAction = mappedLines[0] ?? null;

  const generatedLines = generateActionLines({
    state: params.state,
    profiles: params.profiles,
    maxDepth: 3,
    maxBranchesPerDepth: 6,
  });

  const evaluatedSequences = generatedLines
    .map((line) =>
      evaluateActionLine({
        line,
        archetype,
        handProfiles,
        replyPenaltyBase: opponentThreat.disruptValue * 0.25,
        goalType: goal.type,
      }),
    )
    .sort((a, b) => b.lineScore - a.lineScore);

  const recommendedSequence = evaluatedSequences[0]
    ? {
        id: evaluatedSequences[0].id,
        score: evaluatedSequences[0].lineScore,
        line: evaluatedSequences[0].lineText,
        actions: evaluatedSequences[0].actions,
        reasoning: evaluatedSequences[0].reasoning,
        transitionSummaries: evaluatedSequences[0].transitionSummaries,
      }
    : undefined;

  const sequenceAlternatives = evaluatedSequences.slice(1, 4).map((line) => ({
    id: line.id,
    score: line.lineScore,
    line: line.lineText,
    actions: line.actions,
    reasoning: line.reasoning,
    transitionSummaries: line.transitionSummaries,
  }));

  const openingMetrics =
    params.deckForOpeningSimulation && params.deckForOpeningSimulation.length > 0
      ? simulateOpeningMetrics({
          deck: params.deckForOpeningSimulation,
          profileMap: new Map(params.profiles.map((p) => [p.cardId || p.cardName, p])),
          archetype,
          iterations: 1000,
        })
      : undefined;

  return {
    phase: features.phase,
    archetype,
    boardStateSummary: summarizeBoardState(features.phase, formatArchetype(archetype), goal.type),
    thoughts: buildThoughts({
      phase: features.phase,
      goal,
      prizePlan,
      risk,
      opponentThreat,
      bestLineText: recommendedSequence ? recommendedSequence.line : bestAction ? bestAction.line : "有力手なし",
    }),
    bestAction,
    alternatives: mappedLines.slice(1, 6),
    recommendedSequence,
    sequenceAlternatives,
    keyCards: keyCards(handProfiles),
    openingMetrics,
    handProfiles,
    analysis: buildAnalysis({
      goal,
      prizePlan,
      opponentThreat,
      bestLineText: recommendedSequence ? recommendedSequence.line : bestAction ? bestAction.line : "有力手なし",
    }),
    timestamp: new Date().toISOString(),
    version: "2.5.0",
    opponentThreat,
    macroStrategy: {
      activePlan: prizePlan.id,
      estimatedTurnsToWin: prizePlan.estimatedTurnsToFinish,
      opponentEstimatedTurnsToWin: Math.min(6, features.oppPrizesRemaining),
      description: `プロのサイドプラン: [${prizePlan.pattern.join(", ")}]。${prizePlan.successProbability}% の確率で完遂可能です。`,
    },
    goal,
    prizePlan,
    risk,
    probability: {
      currentTurnSuccessRate: Math.max(0, 100 - risk.totalRiskScore),
      nextTurnContinuityRate: Math.max(0, 100 - risk.handCollapseRisk),
      twoTurnPlanRate: prizePlan.successProbability,
    },
  } as any;
}
