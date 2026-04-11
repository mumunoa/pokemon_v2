'use client';

import React from 'react';

type Props = {
  coachResult: any;
  openingEvaluation: any;
  currentTurn?: number;
  isPreparationPhase: boolean;
};

function phaseLabel(coachResult: any, currentTurn?: number, isPreparationPhase?: boolean) {
  if (isPreparationPhase) return '対戦準備中';
  if (currentTurn === 1) return '1ターン目';
  const phase = coachResult?.phase;
  if (phase === 'opening') return '序盤';
  if (phase === 'midgame') return '中盤';
  if (phase === 'endgame') return '終盤';
  return '局面分析中';
}

export function CoachPhaseCard({ coachResult, openingEvaluation, currentTurn, isPreparationPhase }: Props) {
  const label = phaseLabel(coachResult, currentTurn, isPreparationPhase);
  const setupRate = openingEvaluation?.setupRate?.rate;
  const seedRate = openingEvaluation?.seedRate?.rate;

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            現在のフェーズ
          </div>
          <h3 className="mt-1 text-lg font-bold text-white">{label}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
          {coachResult?.goal?.type ?? 'preparation'}
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-300">
        {isPreparationPhase
          ? '初手・置き方・先攻後攻の方針を優先して確認するフェーズです。'
          : coachResult?.boardStateSummary ?? '現在の盤面に対するフェーズ推定です。'}
      </div>

      {(typeof setupRate === 'number' || typeof seedRate === 'number') && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="text-xs text-slate-400">初動成立率</div>
            <div className="mt-1 text-xl font-bold text-white">{typeof setupRate === 'number' ? `${setupRate}%` : '-'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="text-xs text-slate-400">たね確保率</div>
            <div className="mt-1 text-xl font-bold text-white">{typeof seedRate === 'number' ? `${seedRate}%` : '-'}</div>
          </div>
        </div>
      )}
    </section>
  );
}
