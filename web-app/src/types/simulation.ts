import { DeckCard } from './game'
import { DeckArchetype, SetupTargetConfig } from './deck-analysis'

export type SimulationPerspective = 'first' | 'second'
export type SimulationPlanTier = 'free' | 'pro'

export type FailureReasonType =
  | 'NO_BASIC'
  | 'LOW_BASIC_DENSITY'
  | 'NO_SUPPORTER'
  | 'NO_ENERGY'
  | 'NO_SEARCH_ACCESS'
  | 'NO_BENCH_SETUP'
  | 'NO_DRAW_ENGINE'
  | 'NO_MAIN_ATTACKER'
  | 'NO_EVOLUTION_LINE'
  | 'TURN1_WEAK'
  | 'TURN2_WEAK'
  | 'HAND_BRICK'
  | 'MULLIGAN_HEAVY'
  | 'UNKNOWN'

export type CardRole =
  | 'basic_pokemon'
  | 'evolution_pokemon'
  | 'main_attacker'
  | 'main_attacker_basic'
  | 'main_attacker_stage1'
  | 'main_attacker_stage2'
  | 'support_pokemon'
  | 'draw_engine_pokemon'
  | 'draw_supporter'
  | 'hand_refresh_supporter'
  | 'stabilizer_supporter'
  | 'search_basic_item'
  | 'search_evolution_item'
  | 'search_any_item'
  | 'bench_setup_item'
  | 'draw_item'
  | 'discard_draw_item'
  | 'energy_basic'
  | 'energy_special'
  | 'energy_search'
  | 'energy_accel_piece'
  | 'switch_item'
  | 'recovery_item'
  | 'ball_item'
  | 'ace_spec'
  | 'unknown'

export type CardRoleTag = {
  cardName: string
  roles: CardRole[]
  rolePriority?: number
  archetypeHints?: DeckArchetype[]
  notes?: string[]
}

export type BoardSnapshotLite = {
  turn: number
  active?: string
  bench: string[]
  handCount: number
  supporterUsed: boolean
  energyAttachedToActive: number
  playableSupporters: string[]
  playableSearchItems: string[]
  notableCardsInHand: string[]
  archetype: DeckArchetype
}

export type SimulationTrialLog = {
  trialIndex: number
  mulliganCount: number
  archetype: DeckArchetype
  openingHand: string[]
  turn1: BoardSnapshotLite
  turn2: BoardSnapshotLite
  reachedBasic: boolean
  reachedSupporter: boolean
  reachedEnergy: boolean
  reachedDrawEngine: boolean
  reachedMainAttackerLine: boolean
  setupSuccess: boolean
  failureReasons: FailureReasonType[]
}

export type SimulationMetricBreakdown = {
  successCount: number
  failCount: number
  rate: number
}

export type FailureReasonBreakdown = {
  type: FailureReasonType
  count: number
  rate: number
}

export type BoardPatternExample = {
  label: string
  count: number
  rate: number
  snapshot: BoardSnapshotLite
  tags: string[]
}

export type DeckSwapSuggestion = {
  suggestionId: string
  targetMetric: 'seed' | 'setup' | 'supporter' | 'energy'
  reason: string
  outCards: { cardName: string; count: number }[]
  inCards: { cardName: string; count: number }[]
  estimatedDelta: {
    seedRate?: number
    setupRate?: number
    supporterRate?: number
    energyRate?: number
  }
  confidence: number
}

export type InitialSimulationSummary = {
  totalTrials: number
  archetype: DeckArchetype
  setupConfig: SetupTargetConfig
  perspective: SimulationPerspective
  seedRate: SimulationMetricBreakdown
  setupRate: SimulationMetricBreakdown
  supporterRate: SimulationMetricBreakdown
  energyRate: SimulationMetricBreakdown
  averageMulliganCount: number
  failureBreakdown: FailureReasonBreakdown[]
  bestBoardExamples: BoardPatternExample[]
  failedBoardExamples: BoardPatternExample[]
  suggestions: DeckSwapSuggestion[]
  interpretation: {
    headline: string
    summaryLines: string[]
    improvementPriority: string[]
  }
  freeSummary: {
    headline: string
    shortReason: string
    warnings: string[]
  }
}

export type InitialSimulationRequest = {
  deck: DeckCard[]
  perspective: SimulationPerspective
  iterations?: number
  planTier?: SimulationPlanTier
  deckArchetypeHint?: DeckArchetype
}

export type InitialSimulationResponse = {
  success: boolean
  summary?: InitialSimulationSummary
  error?: string
}
