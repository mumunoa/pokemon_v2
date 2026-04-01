'use client';

import React from 'react';
import type { BoardInsightMeta, BoardInsightUiState } from '@/types/board-insight';
import { LockedMetricRow } from './LockedMetricRow';

type Props = {
  uiState: BoardInsightUiState;
  boardInsight: BoardInsightMeta | null;
  onRun: () => void;
  onUnlock: () => void;
  onUpgrade: () => void;
  onOpenShare: () => void;
};

export const BoardInsightCard: React.FC<Props> = ({
  uiState,
  boardInsight,
  onRun,
  onUnlock,
  onUpgrade,
  onOpenShare,
}) => {
  if (uiState.status === 'idle' || !boardInsight) {
    return (
      <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">現在の盤面</div>
        <h3 className="mt-2 text-xl font-black text-white">未分析</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          この局面が有利か、何を優先すべきかをAIが評価します。無料では結論とヒントを表示し、詳細はチケットまたはProで解放します。
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <LockedMetricRow label="初動安定" locked />
          <LockedMetricRow label="展開力" locked />
          <LockedMetricRow label="勝ち筋接続" locked />
          <LockedMetricRow label="裏目警戒" locked />
        </div>
        <button onClick={onRun} className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500">
          盤面を分析する
        </button>
        <div className="mt-2 text-xs text-slate-500">無料で概要を表示 / 詳細はチケット・Proで解放</div>
      </section>
    );
  }

  const isDetailed = uiState.accessLevel === 'ticket_unlocked' || uiState.accessLevel === 'pro';

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">現在の盤面</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black text-white">{boardInsight.breakdown.boardGrade}</span>
            <span className="pb-1 text-sm font-semibold text-slate-300">/ {boardInsight.breakdown.boardScore}点</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{boardInsight.reason.summary}</p>
        </div>
        <button onClick={onOpenShare} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-slate-700">
          共有
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-700/30 bg-emerald-950/20 p-3 text-sm text-emerald-100">
        <div className="font-bold">無料で見える範囲</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {boardInsight.reason.freeHints.slice(0, 2).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <LockedMetricRow label="初動安定" value={boardInsight.breakdown.openingScore} />
        <LockedMetricRow label="再現性" value={boardInsight.breakdown.consistencyScore} locked={!isDetailed} />
        <LockedMetricRow label="展開力" value={boardInsight.breakdown.tempoScore} locked={!isDetailed} />
        <LockedMetricRow label="勝ち筋接続" value={boardInsight.breakdown.convertScore} locked={!isDetailed} />
        <LockedMetricRow label="タクティカル" value={boardInsight.breakdown.tacticalScore} locked={!isDetailed} />
        <LockedMetricRow label="裏目警戒" value={100 - boardInsight.breakdown.riskScore} locked={!isDetailed} />
      </div>

      {isDetailed ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">強み</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
              {boardInsight.reason.strengths.length > 0 ? boardInsight.reason.strengths.map((item) => <li key={item}>{item}</li>) : <li>該当なし</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">弱み</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
              {boardInsight.reason.weaknesses.length > 0 ? boardInsight.reason.weaknesses.map((item) => <li key={item}>{item}</li>) : <li>該当なし</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">次アクション</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
              {boardInsight.reason.nextActions.length > 0 ? boardInsight.reason.nextActions.map((item) => <li key={item}>{item}</li>) : <li>該当なし</li>}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/30 p-4">
          <div className="text-sm font-bold text-amber-200">詳細はロック中</div>
          <p className="mt-1 text-sm text-amber-100">
            展開力・勝ち筋接続・裏目警戒・推奨アクションは、チケット消費またはProで解放します。
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button onClick={onUnlock} className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-400">
              チケットで詳細を見る
            </button>
            <button onClick={onUpgrade} className="flex-1 rounded-xl border border-indigo-500/40 bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-500">
              Proで常時解放
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
