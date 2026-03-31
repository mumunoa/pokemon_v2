'use client';

import React from 'react';
import type { ShareScoreSummary } from '@/types/monetization';
import { ScoreBadge } from './ScoreBadge';

type Props = {
  summary: ShareScoreSummary;
  onOpenShare: () => void;
};

export const ShareResultPanel: React.FC<Props> = ({ summary, onOpenShare }) => {
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Shareable Result</div>
          <h3 className="mt-1 text-xl font-black text-white">{summary.deckName}</h3>
          <p className="mt-1 text-sm text-slate-300">
            最善手: {summary.bestAction ?? '候補整理中'}
          </p>
        </div>
        <button
          onClick={onOpenShare}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
        >
          共有する
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <ScoreBadge label="Tier" value={summary.overallTier} tone="strong" />
        <ScoreBadge label="Score" value={`${summary.overallScore}`} tone="good" />
        <ScoreBadge label="初動" value={`${Math.round(summary.setupRate)}%`} tone="good" />
        <ScoreBadge label="事故" value={`${Math.round(summary.accidentRate)}%`} tone="warn" />
      </div>

      {summary.caution ? (
        <div className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/30 p-3 text-sm text-amber-100">
          注意点: {summary.caution}
        </div>
      ) : null}
    </section>
  );
};
