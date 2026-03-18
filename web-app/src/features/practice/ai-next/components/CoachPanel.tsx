'use client';

import React from 'react';
import type { RecommendationResult, ScoredAction, KeyCard } from '../domain/types';

interface CoachPanelProps {
  result: RecommendationResult | null;
  isLoading: boolean;
  onRun?: () => void;
}

export function CoachPanel({ result, isLoading, onRun }: CoachPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
        <div className="text-sm text-white/70">プロコーチが盤面を分析しています...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">プロコーチ AI</div>
            <div className="mt-1 text-sm text-white/70">
              role / primitive / 盤面緊急度から、おすすめの一手を比較します。
            </div>
          </div>
          {onRun ? (
            <button
              onClick={onRun}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              分析する
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const { bestAction, alternatives, keyCards, analysis, boardStateSummary } = result;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">プロコーチ分析</h3>
          <p className="mt-1 text-sm text-white/60">{boardStateSummary}</p>
        </div>
        {onRun ? (
          <button
            onClick={onRun}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80"
          >
            再分析
          </button>
        ) : null}
      </div>

      <div className="mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
          Best recommendation
        </div>
        <div className="text-base font-semibold">{bestAction?.line ?? '候補なし'}</div>
        <div className="mt-2 text-sm text-white/80">{analysis}</div>
        {bestAction ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {bestAction.dynamicRoles.map((role) => (
              <span key={role} className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
                {role}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-3">
          <div className="mb-2 text-sm font-semibold">他の有力ライン</div>
          <div className="space-y-2">
            {alternatives.length === 0 ? (
              <div className="text-sm text-white/50">代替候補はまだありません。</div>
            ) : (
              alternatives.map((action) => <ActionRow key={action.id} action={action} />)
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 p-3">
          <div className="mb-2 text-sm font-semibold">今重要なキーカード</div>
          <div className="space-y-2">
            {keyCards.length === 0 ? (
              <div className="text-sm text-white/50">まだキーカードを抽出できていません。</div>
            ) : (
              keyCards.map((card) => <KeyCardRow key={card.cardName} card={card} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ action }: { action: ScoredAction }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="font-medium">{action.cardName}</div>
        <div className="text-xs text-white/50">{Math.round(action.score)} SCORE</div>
      </div>
      <div className="text-sm text-white/80">{action.line}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {action.dynamicRoles.map((role) => (
          <span key={role} className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/70">
            {role}
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs text-white/60">{action.reasons.join(' / ')}</div>
    </div>
  );
}

function KeyCardRow({ card }: { card: KeyCard }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="font-medium">{card.cardName}</div>
        <div className="text-xs text-white/50">{Math.round(card.score)} pts</div>
      </div>
      <div className="text-xs text-white/70">{card.reason}</div>
    </div>
  );
}
