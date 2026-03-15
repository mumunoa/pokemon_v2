import { SimCardInstance } from './DeckInstanceFactory'
import { CardRoleCatalog } from '../catalog/CardRoleCatalog'
import { DeckArchetype } from '@/types/deck-analysis'

export class SearchResolver {
  findBestBasicTarget(deck: SimCardInstance[], _archetype: DeckArchetype): number {
    const main = deck.findIndex((card) => CardRoleCatalog.hasRole(card.name, 'main_attacker_basic'))
    if (main >= 0) return main
    return deck.findIndex((card) => CardRoleCatalog.hasRole(card.name, 'basic_pokemon'))
  }

  findBestEvolutionTarget(deck: SimCardInstance[]): number {
    return deck.findIndex((card) => CardRoleCatalog.hasRole(card.name, 'evolution_pokemon'))
  }

  findBestEnergyTarget(deck: SimCardInstance[]): number {
    return deck.findIndex((card) =>
      CardRoleCatalog.hasRole(card.name, 'energy_basic') ||
      CardRoleCatalog.hasRole(card.name, 'energy_special'),
    )
  }

  findBestSupporterTarget(deck: SimCardInstance[]): number {
    return deck.findIndex((card) =>
      CardRoleCatalog.hasRole(card.name, 'draw_supporter') ||
      CardRoleCatalog.hasRole(card.name, 'stabilizer_supporter'),
    )
  }
}
