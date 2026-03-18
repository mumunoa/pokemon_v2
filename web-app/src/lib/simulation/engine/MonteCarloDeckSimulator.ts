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

import { SetupTargetConfig, DeckArchetype } from '@/types/deck-analysis'

export class MonteCarloDeckSimulator {
  private rng: SeededRandom
  private mulliganEngine: MulliganEngine
  private actionPolicy: TurnActionPolicy
  private inferencer: DeckArchetypeInferencer

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
    
    // 簡易的な成功判定
    const setupSuccess = this.judgeSetupSuccess(board, setupConfig, failureReasons)

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
        reachedDrawEngine: false, // 将来的に実装
        reachedMainAttackerLine: false, // 将来的に実装
        setupSuccess,
        failureReasons
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

  private judgeSetupSuccess(board: SimBoardState, config: SetupTargetConfig, reasons: FailureReasonType[]): boolean {
      let isSuccess = true

      // 1. ベンチ展開判定（役割ベースでの推論を含む）
      if (config.minBenchCount > board.bench.length) {
          isSuccess = false
          reasons.push('NO_BENCH_SETUP')
      }

      // 2. エネルギーアクセス判定
      if (config.requireEnergyAccess && board.attachedEnergyToActive === 0 && board.attachedEnergyToBench === 0) {
          isSuccess = false
          reasons.push('NO_ENERGY')
      }

      // 3. サポートアクセス判定
      if (config.requireSupporterAccess && !board.supporterUsed) {
          isSuccess = false
          reasons.push('NO_SUPPORTER')
      }

      // 4. 進化ライン判定（推論エンジンによるロールを参照）
      if (config.requireEvolutionLineReady) {
          const hasEvolutionReady = board.bench.some(c => CardRoleCatalog.hasRole(c, 'evolution_pokemon')) || 
                                   board.hand.some(c => CardRoleCatalog.hasRole(c, 'evolution_pokemon')) ||
                                   board.hand.some(c => CardRoleCatalog.hasRole(c, 'evolution_search'))
          
          if (!hasEvolutionReady) {
              isSuccess = false
              reasons.push('NO_EVOLUTION_LINE')
          }
      }

      // 5. メインアタッカー準備判定（推論エンジンのロールを参照）
      if (config.requireMainAttackerReady) {
          const hasMainAttacker = board.active && CardRoleCatalog.hasRole(board.active, 'main_attacker') ||
                                 board.bench.some(c => CardRoleCatalog.hasRole(c, 'main_attacker'))
          
          if (!hasMainAttacker) {
              const hasSearchForMain = board.hand.some(c => CardRoleCatalog.hasRole(c, 'search'))
              if (!hasSearchForMain) {
                  isSuccess = false
                  reasons.push('NO_MAIN_ATTACKER')
              }
          }
      }

      // 6. ドローエンジン準備判定（推論エンジンのロールを参照）
      if (config.requireDrawEngineReady) {
          const hasDrawEngine = board.bench.some(c => CardRoleCatalog.hasRole(c, 'draw')) ||
                               board.bench.some(c => CardRoleCatalog.hasRole(c, 'consistency'))
          
          if (!hasDrawEngine) {
              isSuccess = false
              reasons.push('NO_DRAW_ENGINE')
          }
      }

      return isSuccess
  }
}
