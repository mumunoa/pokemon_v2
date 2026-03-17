import { DeckCard } from '@/types/game'

export type SimCardInstance = {
  uid: string
  baseId: string
  name: string
  countIndex: number
  type?: string
  kinds?: string
  roles?: string[]
  archetypes?: string[]
}

export class DeckInstanceFactory {
  static expand(deck: DeckCard[]): SimCardInstance[] {
    const cards: SimCardInstance[] = []

    for (const deckCard of deck) {
      for (let i = 0; i < deckCard.count; i++) {
        cards.push({
          uid: `${deckCard.id}-${i + 1}`,
          baseId: deckCard.id,
          name: deckCard.name,
          countIndex: i + 1,
          type: deckCard.type,
          kinds: deckCard.kinds,
          roles: deckCard.roles,
          archetypes: deckCard.archetypes,
        })
      }
    }

    return cards
  }
}
