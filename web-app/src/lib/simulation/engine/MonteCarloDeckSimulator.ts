import { 
  InitialSimulationRequest, 
  InitialSimulationResponse, 
  SimulationTrialLog, 
  BoardSnapshotLite,
  FailureReasonType
} from '@/types/simulation'
import { SeededRandom } from './SeededRandom'
import { DeckInstanceFactory, SimCardInstance } from '../core/DeckInstanceFactory'
import { MulliganEngine } from '../core/MulliganEngine'
import { TurnActionPolicy, SimBoardState } from '../core/TurnActionPolicy'
import { DeckArchetypeInferencer } from '../catalog/DeckArchetypeInferencer'
import { ArchetypePresetCatalog } from '../catalog/ArchetypePresetCatalog'
import { CardRoleCatalog } from '../catalog/CardRoleCatalog'

// role.complete.ts 由来の推論エンジンと型をインポート
import { createRoleProfile } from '@/features/practice/ai-next/inference/sectionRoleInference'
import { CardRoleProfile, StaticRole, SectionInferenceInput } from '@/features/practice/ai-next/domain/types'
import { isBasicPokemon } from '@/types/game'
import { CardRole } from '@/types/simulation'

import { SetupTargetConfig, DeckArchetype } from '@/types/deck-analysis'

export class MonteCarloDeckSimulator {
  private rng: SeededRandom
  private mulliganEngine: MulliganEngine
  private actionPolicy: TurnActionPolicy
  private inferencer: DeckArchetypeInferencer
  private roleProfileMap: Map<string, CardRoleProfile> = new Map()

  constructor(seed = Date.now()) {
    this.rng = new SeededRandom(seed)
    this.mulliganEngine = new MulliganEngine()
    this.actionPolicy = new TurnActionPolicy()
    this.inferencer = new DeckArchetypeInferencer()
  }

  simulate(request: InitialSimulationRequest): SimulationTrialLog[] {
    const iterations = request.iterations || 1000
    const deckBase = DeckInstanceFactory.expand(request.deck)
    const archetype = request.deckArchetypeHint || this.inferencer.infer(request.deck)
    const setupConfig = ArchetypePresetCatalog.get(archetype, request.perspective || 'first')

    // 1. 各カードのRoleProfileを事前計算 (role.complete.ts のロジックを流し込む)
    this.roleProfileMap.clear()
    for (const deckCard of request.deck) {
      if (this.roleProfileMap.has(deckCard.id)) continue

      const sections: SectionInferenceInput[] = []
      if (deckCard.ability) {
        deckCard.ability.forEach(a => sections.push({ 
          cardId: deckCard.id, 
          cardName: deckCard.name, 
          text: a.text, 
          source: 'ability' 
        }))
      }
      if (deckCard.attacks) {
        deckCard.attacks.forEach(a => sections.push({ 
          cardId: deckCard.id, 
          cardName: deckCard.name, 
          text: a.text, 
          source: 'attack' 
        }))
      }
      if (deckCard.rules) {
        deckCard.rules.forEach(r => sections.push({ 
          cardId: deckCard.id, 
          cardName: deckCard.name, 
          text: r.text, 
          source: 'rule' 
        }))
      }

      const cardLike = {
        id: deckCard.id,
        name: deckCard.name,
        type: deckCard.type,
        kinds: deckCard.kinds,
        hp: deckCard.hp,
        retreat: deckCard.retreat,
        evolvesTo: deckCard.evolves
      }

      const profile = createRoleProfile(cardLike, sections)
      this.roleProfileMap.set(deckCard.id, profile)
    }

    // 2. SimCardInstanceに推論結果を反映（CardRoleCatalogが提供するRoleと互換性を持たせる）
    deckBase.forEach(card => {
        const profile = this.roleProfileMap.get(card.baseId)
        if (profile) {
            // StaticRole を既存の CardRole にマッピングして反映
            const mappedRoles = this.mapStaticRolesToCardRoles(profile.staticRoles, card.kinds || '')
            card.roles = mappedRoles
        }
    })

    const logs: SimulationTrialLog[] = []

    for (let i = 0; i < iterations; i++) {
        logs.push(this.runSingleTrial(i, deckBase, archetype, request.perspective || 'first', setupConfig))
    }

    return logs
  }

