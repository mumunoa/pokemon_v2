'use client';

import React, { useMemo, useState } from 'react';

type Props = {
  isPreparationPhase: boolean;
  openingEvaluation: any;
  coachResult: any;
  commentary: any;
  isPro: boolean;
};

type TabKey = 'preparation' | 'thisTurn' | 'nextTurn' | 'midPlan';

export function TurnTabs({ isPreparationPhase, openingEvaluation, coachResult, commentary, isPro }: Props) {
  const [tab, setTab] = useState<TabKey>('thisTurn');

  const tabs = useMemo(
    () => [
      { key: 'preparation' as const, label: '準備' },
      { key: 'thisTurn' as const, label: '今ターン' },
      { key: 'nextTurn' as const, label: '次ターン' },
      { key: 'midPlan' as const, label: '中期プラン' },
    ],
    [],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-white">ターン別タブ</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={[
              'rounded-full px-3 py-2 text-sm transition',
              tab === item.key
                ? 'bg-white text-slate-950'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
        {tab === 'preparation' && (
          <div className="space-y-2">
            <div className="font-semibold text-white">準備フェーズの視点</div>
            <div>{isPreparationPhase ? '今は対戦準備中です。初手・置き方・先攻後攻別の方針を優先します。' : 'すでに盤面形成後ですが、準備段階のズレは今ターンの負け筋に直結します。'}</div>
            <div>初動成立率: {openingEvaluation?.setupRate?.rate ?? '-'}%</div>
            <div>たね確保率: {openingEvaluation?.seedRate?.rate ?? '-'}%</div>
          </div>
        )}

        {tab === 'thisTurn' && (
          <div className="space-y-2">
            <div className="font-semibold text-white">今ターンの評価</div>
            <div>役割: {coachResult?.goal?.type ?? '-'}</div>
            <div>{coachResult?.goal?.primaryReason ?? 'このターンの役割を分析中です。'}</div>
            <div>最重要ライン: {coachResult?.recommendedSequence?.line ?? coachResult?.bestAction?.line ?? '未生成'}</div>
          </div>
        )}

        {tab === 'nextTurn' && (
          <div className="space-y-2">
            <div className="font-semibold text-white">次ターンに残したい状態</div>
            <div>継続率: {coachResult?.probability?.nextTurnContinuityRate ?? '-'}%</div>
            <div>次ターンの要求を下げるため、後続アタッカーとドロー線を残すのが基本です。</div>
            {isPro && <div>相手の返し最大値: {coachResult?.opponentThreat?.expectedMaxDamage ?? '-'} 点</div>}
          </div>
        )}

        {tab === 'midPlan' && (
          <div className="space-y-2">
            <div className="font-semibold text-white">中期プラン</div>
            <div>主サイドプラン: {coachResult?.prizePlan?.pattern?.join(' - ') ?? '-'}</div>
            <div>{coachResult?.macroStrategy?.description ?? 'このターンの行動は中期の勝ち筋に沿って評価されます。'}</div>
            {commentary?.alternatives?.length > 0 && (
              <div>代替候補: {commentary.alternatives.length} 件</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
