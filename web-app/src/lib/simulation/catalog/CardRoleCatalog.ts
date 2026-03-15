import { CardRoleTag } from '@/types/simulation'
import { DeckArchetype } from '@/types/deck-analysis'

function normalizeCardName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
}

export class CardRoleCatalog {
  private static exactMap: Record<string, CardRoleTag> = {
    'ヒトカゲ': {
      cardName: 'ヒトカゲ',
      roles: ['basic_pokemon', 'main_attacker_basic'],
      archetypeHints: ['charizard_ex'],
    },
    'リザード': {
      cardName: 'リザード',
      roles: ['evolution_pokemon'],
      archetypeHints: ['charizard_ex'],
    },
    'リザードンex': {
      cardName: 'リザードンex',
      roles: ['evolution_pokemon', 'main_attacker', 'main_attacker_stage2'],
      archetypeHints: ['charizard_ex'],
    },
    'ポッポ': {
      cardName: 'ポッポ',
      roles: ['basic_pokemon'],
      archetypeHints: ['charizard_ex'],
    },
    'ピジョットex': {
      cardName: 'ピジョットex',
      roles: ['evolution_pokemon', 'draw_engine_pokemon'],
      archetypeHints: ['charizard_ex'],
    },
    'ドラメシヤ': {
      cardName: 'ドラメシヤ',
      roles: ['basic_pokemon', 'main_attacker_basic'],
      archetypeHints: ['dragapult_ex'],
    },
    'ドロンチ': {
      cardName: 'ドロンチ',
      roles: ['evolution_pokemon'],
      archetypeHints: ['dragapult_ex'],
    },
    'ドラパルトex': {
      cardName: 'ドラパルトex',
      roles: ['evolution_pokemon', 'main_attacker', 'main_attacker_stage2'],
      archetypeHints: ['dragapult_ex'],
    },
    'キュワワー': {
      cardName: 'キュワワー',
      roles: ['basic_pokemon', 'support_pokemon', 'draw_engine_pokemon'],
      archetypeHints: ['lost_box'],
    },
    'ウッウ': {
      cardName: 'ウッウ',
      roles: ['basic_pokemon', 'main_attacker'],
      archetypeHints: ['lost_box'],
    },
    'ヤミラミ': {
        cardName: 'ヤミラミ',
        roles: ['basic_pokemon', 'main_attacker'],
        archetypeHints: ['lost_box'],
    },
    'かがやくゲッコウガ': {
      cardName: 'かがやくゲッコウガ',
      roles: ['basic_pokemon', 'support_pokemon', 'draw_engine_pokemon'],
      archetypeHints: ['lost_box', 'paojian_bax', 'generic_setup'],
    },
    'ラルトス': {
      cardName: 'ラルトス',
      roles: ['basic_pokemon', 'main_attacker_basic'],
      archetypeHints: ['gardy'],
    },
    'キルリア': {
      cardName: 'キルリア',
      roles: ['evolution_pokemon', 'draw_engine_pokemon'],
      archetypeHints: ['gardy'],
    },
    'サーナイトex': {
      cardName: 'サーナイトex',
      roles: ['evolution_pokemon', 'main_attacker', 'main_attacker_stage2'],
      archetypeHints: ['gardy'],
    },
    'ネストボール': {
      cardName: 'ネストボール',
      roles: ['search_basic_item', 'bench_setup_item', 'ball_item'],
    },
    'ハイパーボール': {
      cardName: 'ハイパーボール',
      roles: ['search_any_item', 'ball_item'],
    },
    'キャプチャーアロマ': {
      cardName: 'キャプチャーアロマ',
      roles: ['search_basic_item', 'search_evolution_item'],
    },
    'なかよしポフィン': {
      cardName: 'なかよしポフィン',
      roles: ['search_basic_item', 'bench_setup_item'],
    },
    'ヒスイのヘビーボール': {
        cardName: 'ヒスイのヘビーボール',
        roles: ['search_basic_item'],
    },
    'ポケギア3.0': {
      cardName: 'ポケギア3.0',
      roles: ['draw_item', 'stabilizer_supporter'],
    },
    '大地の器': {
      cardName: '大地の器',
      roles: ['energy_search'],
    },
    'ポケモンいれかえ': {
      cardName: 'ポケモンいれかえ',
      roles: ['switch_item'],
    },
    'あなぬけのヒモ': {
      cardName: 'あなぬけのヒモ',
      roles: ['switch_item'],
    },
    'いれかえカート': {
        cardName: 'いれかえカート',
        roles: ['switch_item'],
    },
    '博士の研究': {
      cardName: '博士の研究',
      roles: ['draw_supporter'],
    },
    'ナンジャモ': {
      cardName: 'ナンジャモ',
      roles: ['hand_refresh_supporter', 'draw_supporter'],
    },
    'ペパー': {
      cardName: 'ペパー',
      roles: ['stabilizer_supporter', 'search_any_item'],
    },
    'アクロマの実験': {
        cardName: 'アクロマの実験',
        roles: ['draw_supporter', 'stabilizer_supporter'],
        archetypeHints: ['lost_box'],
    },
    'カイ': {
        cardName: 'カイ',
        roles: ['stabilizer_supporter', 'search_any_item'],
        archetypeHints: ['paojian_bax'],
    },
    '基本炎エネルギー': {
      cardName: '基本炎エネルギー',
      roles: ['energy_basic'],
      archetypeHints: ['charizard_ex', 'raging_bolt', 'generic_setup'],
    },
    '基本水エネルギー': {
      cardName: '基本水エネルギー',
      roles: ['energy_basic'],
      archetypeHints: ['paojian_bax', 'generic_setup'],
    },
    '基本超エネルギー': {
      cardName: '基本超エネルギー',
      roles: ['energy_basic'],
      archetypeHints: ['gardy', 'generic_setup'],
    },
    '基本闘エネルギー': {
        cardName: '基本闘エネルギー',
        roles: ['energy_basic'],
    },
    '基本悪エネルギー': {
        cardName: '基本悪エネルギー',
        roles: ['energy_basic'],
    },
    '基本鋼エネルギー': {
        cardName: '基本鋼エネルギー',
        roles: ['energy_basic'],
    },
    '基本雷エネルギー': {
        cardName: '基本雷エネルギー',
        roles: ['energy_basic'],
    },
    '基本草エネルギー': {
        cardName: '基本草エネルギー',
        roles: ['energy_basic'],
    },
    'ジェットエネルギー': {
        cardName: 'ジェットエネルギー',
        roles: ['energy_special', 'switch_item'],
    },
  }