  private runSingleTrial(
    index: number, 
    deckBase: SimCardInstance[], 
    archetype: DeckArchetype, 
    perspective: string,
    setupConfig: SetupTargetConfig
  ): SimulationTrialLog {
    // 1. シャッフルと手札準備
    let deck = this.rng.shuffle(deckBase)
    const { hand, deck: postMulliganDeck, mulliganCount } = this.mulliganEngine.drawOpeningHand(deck, this.rng)
    deck = postMulliganDeck

    // サイド落ち（簡易：6枚を適当に抜く）
    const prizes = deck.splice(0, 6)

    // 2. 盤面初期化
    let board: SimBoardState = {
        archetype,
        hand,
        deck,
        bench: [],
        discard: [],
        supporterUsed: false,
        energyAttachedThisTurn: false,
        attachedEnergyToActive: 0,
        attachedEnergyToBench: 0,
        turn: 1
    }

    // 最初の一体を選ぶ
    const initialActive = this.mulliganEngine.pickStartingBasic(board.hand)
    board.active = initialActive
    board.hand = board.hand.filter(c => c.uid !== initialActive.uid)

    // 3. ターン1実行
    board = this.actionPolicy.run(board)
    const turn1Snapshot = this.takeSnapshot(board)

    // 4. ターン2準備 (ドロー)
    if (board.deck.length > 0) {
        board.hand.push(board.deck.splice(0, 1)[0])
    }
    board.turn = 2
    board.supporterUsed = false
    board.energyAttachedThisTurn = false
    
    // ターン2実行
    board = this.actionPolicy.run(board)
    const turn2Snapshot = this.takeSnapshot(board)

    // 5. 指標判定
    const failureReasons: FailureReasonType[] = []
    
    const reachedBasic = board.active !== undefined || board.bench.length > 0
    const reachedSupporter = turn1Snapshot.supporterUsed || turn2Snapshot.supporterUsed
    const reachedEnergy = board.attachedEnergyToActive > 0 || board.attachedEnergyToBench > 0
    
    // role.complete.ts 由来の解析結果を取得
    const handProfiles = board.hand.map(c => this.roleProfileMap.get(c.baseId)).filter(p => !!p) as CardRoleProfile[]
    const boardProfiles = [
        board.active ? this.roleProfileMap.get(board.active.baseId) : undefined,
        ...board.bench.map(c => this.roleProfileMap.get(c.baseId))
    ].filter(p => !!p) as CardRoleProfile[]

    const reachedDrawEngine = boardProfiles.some(p => p.staticRoles.includes('draw') || p.staticRoles.includes('consistency'))
    const reachedMainAttackerLine = boardProfiles.some(p => p.staticRoles.includes('main_attacker'))

    // 重み付きスコアによる成功判定
    const setupSuccess = this.judgeSetupSuccess(board, handProfiles, archetype, failureReasons)

    // openingHand (マリガン直後の初期7枚) から各カードのドローをカウント
    const drawnBasics = hand.filter(c => isBasicPokemon(c)).map(c => c.name)

    return {
        trialIndex: index,
        mulliganCount,
        archetype,
        openingHand: hand.map(c => c.name),
        turn1: turn1Snapshot,
        turn2: turn2Snapshot,
        reachedBasic,
        reachedSupporter,
        reachedEnergy,
        reachedDrawEngine,
        reachedMainAttackerLine,
        setupSuccess,
        failureReasons,
        drawnBasics
    }
  }

  private takeSnapshot(board: SimBoardState): BoardSnapshotLite {
      return {
          turn: board.turn,
          active: board.active?.name,
          bench: board.bench.map(c => c.name),
          handCount: board.hand.length,
          supporterUsed: board.supporterUsed,
          energyAttachedToActive: board.attachedEnergyToActive,
          playableSupporters: board.hand.filter(c => c.type === 'trainer' && c.kinds === 'supporter').map(c => c.name),
          playableSearchItems: board.hand.filter(c => c.type === 'trainer' && (c.kinds === 'item' || c.kinds === 'tool')).map(c => c.name),
          notableCardsInHand: board.hand.slice(0, 3).map(c => c.name),
          archetype: board.archetype
      }
  }

