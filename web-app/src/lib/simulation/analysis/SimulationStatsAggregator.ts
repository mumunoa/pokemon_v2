import { 
  SimulationTrialLog, 
  InitialSimulationSummary, 
  SimulationMetricBreakdown,
  FailureReasonBreakdown,
  FailureReasonType,
  BoardPatternExample
} from '@/types/simulation'
import { SetupTargetConfig, DeckArchetype } from '@/types/deck-analysis'

export class SimulationStatsAggregator {
  aggregate(
    logs: SimulationTrialLog[], 
    archetype: DeckArchetype, 
    setupConfig: SetupTargetConfig,
    perspective: 'first' | 'second'
  ): InitialSimulationSummary {
    const totalTrials = logs.length
    
    const seedRate = this.calcMetric(logs, l => l.mulliganCount === 0)
    const setupRate = this.calcMetric(logs, l => l.setupSuccess)
    const supporterRate = this.calcMetric(logs, l => l.reachedSupporter)
    const energyRate = this.calcMetric(logs, l => l.reachedEnergy)

    const avgMulligan = logs.reduce((sum, l) => sum + l.mulliganCount, 0) / totalTrials

    const failureBreakdown = this.calcFailureBreakdown(logs)
    const { bestBoardExamples, failedBoardExamples } = this.collectExamples(logs)

    const headline = this.generateHeadline(setupRate.rate, archetype)
    const summaryLines = this.generateSummaryLines(seedRate.rate, setupRate.rate, supporterRate.rate, energyRate.rate)

    return {
      totalTrials,
      archetype,
      setupConfig,
      perspective,
      seedRate,
      setupRate,
      supporterRate,
      energyRate,
      averageMulliganCount: avgMulligan,
      failureBreakdown,
      bestBoardExamples,
      failedBoardExamples,
      suggestions: [], // Advisorで生成
      interpretation: {
        headline,
        summaryLines,
        improvementPriority: this.calcPriority(failureBreakdown)
      },
      freeSummary: {
        headline,
        shortReason: failureBreakdown[0]?.type || 'UNKNOWN',
        warnings: this.generateWarnings(failureBreakdown)
      }
    }
  }

  private calcMetric(logs: SimulationTrialLog[], predicate: (l: SimulationTrialLog) => boolean): SimulationMetricBreakdown {
    const successCount = logs.filter(predicate).length
    return {
      successCount,
      failCount: logs.length - successCount,
      rate: Number((successCount / logs.length).toFixed(3))
    }
  }

  private calcFailureBreakdown(logs: SimulationTrialLog[]): FailureReasonBreakdown[] {
    const counts: Record<string, number> = {}
    logs.forEach(l => {
        l.failureReasons.forEach(r => {
            counts[r] = (counts[r] || 0) + 1
        })
    })

    return Object.entries(counts)
        .map(([type, count]) => ({
            type: type as FailureReasonType,
            count,
            rate: Number((count / logs.length).toFixed(3))
        }))
        .sort((a, b) => b.count - a.count)
  }

  private collectExamples(logs: SimulationTrialLog[]) {
      const best = logs.filter(l => l.setupSuccess).slice(0, 3).map(l => ({
          label: '成功パターン',
          count: 1,
          rate: 0,
          snapshot: l.turn2,
          tags: ['SUCCESS']
      }))

      const failed = logs.filter(l => !l.setupSuccess).slice(0, 3).map(l => ({
          label: '事故パターン',
          count: 1,
          rate: 0,
          snapshot: l.turn2,
          tags: ['FAIL']
      }))

      return { bestBoardExamples: best as BoardPatternExample[], failedBoardExamples: failed as BoardPatternExample[] }
  }

  private generateHeadline(rate: number, _archetype: string): string {
      if (rate > 0.85) return '【抜群の安定感】理想的な初動が期待できます'
      if (rate > 0.7) return '【標準的な安定感】十分に戦える構築です'
      if (rate > 0.5) return '【注意が必要】事故率がやや高めです'
      return '【要改善】初動の再現性が著しく低いです'
  }

  private generateSummaryLines(seed: number, setup: number, sup: number, ene: number): string[] {
      return [
          `たねポケモンでのスタート率は ${(seed * 100).toFixed(1)}% です。`,
          `2ターン目までに理想の盤面を作れる確率は ${(setup * 100).toFixed(1)}% です。`,
          `サポートへのアクセス率は ${(sup * 100).toFixed(1)}% 、エネルギー供給率は ${(ene * 100).toFixed(1)}% となっています。`
      ]
  }

  private calcPriority(breakdown: FailureReasonBreakdown[]): string[] {
      return breakdown.slice(0, 2).map(b => `${b.type}の改善が最優先です`)
  }

  private generateWarnings(breakdown: FailureReasonBreakdown[]): string[] {
      return breakdown.filter(b => b.rate > 0.2).map(b => `${b.type}による事故が多発しています`)
  }
}
