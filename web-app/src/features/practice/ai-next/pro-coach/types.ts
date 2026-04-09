import type { CardRoleProfile, DynamicRole, PrimitiveEvidence } from "../domain/types";

export type CoachPhase = "opening" | "midgame" | "endgame";

export type EnergyType =
  | "grass"
  | "fire"
  | "water"
  | "lightning"
  | "psychic"
  | "fighting"
  | "darkness"
  | "metal"
  | "fairy"
  | "dragon"
  | "colorless"
  | "special";

export type CoachAttack = {
  name?: string;
  damage?: string | number;
  text?: string;
  cost?: EnergyType[];
  convertedEnergyCost?: number;
};

export type CoachAbility = {
  name?: string;
  text?: string;
};

export type CoachRule = {
  text?: string;
  prize?: number;
};

export type CoachSupportText = {
  text?: string;
};

export type CoachCard = {
  id: string;
  baseCardId?: string;
  name: string;
  type?: string;
  kinds?: string;
  hp?: number | null;
  damage?: number;
  retreat?: number | null;
  attachedEnergyIds?: string[];
  attachedEnergyTypes?: EnergyType[];
  canAttack?: boolean;
  attacks?: CoachAttack[];
  ability?: CoachAbility[];
  rules?: CoachRule[];
  support?: CoachSupportText[];
  weakness?: string;
  resistance?: string;
  evolves?: string[];
  tags?: string[];
  enteredTurn?: number;
  evolvedTurn?: number;
  turnFlags?: {
    abilityUsed?: boolean;
  };
};

export type CoachPlayerState = {
  active: CoachCard | null;
  bench: CoachCard[];
  hand: CoachCard[];
  discard: CoachCard[];
  prizesTaken: number;
  supporterUsed: boolean;
  energyAttachedThisTurn: boolean;
};

export type CoachGameState = {
  turn: number;
  currentTurnPlayer: "player1" | "player2";
  firstPlayer?: "player1" | "player2";
  selectedArchetype?: string;
  players: {
    player1: CoachPlayerState;
    player2: CoachPlayerState;
  };
  cards?: Record<string, any>;
};

export type CoachBoardFeatures = {
  phase: CoachPhase;
  ownPrizesRemaining: number;
  oppPrizesRemaining: number;
  ownBenchCount: number;
  oppBenchCount: number;
  activeCanAttack: boolean;
  activeEnergyCount: number;
  activeEnergyReady: boolean;
  activeEnergyNeeded: number;
  activeRetreatCost: number;
  canRetreat: boolean;
  hasFreePivot: boolean;
  hasDrawInHand: boolean;
  hasSearchInHand: boolean;
  hasBenchSetupInHand: boolean;
  hasGustInHand: boolean;
  hasRecoveryInHand: boolean;
  ownTwoPrizeExposed: boolean;
  oppSystemCount: number;
  oppHeavyRetreatCount: number;
  setupNeed: number;
  drawNeed: number;
  gustNeed: number;
  tempoNeed: number;
  recoveryNeed: number;
  safetyNeed: number;
  followupNeed: number;
  ownHandNames: string[];
  ownBenchNames: string[];
  ownTrashNames: string[];
  oppActiveName?: string;
  oppBenchNames: string[];
  totalEnergiesInPlay: number;
};

export type LegalAction =
  | {
      kind: "play_supporter";
      cardId: string;
      cardName: string;
      category: "draw" | "search" | "gust" | "disrupt" | "recovery" | "generic";
      targetId?: string;
      targetName?: string;
    }
  | {
      kind: "play_item";
      cardId: string;
      cardName: string;
      category: "search_basic" | "search_any" | "switch" | "recovery" | "generic";
      targetId?: string;
      targetName?: string;
    }
  | {
      kind: "play_stadium";
      cardId: string;
      cardName: string;
      category: "board_expansion" | "stadium_control" | "generic";
    }
  | {
      kind: "play_tool";
      cardId: string;
      cardName: string;
      targetId: string;
      targetName: string;
    }
  | {
      kind: "use_ability";
      sourceId: string;
      sourceName: string;
      category: "draw" | "search" | "energy" | "generic";
    }
  | {
      kind: "attach_energy";
      cardId: string;
      cardName: string;
      targetId: string;
      targetName: string;
    }
  | {
      kind: "bench_pokemon";
      cardId: string;
      cardName: string;
      category: "basic";
    }
  | {
      kind: "evolve";
      cardId: string;
      cardName: string;
      targetId: string;
      targetName: string;
      category: "stage1" | "stage2";
    }
  | {
      kind: "retreat";
      fromId: string;
      fromName: string;
      toId: string;
      toName: string;
    }
  | {
      kind: "attack";
      sourceId: string;
      sourceName: string;
      attackName: string;
      targetId?: string;
      targetName?: string;
    };

