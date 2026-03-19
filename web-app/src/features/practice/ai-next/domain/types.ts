/**
 * AI Role System & Recommendation Domain Types
 */

export type StaticRole =
  // Card body / identity
  | 'basic_pokemon'
  | 'evolution_pokemon'
  | 'main_attacker'
  | 'main_attacker_basic'
  | 'main_attacker_stage1'
  | 'main_attacker_stage2'

  // Search / setup
  | 'search'
  | 'basic_search'
  | 'evolution_search'
  | 'pokemon_search'
  | 'pokemon_ex_search'
  | 'trainer_search'
  | 'item_search'
  | 'supporter_search'
  | 'stadium_search'
  | 'energy_search'
  | 'bench_setup'
  | 'setup_cheat'

  // Draw / hand / consistency
  | 'draw'
  | 'hand_refresh'
  | 'topdeck_tutor'
  | 'consistency'

  // Mobility / gust / tempo
  | 'gust'
  | 'switch'
  | 'pivot'

  // Energy
  | 'energy_accel'
  | 'energy_recovery'
  | 'energy_denial'

  // Sustain / disruption
  | 'recovery'
  | 'survival'
  | 'disrupt'
  | 'stall'
  | 'ability_lock'
  | 'item_lock'

  // Damage patterns
  | 'spread'
  | 'snipe'
  | 'damage_boost'

  // Stadium / board control / recursion
  | 'stadium_control'
  | 'board_expansion'
  | 'resource_recovery'

  | 'unknown';

export type DeckRole =
  | 'primary_attacker'
  | 'secondary_attacker'
  | 'bench_barrier'
  | 'draw_engine'
  | 'energy_accelerator'
  | 'search_pivot'
  | 'opening_core'
  | 'engine_core'
  | 'support_pokemon_core'
  | 'late_game_finisher'
  | 'stabilizer'
  | 'matchup_tech';

export type DynamicRole =
  | 'finisher_gust'
  | 'system_snipe'
  | 'stall_trap'
  | 'desperate_draw'
  | 'setup_priority'
  | 'retreat_pivot'
  | 'bench_fill_now'
  | 'dig_for_out'
  | 'swing_turn'
  | 'protect_lead'
  | 'recover_board'
  | 'force_response';

export type RoleEvidenceSource =
  | 'ability'
  | 'support'
  | 'rule'
  | 'attack'
  | 'energy'
  | 'manual'
  | 'heuristic';

export type EffectPrimitive =
  | 'search_deck_to_hand'
  | 'search_deck_to_bench'
  | 'search_any_pokemon'
  | 'search_basic_pokemon'
  | 'search_evolution_pokemon'
  | 'search_pokemon_ex'
  | 'search_item'
  | 'search_supporter'
  | 'search_stadium'
  | 'search_energy'
  | 'draw_cards'
  | 'refresh_hand'
  | 'topdeck_tutor'
  | 'gust_opponent'
  | 'switch_self'
  | 'attach_energy_from_hand'
  | 'attach_energy_from_discard'
  | 'attach_energy_from_deck'
  | 'recover_pokemon_from_discard'
  | 'recover_energy_from_discard'
  | 'heal_hp'
  | 'remove_damage_counter'
  | 'prevent_knockout'
  | 'reduce_damage_taken'
  | 'lock_ability'
  | 'lock_item'
  | 'trap_retreat'
  | 'increase_retreat_cost'
  | 'spread_damage'
  | 'snipe_bench'
  | 'damage_modifier'
  | 'bench_expand'
  | 'bench_fill'
  | 'evolution_cheat'
  | 'deck_fixing'
  | 'resource_loop'
  | 'energy_denial'
  | 'coin_flip_conditional';

export type RoleEvidence = {
  role: string;
  source: RoleEvidenceSource;
  matchedText: string;
  reason: string;
  confidence: number;
};

export type PrimitiveEvidence = {
  primitive: EffectPrimitive;
  source: RoleEvidenceSource;
  matchedText: string;
  reason: string;
  confidence: number;
};

export type SectionInferenceInput = {
  cardId: string;
  cardName: string;
  text: string;
  source: 'ability' | 'support' | 'rule' | 'attack' | 'energy';
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
  primitives?: EffectPrimitive[];
  primitiveEvidence?: PrimitiveEvidence[];
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
  opponentDiscard: string[];
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

export type BoardDiff = {
  missingBench: number;
  missingEnergy: number;
  missingEvolution: boolean;
  isIdeal: boolean;
};

export type OpeningEvaluation = {
  score: number;
  stability: 'stable' | 'average' | 'risky';
  reason: string;
};

export type RecommendationResult = {
  bestAction: ScoredAction | null;
  alternatives: ScoredAction[];
  keyCards: KeyCard[];
  analysis: string;
  boardStateSummary: string;
  boardDiff?: BoardDiff;
  openingEvaluation?: OpeningEvaluation;
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

export type RegressionSeed = {
  name: string;
  source: RoleEvidenceSource;
  text: string;
  expectedRoles: StaticRole[];
};
