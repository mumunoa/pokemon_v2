
'use client';

import React from 'react';
import type { RecommendationResult, ScoredAction, KeyCard } from '../domain/types';

/**
 * Professional AI Coach Analysis Panel.
 */

interface CoachPanelProps {
  result: RecommendationResult | null;
  isLoading: boolean;
}

export function CoachPanel({ result, isLoading }: CoachPanelProps) {
  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col items-center justify-center space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center backdrop-blur-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
        <p className="text-sm font-medium text-emerald-600/70">プロコーチが盤面を分析しています...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl border border-dashed border-slate-200 p-12 text-center transition-all hover:border-emerald-300">
        <div className="rounded-full bg-slate-50 p-4 text-slate-300">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">プロコーチ AI</p>
          <p className="text-xs text-slate-500">
            あなたの盤面を秒速で分析し、<br />
            勝率を最大化する一手を提案します。
          </p>
        </div>
      </div>
    );
  }

  const { bestAction, alternatives, keyCards, analysis, boardStateSummary } = result;

  return (
    <div className="space-y-6 overflow-hidden rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">プロコーチ分析</h3>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{boardStateSummary}</p>
          </div>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200">
          PRO ENGINE V2
        </div>
      </div>

      {/* Main Analysis Text */}
      <div className="relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-100">
        <div className="max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
          {analysis}
        </div>
      </div>

      {/* Key Actions */}
      <div className="space-y-3">
        <p className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-400">
          <span className="mr-2">期待の一手</span>
          <span className="h-px flex-1 bg-slate-100"></span>
        </p>
        <div className="space-y-2">
            {bestAction && (
                <ActionRow action={bestAction} isBest />
            )}
            {alternatives.map((action, idx) => (
                <ActionRow key={idx} action={action} />
            ))}
        </div>
      </div>

      {/* Key Cards Section */}
      <div className="space-y-3 pt-2">
        <p className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-400">
          <span className="mr-2">今重要なキーカード</span>
          <span className="h-px flex-1 bg-slate-100"></span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {keyCards.map((card, idx) => (
            <div key={idx} className="flex flex-col rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-emerald-200">
               <span className="text-[10px] font-bold text-emerald-600/80">IMPORTANT</span>
               <span className="truncate text-xs font-bold text-slate-800">{card.cardName}</span>
               <span className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500">{card.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionRow({ action, isBest = false }: { action: ScoredAction; isBest?: boolean }) {
    return (
        <div className={`
            group flex items-start space-x-3 rounded-2xl p-4 transition-all
            ${isBest 
                ? 'bg-gradient-to-r from-emerald-50 to-white ring-1 ring-emerald-200 shadow-sm' 
                : 'bg-white hover:bg-slate-50 ring-1 ring-slate-100'}
        `}>
            <div className={`
                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-xs
                ${isBest ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}
            `}>
                {isBest ? 'BEST' : 'ALT'}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                    <span className="truncate text-xs font-bold text-slate-900 group-hover:text-emerald-700">{action.cardName}</span>
                    <div className="flex space-x-1">
                        {action.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-slate-400">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <p className="truncate text-[11px] text-slate-600">{action.line}</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
                <span className={`text-xs font-black ${isBest ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {Math.round(action.score)}
                </span>
                <span className="text-[8px] font-bold uppercase text-slate-400">SCORE</span>
            </div>
        </div>
    );
}
