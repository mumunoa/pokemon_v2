'use client';

import React from 'react';

type Props = {
  coachResult: any;
  isPro: boolean;
};

export function TurnStrategyCard({ coachResult, isPro }: Props) {
  const goal = coachResult?.goal;
  const risk = coachResult?.risk;
  const threat = coachResult?.opponentThreat;

  if (!goal && !risk && !threat) return null;

  return (
    <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
        ターン戦略
      </div>
      <h3 className="mt-1 text-lg font-bold text-white">このターンの戦略</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 md:col-span-2">
          <div className="text-xs text-slate-400">戦略タイプ</div>
          <div className="mt-1 text-xl font-bold text-white">{goal?.type ?? '-'}</div>
          <div className="mt-2 text-sm text-slate-300">
            {goal?.primaryReason ?? 'このターンの役割を分析中です。'}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">総合リスク</div>
          <div className="mt-1 text-xl font-bold text-white">
            {typeof risk?.totalRiskScore === 'number' ? `${risk.totalRiskScore}/100` : '-'}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">返し警戒</div>
          <div className="mt-2 text-sm text-slate-200">
            相手の最大打点目安: {typeof threat?.expectedMaxDamage === 'number' ? `${threat.expectedMaxDamage}` : '-'}
            {threat?.lethalThreat ? ' / 次ターン敗北リスクあり' : ' / 即死圏は薄め'}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">このターンで通したいこと</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(goal?.requiredOutcome ?? []).slice(0, isPro ? 6 : 3).map((item: string) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
