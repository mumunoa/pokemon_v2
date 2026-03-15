import { SimCardInstance } from './DeckInstanceFactory'
import { CardRoleCatalog } from '../catalog/CardRoleCatalog'
import { SeededRandom } from '../engine/SeededRandom'

export class MulliganEngine {
  drawOpeningHand(deck: SimCardInstance[], rng: SeededRandom) {
    let currentDeck = [...deck]
    let hand = currentDeck.splice(0, 7)
    let mulliganCount = 0

    // 最大10回まで引き直し（無限ループ防止）
    while (!this.hasBasic(hand) && mulliganCount < 10) {
      mulliganCount += 1
      currentDeck = rng.shuffle([...currentDeck, ...hand])
      hand = currentDeck.splice(0, 7)
    }

    return { hand, deck: currentDeck, mulliganCount }
  }

  hasBasic(hand: SimCardInstance[]): boolean {
    return hand.some((card) => CardRoleCatalog.hasRole(card.name, 'basic_pokemon'))
  }

  pickStartingBasic(hand: SimCardInstance[]): SimCardInstance {
    return (
      hand.find((card) => CardRoleCatalog.hasRole(card.name, 'main_attacker_basic')) ??
      hand.find((card) => CardRoleCatalog.hasRole(card.name, 'basic_pokemon')) ??
      hand[0]
    )
  }
}
