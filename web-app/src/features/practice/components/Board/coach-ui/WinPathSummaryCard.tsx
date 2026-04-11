'use client';

import React from 'react';

type Props = {
  coachResult: any;
  isPro: boolean;
};

export function WinPathSummaryCard({ coachResult, isPro }: Props) {
  const prizePlan = coachResult?.prizePlan;
  const macro = coachResult?.macroStrategy;

  if (!prizePlan && !macro) return null;

  return (
    <section className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
        勝利への道
      </div>
      <h3 className="mt-1 text-lg font-bold text-white">この対戦の主勝ち筋</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">主サイドプラン</div>
          <div className="mt-1 text-xl font-bold text-white">
            {prizePlan?.pattern?.join(' - ') ?? '-'}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">想定勝ちターン</div>
          <div className="mt-1 text-xl font-bold text-white">
            {macro?.estimatedTurnsToWin ?? prizePlan?.estimatedTurnsToFinish ?? '-'}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">相手の最速返し</div>
          <div className="mt-1 text-xl font-bold text-white">
            {macro?.opponentEstimatedTurnsToWin ?? '-'}
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-300">
        {macro?.description ?? 'このターンの行動は、サイドの取り切り方に沿って評価します。'}
      </div>

      {isPro && prizePlan?.targetSequence?.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">狙う対象順</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {prizePlan.targetSequence.map((step: any, idx: number) => (
              <span
                key={`${step.targetName}-${idx}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
              >
                {step.targetName} / {step.prizes}枚
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