export type StateTransitionResult = {
  nextState: CoachGameState;
  consumedCardName?: string;
  transitionSummary: string[];
};

export type NextStateEvaluation = {
  total: number;
  setup: number;
  prizeMap: number;
  tempo: number;
  threat: number;
  resources: number;
  followup: number;
  reasons: string[];
};

export type ProfessionalLine = {
  action: LegalAction;
  transition: StateTransitionResult;
  nextEval: NextStateEvaluation;
  replyPenalty: number;
  lineScore: number;
  dynamicRoles: DynamicRole[];
  primitiveReasons: string[];
};

export type PrimitiveHint = {
  cardName: string;
  priority: number;
  line: string;
  reasons: string[];
  evidences: PrimitiveEvidence[];
};

export type OpponentThreatInfo = {
  expectedMaxDamage: number;
  requiredCards: number;
  lethalThreat: boolean;
  disruptValue: number;
  probableHiddenCards: string[];
};

export type MacroStrategyInfo = {
  activePlan: string;
  estimatedTurnsToWin: number;
  opponentEstimatedTurnsToWin: number;
  description: string;
};

export type SimulationInsight = {
  headline: string;
  metrics: Array<{ key: string; label: string; value: number; bucket: "green" | "yellow" | "red" }>;
  suggestions: Array<{ action: string; candidateCardNames: string[] }>;
};

export type TurnGoalType =
  | "attack"
  | "setup"
  | "stall"
  | "disrupt"
  | "recover"
  | "checkmate"
  | "comeback"
  | "stabilize";

export type TurnGoal = {
  type: TurnGoalType;
  primaryReason: string;
  requiredOutcome: string[];
};

export type PrizeTargetStep = {
  targetName: string;
  prizes: number;
  isRequired: boolean;
};

export type PrizePlan = {
  id: string;
  pattern: number[];
  targetSequence: PrizeTargetStep[];
  estimatedTurnsToFinish: number;
  successProbability: number;
  fragilityScore: number;
};

export type ProbabilityReport = {
  currentTurnSuccessRate: number;
  nextTurnContinuityRate: number;
  twoTurnPlanRate: number;
};

export type RiskReport = {
  handCollapseRisk: number;
  boardCollapseRisk: number;
  energyStallRisk: number;
  prizeRaceLossRisk: number;
  comebackFailureRisk: number;
  totalRiskScore: number;
};

export type TurnDecisionReport = {
  goal: TurnGoal;
  selectedPrizePlanId: string;
  prizePlan?: PrizePlan;
  probability: ProbabilityReport;
  risk: RiskReport;
  opponentPressure: OpponentThreatInfo;
  finalActions: LegalAction[];
  reasoningSummary: string[];
};

export type GeneratedActionLine = {
  id: string;
  actions: LegalAction[];
  finalState: CoachGameState;
  transitionSummaries: string[];
  scoreHints: {
    supporterUsed: boolean;
    manualEnergyUsed: boolean;
    attackIncluded: boolean;
    benchCount: number;
    evolvedCount: number;
  };
};

export type EvaluatedActionLine = {
  id: string;
  actions: LegalAction[];
  finalState: CoachGameState;
  transitionSummaries: string[];
  lineScore: number;
  lineText: string;
  reasoning: string[];
  nextEval: NextStateEvaluation;
  replyPenalty: number;
  dynamicRoles: DynamicRole[];
};

export type ProfessionalCoachResult = {
  phase: CoachPhase;
  archetype: string;
  boardStateSummary: string;
  thoughts: string[];
  bestAction: any;
  alternatives: any[];
  recommendedSequence?: {
    id: string;
    score: number;
    line: string;
    actions: LegalAction[];
    reasoning: string[];
    transitionSummaries: string[];
  };
  sequenceAlternatives?: Array<{
    id: string;
    score: number;
    line: string;
    actions: LegalAction[];
    reasoning: string[];
    transitionSummaries: string[];
  }>;
  keyCards: Array<{ cardName: string; score: number; reason: string }>;
  openingMetrics?: {
    basicRate: number;
    supporterRate: number;
    setupSuccessRate: number;
  };
  handProfiles: CardRoleProfile[];
  analysis: string;
  timestamp: string;
  version: string;
  opponentThreat?: OpponentThreatInfo;
  macroStrategy?: MacroStrategyInfo;
  simulationCoaching?: SimulationInsight;
  goal?: TurnGoal;
  prizePlan?: PrizePlan;
  risk?: RiskReport;
  probability?: ProbabilityReport;
};
