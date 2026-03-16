import { CardRoleTag } from '@/types/simulation'
import { DeckArchetype } from '@/types/deck-analysis'
import { SimCardInstance } from '../core/DeckInstanceFactory'
import cardMaster from './card-master.json'

/**
 * カード名の正規化
 * スペースや全角括弧などを除去して比較しやすくします。
 */
function normalizeCardName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
}

/**
 * カード役割カタログ
 * 外部JSON（card-master.json）からデータを読み込み、
 * シミュレーションに必要なカード属性を高速に提供します。
 */
export class CardRoleCatalog {
  private static exactMap: Map<string, CardRoleTag> = new Map()
  private static partialRules = cardMaster.partialMatches

  // クラスの初期化時にMapを作成して高速化
  static {
    cardMaster.exactMatches.forEach((entry: any) => {
      const normalized = normalizeCardName(entry.name)
      this.exactMap.set(normalized, {
        cardName: entry.name,
        roles: entry.roles as any[],
        archetypeHints: (entry.archetypes as DeckArchetype[]) || [],
      })
    })
  }

  /**
   * カードの役割情報を取得
   * 1. 完全一致（完全一致Map）
   * 2. 部分一致（パターンルール）
   * 3. メタデータ推論（フォールバック）
   */
  static getRoles(cardOrName: string | SimCardInstance): CardRoleTag {
    const name = typeof cardOrName === 'string' ? cardOrName : cardOrName.name
    const normalized = normalizeCardName(name)

    // 1. 完全一致
    const exact = this.exactMap.get(normalized)
    if (exact) return exact

    // 2. 部分一致ルール
    const partial = this.partialRules.find((rule) => normalized.includes(rule.pattern))
    if (partial) {
      return {
        cardName: name,
        roles: partial.roles as any[],
      }
    }

    // 3. メタデータによる推論（カタログ未登録時のセーフティネット）
    if (typeof cardOrName !== 'string') {
      const roles: any[] = []
      if (cardOrName.type === 'pokemon') {
        roles.push('basic_pokemon')
        if (cardOrName.kinds === 'has_rule') roles.push('main_attacker')
      } else if (cardOrName.type === 'energy') {
        roles.push('energy_basic')
      } else if (cardOrName.type === 'trainer') {
        if (cardOrName.kinds === 'supporter') roles.push('draw_supporter')
        if (cardOrName.kinds === 'item' || cardOrName.kinds === 'ball') roles.push('search_basic_item')
      }

      if (roles.length > 0) {
        return { cardName: name, roles }
      }
    }

    return { cardName: name, roles: ['unknown'] }
  }

  /**
   * 指定した役割を持っているか判定
   */
  static hasRole(cardOrName: string | SimCardInstance, role: string): boolean {
    return this.getRoles(cardOrName).roles.includes(role as any)
  }

  /**
   * カードから推論されるアーキタイプのヒントを取得
   */
  static inferArchetypeHints(cardOrName: string | SimCardInstance): DeckArchetype[] {
    return this.getRoles(cardOrName).archetypeHints ?? []
  }
}
