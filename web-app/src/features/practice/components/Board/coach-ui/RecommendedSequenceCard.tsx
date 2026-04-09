'use client';

import React from 'react';

type Sequence = {
  id: string;
  score: number;
  line: string;
  actions: any[];
  reasoning: string[];
  transitionSummaries: string[];
};

type Props = {
  sequence?: Sequence;
  alternatives?: Sequence[];
  isPro: boolean;
  isLoading?: boolean;
};

function actionLabel(action: any): string {
  switch (action?.kind) {
    case 'bench_pokemon':
      return `${action.cardName} をベンチへ`;
    case 'evolve':
      return `${action.targetName} → ${action.cardName} へ進化`;
    case 'attach_energy':
      return `${action.targetName} に ${action.cardName} を手貼り`;
    case 'use_ability':
      return `${action.sourceName} の特性`;
    case 'play_supporter':
    case 'play_item':
    case 'play_stadium':
      return action.cardName;
    case 'play_tool':
      return `${action.targetName} に ${action.cardName}`;
    case 'retreat':
      return `${action.fromName} → ${action.toName}`;
    case 'attack':
      return `${action.attackName}`;
    default:
      return action?.cardName ?? action?.sourceName ?? '行動';
  }
}

export function RecommendedSequenceCard({ sequence, alternatives = [], isPro, isLoading }: Props) {
  return (
    <section className="rounded-2xl border border-indigo-400/20 bg-indigo-400/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
        Recommended Sequence
      </div>
      <h3 className="mt-1 text-lg font-bold text-white">このターンの推奨行動順</h3>

      {isLoading && (
        <p className="mt-3 text-sm text-slate-300">ライン評価中...</p>
      )}

      {!sequence && !isLoading && (
        <p className="mt-3 text-sm text-slate-400">
          まだターン全体の推奨順は生成されていません。
        </p>
      )}

      {sequence && (
        <>
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">採用ライン</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                SCORE {Math.round(sequence.score)}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-300">{sequence.line}</div>
          </div>

          <div className="mt-4 space-y-3">
            {(sequence.actions ?? []).map((action: any, idx: number) => (
              <div key={`${action.kind}-${idx}`} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{actionLabel(action)}</div>
                    <div className="text-xs text-slate-400">{action.kind}</div>
                  </div>
                </div>
                {sequence.transitionSummaries?.[idx] && (
                  <div className="mt-2 text-sm text-slate-300">
                    {sequence.transitionSummaries[idx]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="text-xs text-slate-400">この順番を採る理由</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {(sequence.reasoning ?? []).slice(0, isPro ? 6 : 3).map((reason: string, idx: number) => (
                <li key={idx}>• {reason}</li>
              ))}
            </ul>
          </div>

          {alternatives.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-400">次点ライン</div>
              <div className="mt-2 grid gap-2">
                {alternatives.slice(0, 2).map((alt) => (
                  <div key={alt.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span>{alt.line}</span>
                      <span className="text-xs text-slate-400">{Math.round(alt.score)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
