import { DeckCard } from '@/types/game'
import { DeckArchetype } from '@/types/deck-analysis'
import { CardRoleCatalog } from './CardRoleCatalog'

export class DeckArchetypeInferencer {
  infer(deck: DeckCard[]): DeckArchetype {
    const score = new Map<DeckArchetype, number>()

    for (const card of deck) {
      const hints = CardRoleCatalog.inferArchetypeHints(card.name)
      for (const hint of hints) {
        score.set(hint, (score.get(hint) ?? 0) + card.count)
      }

      if (card.name.includes('リザードン')) score.set('charizard_ex', (score.get('charizard_ex') ?? 0) + 5)
      if (card.name.includes('ドラパルト')) score.set('dragapult_ex', (score.get('dragapult_ex') ?? 0) + 5)
      if (card.name.includes('キュワワー') || card.name.includes('ロスト')) score.set('lost_box', (score.get('lost_box') ?? 0) + 4)
      if (card.name.includes('サーナイト') || card.name.includes('キルリア')) score.set('gardy', (score.get('gardy') ?? 0) + 4)
    }

    const best = [...score.entries()].sort((a, b) => b[1] - a[1])[0]
    return best?.[0] ?? 'generic_setup'
  }
}
