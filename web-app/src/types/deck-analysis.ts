export type DeckArchetype =
  | 'charizard_ex'
  | 'dragapult_ex'
  | 'lost_box'
  | 'gardy'
  | 'ancient_box'
  | 'raging_bolt'
  | 'paojian_bax'
  | 'lugia'
  | 'terapagos'
  | 'generic_setup'
  | 'unknown'

export type SetupGoalType =
  | 'bench_setup'
  | 'supporter_access'
  | 'energy_access'
  | 'main_attacker_ready'
  | 'draw_engine_ready'
  | 'evolution_line_ready'
  | 'search_chain_ready'

export type SetupTargetConfig = {
  archetype: DeckArchetype
  perspective: 'first' | 'second'
  targetTurn: 1 | 2
  minBenchCount: number
  requireActiveBasic: boolean
  requireSupporterAccess: boolean
  requireEnergyAccess: boolean
  requireMainAttackerReady: boolean
  requireDrawEngineReady: boolean
  requireEvolutionLineReady: boolean
  preferredGoals: SetupGoalType[]
  successLabel: string
}