  private judgeSetupSuccess(
    board: SimBoardState, 
    handProfiles: CardRoleProfile[], 
    archetype: DeckArchetype,
    reasons: FailureReasonType[]
  ): boolean {
      const hasBasic = board.active !== undefined || board.bench.length > 0
      const benchCount = board.bench.length
      const hasSupporter = board.supporterUsed
      
      const hasDrawRole = handProfiles.some(p => p.staticRoles.includes('draw'))
      const hasSearchRole = handProfiles.some(p => 
        p.staticRoles.some(r => ['basic_search', 'pokemon_search', 'evolution_search', 'bench_setup'].includes(r))
      )
      
      const hasAttackerReady = board.active && this.roleProfileMap.get(board.active.baseId)?.staticRoles.includes('main_attacker')
      const hasEnergyReady = board.attachedEnergyToActive > 0 || board.attachedEnergyToBench > 0
      const hasEvolutionLine = handProfiles.some(p => 
        p.staticRoles.includes('evolution_search') || p.staticRoles.includes('setup_cheat')
      )

      const roleDrivenProgress = this.calcRoleDrivenProgress(handProfiles)

      const score = this.calcOpeningSetupScore({
          hasBasic,
          benchCount,
          hasSupporter,
          hasDrawRole,
          hasSearchRole,
          hasAttackerReady: !!hasAttackerReady,
          hasEnergyReady,
          hasEvolutionLine,
          roleDrivenProgress
      })

      const threshold = this.resolveOpeningThreshold(archetype)
      const success = score >= threshold

      if (!success) {
          if (!hasBasic) reasons.push('NO_BASIC')
          if (benchCount === 0) reasons.push('NO_BENCH_SETUP')
          if (!hasSupporter && !hasDrawRole) reasons.push('NO_SUPPORTER')
          if (!hasEnergyReady) reasons.push('NO_ENERGY')
          if (!hasEvolutionLine && archetype.includes('ex')) reasons.push('NO_EVOLUTION_LINE')
          if (score < 40) reasons.push('HAND_BRICK')
      }

      return success
  }

  private calcRoleDrivenProgress(handProfiles: CardRoleProfile[]): number {
    let score = 0
    for (const profile of handProfiles) {
      if (profile.staticRoles.includes('basic_search')) score += 0.20
      if (profile.staticRoles.includes('bench_setup')) score += 0.20
      if (profile.staticRoles.includes('draw')) score += 0.15
      if (profile.staticRoles.includes('hand_refresh')) score += 0.15
      if (profile.staticRoles.includes('pokemon_search')) score += 0.15
      if (profile.staticRoles.includes('evolution_search')) score += 0.10
      if (profile.staticRoles.includes('energy_accel')) score += 0.10
      if (profile.staticRoles.includes('setup_cheat')) score += 0.10
      if (profile.staticRoles.includes('consistency')) score += 0.10
    }
    return Math.min(score, 1)
  }

  private calcOpeningSetupScore(input: {
    hasBasic: boolean
    benchCount: number
    hasSupporter: boolean
    hasDrawRole: boolean
    hasSearchRole: boolean
    hasAttackerReady: boolean
    hasEnergyReady: boolean
    hasEvolutionLine: boolean
    roleDrivenProgress: number
  }): number {
    let score = 0
    if (input.hasBasic) score += 25
    score += Math.min(input.benchCount, 3) * 10
    if (input.hasSupporter) score += 12
    if (input.hasDrawRole) score += 10
    if (input.hasSearchRole) score += 12
    if (input.hasAttackerReady) score += 12
    if (input.hasEnergyReady) score += 8
    if (input.hasEvolutionLine) score += 8
    score += input.roleDrivenProgress * 13
    return Math.min(score, 100)
  }

  private resolveOpeningThreshold(archetype: string): number {
    switch (archetype) {
      case 'charizard_ex': return 68
      case 'dragapult_ex': return 66
      case 'gardevoir_ex': return 67
      default: return 65
    }
  }

  /**
   * StaticRole を、既存のシミュレーションロジックが期待する CardRole に変換します。
   * これにより、TurnActionPolicyやSearchResolverを書き換えることなく推論結果を流し込めます。
   */
  private mapStaticRolesToCardRoles(staticRoles: StaticRole[], kinds: string): CardRole[] {
    const roles: Set<CardRole> = new Set()
    
    staticRoles.forEach(r => {
        // 基本的な役割の継承
        if (r === 'draw') roles.add('draw')
        if (r === 'bench_setup') roles.add('bench_setup')
        if (r === 'consistency') roles.add('consistency')
        if (r === 'energy_search') roles.add('energy_search')
        
        // シミュレーター固有の役割への詳細マッピング
        if (r === 'basic_search' || r === 'pokemon_search') {
            if (kinds === 'item') roles.add('search_basic_item')
            roles.add('search')
        }
        if (r === 'evolution_search') {
            if (kinds === 'item') roles.add('search_evolution_item')
            roles.add('evolution_pokemon') // 進化先として認識
        }
        if (r === 'main_attacker') {
            roles.add('main_attacker')
            if (kinds === 'basic') roles.add('main_attacker_basic')
        }
        if (r === 'draw' || r === 'hand_refresh') {
            if (kinds === 'supporter') roles.add('draw_supporter')
            if (kinds === 'item') roles.add('draw_item')
        }
        if (r === 'energy_accel') roles.add('energy_accel_piece')
    })
    
    return Array.from(roles)
  }
}
