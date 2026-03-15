import { 
  SimulationTrialLog, 
  DeckSwapSuggestion,
  FailureReasonBreakdown
} from '@/types/simulation'
import { CardRoleCatalog } from '../catalog/CardRoleCatalog'

export class DeckImprovementAdvisor {
  generateSuggestions(
    breakdown: FailureReasonBreakdown[], 
    _logs: SimulationTrialLog[]
  ): DeckSwapSuggestion[] {
    const suggestions: DeckSwapSuggestion[] = []

    for (const failure of breakdown) {
        if (failure.type === 'NO_BENCH_SETUP' || failure.type === 'NO_BASIC') {
            suggestions.push({
                suggestionId: 'add-basics',
                targetMetric: 'seed',
                reason: 'たねポケモンの不足による事故が多発しています。ネストボールやたねポケモン本体を増強しましょう。',
                outCards: [{ cardName: '特定のサブアタッカー', count: 1 }],
                inCards: [{ cardName: 'ネストボール', count: 1 }],
                estimatedDelta: { seedRate: 0.05, setupRate: 0.08 },
                confidence: 0.8
            })
        }

        if (failure.type === 'NO_ENERGY') {
            suggestions.push({
                suggestionId: 'add-energy',
                targetMetric: 'energy',
                reason: 'エネルギーへのタッチが安定していません。基本エネルギーまたはサーチ札（大地の器等）の増量を推奨します。',
                outCards: [{ cardName: 'ピン挿しのグッズ', count: 1 }],
                inCards: [{ cardName: '基本エネルギー', count: 1 }],
                estimatedDelta: { energyRate: 0.12 },
                confidence: 0.9
            })
        }

        if (failure.type === 'NO_SUPPORTER') {
            suggestions.push({
                suggestionId: 'add-supporter',
                targetMetric: 'supporter',
                reason: '中盤を支えるドローサポートの不足が見られます。博士の研究やナンジャモの枚数を確認してください。',
                outCards: [{ cardName: '環境メタカード', count: 1 }],
                inCards: [{ cardName: '博士の研究', count: 1 }],
                estimatedDelta: { supporterRate: 0.1 },
                confidence: 0.75
            })
        }
    }

    return suggestions.slice(0, 2)
  }
}
