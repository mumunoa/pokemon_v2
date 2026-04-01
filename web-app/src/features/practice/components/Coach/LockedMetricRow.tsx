'use client';

import React from 'react';

type Props = {
  label: string;
  value?: number;
  locked?: boolean;
};

export const LockedMetricRow: React.FC<Props> = ({ label, value, locked = false }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {locked ? (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            locked
          </span>
        ) : (
          <span className="text-sm font-black text-white">{value}</span>
        )}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${locked ? 'w-1/3 bg-slate-600 blur-[1px]' : 'bg-indigo-500'}`}
          style={locked ? undefined : { width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
        />
      </div>
    </div>
  );
};
