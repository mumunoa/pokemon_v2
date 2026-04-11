'use client';

import React from 'react';

type Props = {
  bestAction: any;
  isPro: boolean;
};

export function KeyActionCard({ bestAction, isPro }: Props) {
  if (!bestAction) return null;

  return (
    <section className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
        主要なアクション
      </div>
      <h3 className="mt-1 text-lg font-bold text-white">このターンの要所</h3>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <div className="text-sm font-semibold text-white">{bestAction.line ?? '候補がありません'}</div>
        <div className="mt-2 text-xs text-slate-400">
          このラインの中で最も重要な1手として表示しています。
        </div>
      </div>

      {bestAction?.reasons?.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="text-xs text-slate-400">{isPro ? 'プロの思考プロセス' : '主な理由'}</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-200">
            {bestAction.reasons.slice(0, isPro ? 6 : 1).map((reason: string, idx: number) => (
              <li key={idx}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
