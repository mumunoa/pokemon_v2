'use client';

import React from 'react';

type Props = {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'warn' | 'strong';
};

const toneClassMap: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'bg-slate-800 text-slate-100 border-slate-700',
  good: 'bg-emerald-950/60 text-emerald-200 border-emerald-700/50',
  warn: 'bg-amber-950/60 text-amber-200 border-amber-700/50',
  strong: 'bg-indigo-950/60 text-indigo-200 border-indigo-700/50',
};

export const ScoreBadge: React.FC<Props> = ({ label, value, tone = 'neutral' }) => {
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClassMap[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-lg font-black leading-none">{value}</div>
    </div>
  );
};
