'use client';

import React from 'react';

type Props = {
  isPreparationPhase: boolean;
  openingEvaluation: any;
  coachResult: any;
  isPro: boolean;
};

function initialPlacementHint(openingEvaluation: any) {
  const failure = openingEvaluation?.failureBreakdown ?? [];
  if (failure.length === 0) return '初手は概ね良好です。バトル場とベンチの役割分担を意識してください。';
  return failure[0]?.label ?? '初手の置き方を慎重に確認してください。';
}

export function PreparationStrategyCard({ isPreparationPhase, openingEvaluation, coachResult, isPro }: Props) {
  if (!isPreparationPhase && !openingEvaluation) return null;

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
        Preparation
      </div>
      <h3 className="mt-1 text-lg font-bold text-white">対戦準備中の最適判断</h3>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">初手評価</div>
          <div className="mt-2 text-sm text-slate-200">
            {initialPlacementHint(openingEvaluation)}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">先攻/後攻の考え方</div>
          <div className="mt-2 text-sm text-slate-200">
            {coachResult?.goal?.type === 'setup'
              ? '先攻は盤面形成優先、後攻は最低限の打点成立ラインを確認します。'
              : '対戦開始直後は、まずサイドプランより事故回避と置き方を優先します。'}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 md:col-span-2">
          <div className="text-xs text-slate-400">準備段階での重要観点</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            <li>• バトル場に置くたねは、逃げコストと先攻/後攻の役割で決める</li>
            <li>• ベンチは出せるだけ出すのではなく、次ターンの勝ち筋に必要な枚数だけ出す</li>
            <li>• 2Prize を不用意に晒さない</li>
            {isPro && <li>• 初手から想定サイドプランを薄く持ち、必要な進化元を残す</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