  private static partialRules: Array<{ includes: string; tag: CardRoleTag }> = [
    { includes: 'エネルギー', tag: { cardName: 'generic-energy', roles: ['energy_basic'] } },
    { includes: 'ボール', tag: { cardName: 'generic-ball', roles: ['ball_item', 'search_basic_item'] } },
    { includes: '博士', tag: { cardName: 'generic-professor', roles: ['draw_supporter'] } },
    { includes: 'ナンジャモ', tag: { cardName: 'generic-refresh', roles: ['hand_refresh_supporter', 'draw_supporter'] } },
    { includes: 'ポフィン', tag: { cardName: 'generic-poffin', roles: ['search_basic_item', 'bench_setup_item'] } },
    { includes: 'ふしぎなアメ', tag: { cardName: 'generic-candy', roles: ['evolution_pokemon'] } },
  ]

  static getRoles(cardName: string): CardRoleTag {
    const normalized = normalizeCardName(cardName)
    if (this.exactMap[normalized]) return this.exactMap[normalized]

    const partial = this.partialRules.find((rule) => normalized.includes(rule.includes))
    if (partial) return { ...partial.tag, cardName }

    return { cardName, roles: ['unknown'] }
  }

  static hasRole(cardName: string, role: string): boolean {
    return this.getRoles(cardName).roles.includes(role as any)
  }

  static inferArchetypeHints(cardName: string): DeckArchetype[] {
    return this.getRoles(cardName).archetypeHints ?? []
  }
}
