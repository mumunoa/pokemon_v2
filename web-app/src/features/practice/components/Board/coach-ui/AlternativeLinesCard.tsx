'use client';

import React from 'react';

type Props = {
  title: string;
  alternatives: any[];
  isPro: boolean;
};

export function AlternativeLinesCard({ title, alternatives, isPro }: Props) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 grid gap-3">
        {alternatives.slice(0, isPro ? 4 : 2).map((alt: any, idx: number) => (
          <div key={alt.id ?? idx} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white">
                {alt.line ?? alt.title ?? `候補 ${idx + 1}`}
              </div>
              {typeof alt.score === 'number' && (
                <div className="text-xs text-slate-400">{Math.round(alt.score)}</div>
              )}
            </div>
            {(alt.reasoning?.[0] || alt.description) && (
              <div className="mt-2 text-sm text-slate-300">
                {alt.reasoning?.[0] ?? alt.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
