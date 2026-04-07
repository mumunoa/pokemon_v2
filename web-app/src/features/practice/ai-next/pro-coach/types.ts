import type { CardRoleProfile, DynamicRole, PrimitiveEvidence } from "../domain/types";

export type CoachPhase = "opening" | "midgame" | "endgame";

export type EnergyType = "grass" | "fire" | "water" | "lightning" | "psychic" | "fighting" | "darkness" | "metal" | "fairy" | "dragon" | "colorless" | "special";

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
  attacks?: Array<{ name?: string; damage?: string | number; text?: string; cost?: EnergyType[] }>;
  ability?: Array<{ name?: string; text?: string }>;
  tags?: string[];
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
  // 追加: より詳細なコンテキスト
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
  probableHiddenCards: string[]; // 相手の手札にありそうなカードの推測
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

export type ProfessionalCoachResult = {
  phase: CoachPhase;
  archetype: string;
  boardStateSummary: string;
  thoughts: string[];
  bestAction: any; // CoachPanelに合わせる
  alternatives: any[];
  keyCards: Array<{
    cardName: string;
    score: number;
    reason: string;
  }>;
  openingMetrics?: {
    basicRate: number;
    supporterRate: number;
    setupSuccessRate: number;
  };
  handProfiles: CardRoleProfile[];
  analysis: string;
  timestamp: string;
  version: string;
  // 8レイヤー推論用の追加フィールド
  opponentThreat?: OpponentThreatInfo;
  macroStrategy?: MacroStrategyInfo;
  simulationCoaching?: SimulationInsight;
  // プロ思考エンジン用の新規フィールド
  goal?: TurnGoal;
  prizePlan?: PrizePlan;
  risk?: RiskReport;
  probability?: ProbabilityReport;
};

/**
 * --- プロ思考エンジン専用の高度な戦術型 (blueprint.md 準拠) ---
 */

export type TurnGoalType =
  | 'attack'    // 攻撃成立ターン
  | 'setup'     // 盤面形成ターン
  | 'stall'     // 耐久ターン
  | 'disrupt'   // 妨害ターン
  | 'recover'   // リソース回復ターン
  | 'checkmate' // 詰めターン
  | 'comeback'  // 逆転準備ターン
  | 'stabilize'; // 再現性最大化

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
  pattern: number[]; // 例: [2, 2, 2]
  targetSequence: PrizeTargetStep[];
  estimatedTurnsToFinish: number;
  successProbability: number;
  fragilityScore: number; // 崩れやすさ (0-100)
};

export type ProbabilityReport = {
  currentTurnSuccessRate: number;
  nextTurnContinuityRate: number;
  twoTurnPlanRate: number;
};

export type RiskReport = {
  handCollapseRisk: number;    // 手札枯渇
  boardCollapseRisk: number;   // 盤面崩壊
  energyStallRisk: number;     // エネ供給停止
  prizeRaceLossRisk: number;   // サイドレース敗北
  comebackFailureRisk: number; // 逆転不能
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
