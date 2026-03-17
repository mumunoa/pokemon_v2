import { SimCardInstance } from './DeckInstanceFactory'
import { CardRoleCatalog } from '../catalog/CardRoleCatalog'
import { DeckArchetype } from '@/types/deck-analysis'

export class SearchResolver {
  findBestBasicTarget(deck: SimCardInstance[], _archetype: DeckArchetype): number {
    const main = deck.findIndex((card) => CardRoleCatalog.hasRole(card, 'main_attacker_basic'))
    if (main >= 0) return main
    return deck.findIndex((card) => card.type === 'pokemon' && card.kinds === 'basic')
  }

  findBestEvolutionTarget(deck: SimCardInstance[]): number {
    return deck.findIndex((card) => CardRoleCatalog.hasRole(card, 'evolution_pokemon'))
  }

  findBestEnergyTarget(deck: SimCardInstance[]): number {
    return deck.findIndex((card) => card.type === 'energy')
  }

  findBestSupporterTarget(deck: SimCardInstance[]): number {
    return deck.findIndex((card) =>
      CardRoleCatalog.hasRole(card, 'draw_supporter') ||
      CardRoleCatalog.hasRole(card, 'stabilizer_supporter'),
    )
  }
}
