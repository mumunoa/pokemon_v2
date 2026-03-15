import { DeckArchetype } from '@/types/deck-analysis'
import { CardRoleCatalog } from '../catalog/CardRoleCatalog'
import { SimCardInstance } from './DeckInstanceFactory'
import { SearchResolver } from './SearchResolver'

export type SimBoardState = {
  archetype: DeckArchetype
  active?: SimCardInstance
  bench: SimCardInstance[]
  hand: SimCardInstance[]
  deck: SimCardInstance[]
  discard: SimCardInstance[]
  supporterUsed: boolean
  energyAttachedThisTurn: boolean
  attachedEnergyToActive: number
  attachedEnergyToBench: number
  turn: number
}

/**
 * ターン内の行動ポリシー
 * ルールベースで「ドロー→展開→エネ→サポート」の流れを自動化します。
 */
export class TurnActionPolicy {
  constructor(private searchResolver = new SearchResolver()) {}

  run(board: SimBoardState): SimBoardState {
    let next = structuredClone(board)
    
    // 1. 手札から出せるたねを出す
    next = this.benchBasicsFromHand(next)
    
    // 2. サーチ・展開系グッズの使用
    next = this.resolveSearchItems(next)
    
    // 3. 再度手札から出せるたねを出す
    next = this.benchBasicsFromHand(next)
    
    // 4. サポートの使用
    next = this.resolveSupporter(next)
    
    // 5. 最後の展開
    next = this.benchBasicsFromHand(next)
    
    // 6. エネルギーの手張り
    next = this.attachEnergy(next)
    
    return next
  }

  private benchBasicsFromHand(board: SimBoardState): SimBoardState {
    const next = structuredClone(board)

    while (true) {
      const basic = next.hand.find((card) => CardRoleCatalog.hasRole(card.name, 'basic_pokemon'))
      if (!basic) break

      if (!next.active) {
        next.active = basic
        next.hand = next.hand.filter((c) => c.uid !== basic.uid)
      } else if (next.bench.length < 5) {
        next.bench.push(basic)
        next.hand = next.hand.filter((c) => c.uid !== basic.uid)
      } else {
        break
      }
    }

    return next
  }

  private resolveSearchItems(board: SimBoardState): SimBoardState {
    let next = structuredClone(board)

    // ループ防止のため1ターンに使用するグッズ数を制限
    let itemLimit = 5
    while (itemLimit > 0) {
      itemLimit--
      const itemIdx = next.hand.findIndex(c => 
        CardRoleCatalog.hasRole(c.name, 'search_basic_item') || 
        CardRoleCatalog.hasRole(c.name, 'bench_setup_item') ||
        CardRoleCatalog.hasRole(c.name, 'search_any_item') ||
        CardRoleCatalog.hasRole(c.name, 'energy_search')
      )
      
      if (itemIdx === -1) break
      
      const item = next.hand[itemIdx]
      next.hand.splice(itemIdx, 1)
      next.discard.push(item)

      if (CardRoleCatalog.hasRole(item.name, 'search_basic_item') || CardRoleCatalog.hasRole(item.name, 'bench_setup_item')) {
        const targetIdx = this.searchResolver.findBestBasicTarget(next.deck, next.archetype)
        if (targetIdx >= 0) {
          const [target] = next.deck.splice(targetIdx, 1)
          next.hand.push(target)
        }
      } else if (CardRoleCatalog.hasRole(item.name, 'energy_search')) {
        const targetIdx = this.searchResolver.findBestEnergyTarget(next.deck)
        if (targetIdx >= 0) {
          const [target] = next.deck.splice(targetIdx, 1)
          next.hand.push(target)
        }
      } else if (CardRoleCatalog.hasRole(item.name, 'search_any_item')) {
        // デッキタイプに合わせて柔軟に（とりあえず基本はたね）
        const targetIdx = this.searchResolver.findBestBasicTarget(next.deck, next.archetype)
        if (targetIdx >= 0) {
          const [target] = next.deck.splice(targetIdx, 1)
          next.hand.push(target)
        }
      }
    }

    return next
  }

  private resolveSupporter(board: SimBoardState): SimBoardState {
    const next = structuredClone(board)
    if (next.supporterUsed) return next

    const supIdx = next.hand.findIndex(c => CardRoleCatalog.hasRole(c.name, 'draw_supporter') || CardRoleCatalog.hasRole(c.name, 'stabilizer_supporter'))
    if (supIdx === -1) return next

    const supporter = next.hand[supIdx]
    next.hand.splice(supIdx, 1)
    next.discard.push(supporter)
    next.supporterUsed = true

    // 簡易ドローロジック
    if (CardRoleCatalog.hasRole(supporter.name, 'draw_supporter')) {
      const drawCount = supporter.name.includes('博士') ? 7 : 4
      const drawn = next.deck.splice(0, drawCount)
      next.hand.push(...drawn)
    } else if (CardRoleCatalog.hasRole(supporter.name, 'stabilizer_supporter')) {
      // ペパーのようなサーチ
      const targetIdx = this.searchResolver.findBestBasicTarget(next.deck, next.archetype)
      if (targetIdx >= 0) {
        const [target] = next.deck.splice(targetIdx, 1)
        next.hand.push(target)
      }
    }

    return next
  }

  private attachEnergy(board: SimBoardState): SimBoardState {
    const next = structuredClone(board)
    if (next.energyAttachedThisTurn) return next

    const eneIdx = next.hand.findIndex(c => CardRoleCatalog.hasRole(c.name, 'energy_basic') || CardRoleCatalog.hasRole(c.name, 'energy_special'))
    if (eneIdx === -1) return next

    const energy = next.hand[eneIdx]
    next.hand.splice(eneIdx, 1)
    
    if (next.active) {
      next.attachedEnergyToActive += 1
      next.energyAttachedThisTurn = true
    }

    return next
  }
}
