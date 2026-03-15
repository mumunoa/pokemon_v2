import { DeckArchetype, SetupTargetConfig } from '@/types/deck-analysis'

export class ArchetypePresetCatalog {
  static get(archetype: DeckArchetype, perspective: 'first' | 'second'): SetupTargetConfig {
    const turn = 2 // 基本的に先2/後2をターゲットにする

    switch (archetype) {
      case 'charizard_ex':
        return {
          archetype,
          perspective,
          targetTurn: turn as any,
          minBenchCount: 2,
          requireActiveBasic: true,
          requireSupporterAccess: true,
          requireEnergyAccess: true,
          requireMainAttackerReady: true,
          requireDrawEngineReady: false,
          requireEvolutionLineReady: true,
          preferredGoals: ['bench_setup', 'supporter_access', 'energy_access', 'evolution_line_ready', 'main_attacker_ready'],
          successLabel: 'ターン2までに進化ラインと盤面形成が整っている',
        }
      case 'dragapult_ex':
        return {
          archetype,
          perspective,
          targetTurn: turn as any,
          minBenchCount: 2,
          requireActiveBasic: true,
          requireSupporterAccess: true,
          requireEnergyAccess: true,
          requireMainAttackerReady: true,
          requireDrawEngineReady: false,
          requireEvolutionLineReady: true,
          preferredGoals: ['bench_setup', 'supporter_access', 'energy_access', 'evolution_line_ready'],
          successLabel: 'ターン2までに進化線と攻撃準備ラインが揃っている',
        }
      case 'lost_box':
        return {
          archetype,
          perspective,
          targetTurn: 2,
          minBenchCount: 2,
          requireActiveBasic: true,
          requireSupporterAccess: false,
          requireEnergyAccess: true,
          requireMainAttackerReady: false,
          requireDrawEngineReady: true,
          requireEvolutionLineReady: false,
          preferredGoals: ['bench_setup', 'draw_engine_ready', 'energy_access', 'search_chain_ready'],
          successLabel: 'キュワワー中心の回転初動が成立している',
        }
      case 'gardy':
        return {
          archetype,
          perspective,
          targetTurn: 2,
          minBenchCount: 2,
          requireActiveBasic: true,
          requireSupporterAccess: true,
          requireEnergyAccess: true,
          requireMainAttackerReady: false,
          requireDrawEngineReady: true,
          requireEvolutionLineReady: true,
          preferredGoals: ['bench_setup', 'draw_engine_ready', 'evolution_line_ready', 'energy_access'],
          successLabel: 'ラルトス/Kirliaラインの着地が見えている',
        }
      default:
        return {
          archetype,
          perspective,
          targetTurn: 2,
          minBenchCount: 1,
          requireActiveBasic: true,
          requireSupporterAccess: true,
          requireEnergyAccess: true,
          requireMainAttackerReady: false,
          requireDrawEngineReady: false,
          requireEvolutionLineReady: false,
          preferredGoals: ['bench_setup', 'supporter_access', 'energy_access'],
          successLabel: '汎用初動の最低ラインを満たしている',
        }
    }
  }
}
