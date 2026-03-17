
/**
 * AI Role System & Recommendation Domain Types
 */

export type StaticRole = 
  | 'basic_pokemon'
  | 'evolution_pokemon'
  | 'main_attacker'
  | 'main_attacker_basic'
  | 'main_attacker_stage1'
  | 'main_attacker_stage2'
  | 'bench_setup'
  | 'draw'
  | 'search'
  | 'basic_search'
  | 'evolution_search'
  | 'energy_accel'
  | 'energy_search'
  | 'gust'
  | 'disrupt'
  | 'stall'
  | 'recovery'
  | 'consistency'
  | 'unknown';

export type DeckRole = 
  | 'primary_attacker'
  | 'secondary_attacker'
  | 'bench_barrier'
  | 'draw_engine'
  | 'energy_accelerator'
  | 'search_pivot';

export type DynamicRole = 
  | 'finisher_gust'
  | 'system_snipe'
  | 'stall_trap'
  | 'desperate_draw'
  | 'setup_priority'
  | 'retreat_pivot';

export type RoleEvidenceSource =
  | 'ability'
  | 'support'
  | 'rule'
  | 'attack'
  | 'energy'
  | 'manual'
  | 'heuristic';

export type RoleEvidence = {
  role: string;
  source: RoleEvidenceSource;
  matchedText: string;
  reason: string;
  confidence: number;
};

export type CardRoleProfile = {
  cardId: string;
  cardName: string;
  staticRoles: StaticRole[];
  deckRoles: DeckRole[];
  dynamicRoles: DynamicRole[];
  keyScore: number;
  labels: string[];
  reasons: string[];
  confidence: number;
  evidence: RoleEvidence[];
  inferredAt: string;
  version: string;
};

export type BoardCardLite = {
  cardId: string;
  name: string;
  damage: number;
  hp: number | null;
  retreat: number | null;
  energies: number;
  isSystem: boolean;
  canAttack: boolean;
};

export type BoardState = {
  turnCount: number;
  turn: number;
  playerGoingFirst: boolean;
  prizesTakenByPlayer: number;
  prizesTakenByOpponent: number;
  hand: string[];
  bench: BoardCardLite[];
  active: BoardCardLite | null;
  opponentBench: BoardCardLite[];
  opponentActive: BoardCardLite | null;
  discard: string[];
  deckRemaining: number;
  availableSupporter: boolean;
  availableEnergyAttachment: boolean;
  knownOpponentSwitchOuts: number;
};

export type ActionCandidate = {
  id: string;
  cardName: string;
  line: string;
  target?: string;
  tags: string[];
  estimatedPrizeSwing: number;
  estimatedSetupGain: number;
  estimatedStabilityGain: number;
};

export type ScoredAction = ActionCandidate & {
  score: number;
  priority: 'high' | 'medium' | 'low';
  reasons: string[];
  dynamicRoles: DynamicRole[];
};

export type KeyCard = {
  cardName: string;
  score: number;
  reason: string;
};

export type RecommendationResult = {
  bestAction: ScoredAction | null;
  alternatives: ScoredAction[];
  keyCards: KeyCard[];
  analysis: string;
  boardStateSummary: string;
  timestamp: string;
  version: string;
};

export type ArchetypeStrategy = {
  name: string;
  priorityWeights: {
    prizeSwing: number;
    setupGain: number;
    stabilityGain: number;
  };
  idealBoard: {
    minBenchItems: number;
    requireEnergyOnActive: boolean;
    requireEvolutionReady: boolean;
  };
};

export type DynamicRoleSnapshot = {
  userId?: string;
  sessionId?: string;
  turnNumber: number;
  cardId: string;
  cardName: string;
  boardHash: string;
  dynamicRoles: DynamicRole[];
  actionLine?: string;
  reasons: string[];
  score: number;
  sourceActionId?: string;
  version: string;
};

export type DeckList = {
  deckId?: string;
  name: string;
  archetype: string;
  cards: {
    cardId: string;
    name: string;
    quantity: number;
  }[];
};
