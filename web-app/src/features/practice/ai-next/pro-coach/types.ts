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

export type ProfessionalCoachResult = {
  phase: CoachPhase;
  archetype: string;
  boardSummary: string;
  thoughts: string[];
  bestLine: ProfessionalLine | null;
  alternatives: ProfessionalLine[];
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
};
