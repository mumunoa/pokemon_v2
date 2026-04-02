'use client';

import React from 'react';
import type { RecommendationResult, ScoredAction, KeyCard, OpponentThreat, MacroStrategy } from '../domain/types';
import type { RecommendationWithSimulation, CoachingImprovementSuggestion, SimulationMetric } from '../engine/simulationCoachingTypes';

interface CoachPanelProps {
  result: RecommendationResult | RecommendationWithSimulation | null;
  isLoading: boolean;
  onRun?: () => void;
  isProUser?: boolean;
  onUpgradeClick?: () => void;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

export function CoachPanel({ 
  result, 
  isLoading, 
  onRun, 
  isProUser = false, 
  onUpgradeClick,
  isUnlocked = false,
  onUnlock 
}: CoachPanelProps) {
  const isUnlockedPro = isProUser || isUnlocked;
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <div className="text-sm font-medium text-white/80">プロプレイヤーが思考を展開中...</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 text-white shadow-xl backdrop-blur-md text-center relative overflow-hidden">
        {/* 全ユーザーに対して「実装準備中」のスモーク効果を適用 */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-20">
          <div className="px-4 py-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-xs font-black text-emerald-300 shadow-xl">
            実装準備中
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 opacity-20 pointer-events-none">
          {/* 
          <div>
            <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-xl font-black text-transparent text-shadow-sm">
              Premium Coach AI
            </div>
            <div className="mt-2 text-xs text-white/60 leading-relaxed max-w-[280px]">
              トッププロの思考プロセスを完全トレースし、<br />
              勝率を最大化する「次の一手」とその根拠を解説します。
            </div>
          </div>
          {onRun ? (
            <button
              onClick={onRun}
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-emerald-500/25 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
              プレミアムコーチ分析
            </button>
          ) : null}
          */}
          <div className="text-xl font-black opacity-40">Ai Coach Analysis</div>
        </div>
      </div>
    );
  }

  const baseResult = 'baseRecommendation' in result ? result.baseRecommendation : result;
  const simCoaching = 'simulationCoaching' in result ? result.simulationCoaching : null;
  
  const { bestAction, alternatives, keyCards, boardStateSummary, opponentThreat, macroStrategy } = baseResult;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0a0f16] to-[#040608] p-6 text-white shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-2xl font-black tracking-tight text-transparent">
            AIプロコーチ分析
            {isUnlockedPro && (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                {isProUser ? 'PRO' : 'UNLOCKED'}
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/50">{boardStateSummary}</p>
        </div>
      </div>

      <div className="space-y-6 relative">
        {/* === FREE 版は「結論のみ」が見える（それ以下はロック） === */}
        {/* Phase 3 (Free/Pro共通): Micro Optimization & Probability */}
        <ThoughtPhase 
          number="★" 
          title="今ターンの最適解 (推奨アクション)" 
          color="emerald"
        >
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="text-lg font-bold text-white">{bestAction?.line ?? '候補がありません'}</div>
            
            {bestAction && bestAction.reasons.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-emerald-200/50">{isUnlockedPro ? 'プロの思考プロセス:' : '主な理由:'}</div>
                <ul className="space-y-1.5 list-none">
                  {bestAction.reasons.slice(0, isUnlockedPro ? undefined : 1).map((reason, idx) => (
                    <li key={idx} className="flex flex-col">
                      <span className="flex items-start text-sm text-emerald-100">
                        <span className="mr-2 mt-1 block h-1 w-1 shrink-0 rounded-full bg-emerald-400"></span>
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ThoughtPhase>

        {/* FREE 版プロンプトオーバーレイ (ここから下はProのみクリア表示) */}
        {!isUnlockedPro && (
          <div className="absolute left-0 right-0 top-32 z-20 flex h-full flex-col items-center justify-start rounded-b-2xl bg-gradient-to-b from-transparent via-[#080d12]/95 to-[#040608] pt-16 backdrop-blur-[2px]">
            <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-amber-500/20 bg-black/60 p-6 text-center shadow-2xl backdrop-blur-md">
              <div className="mb-2 text-3xl">🔒</div>
              <div className="mb-2 text-lg font-bold text-white">プロ思考プロセスを解禁する</div>
              <div className="mb-4 text-[10px] leading-relaxed text-white/70">
                1000回シミュレーション構築改善、大局観・要求値レイヤーのインサイト、代替候補とその致命的リスクなどのPro限定機能を体験してください。
              </div>
              <button 
                onClick={onUnlock}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:scale-105"
              >
                チケットを消費して見る
              </button>
              <button 
                onClick={onUpgradeClick}
                className="mt-3 text-[10px] text-white/50 hover:text-white underline"
              >
                プランをアップグレード
              </button>
            </div>
          </div>
        )}
        
        {/* ========================================================= */}
        
        {/* Phase 1: Macro Strategy (Pro) */}
        <div className={!isUnlockedPro ? 'opacity-20 pointer-events-none select-none blur-sm' : ''}>
          {macroStrategy && (
            <ThoughtPhase 
              number="1" 
              title="環境認識と大局観 (Macro Strategy)" 
              color="indigo"
            >
              <div className="text-sm leading-relaxed text-indigo-100">
                <span className="mb-2 block font-semibold text-indigo-300">
                  目標ルート: {formatPlanName(macroStrategy.activePlan)}
                </span>
                {macroStrategy.description}
              </div>
            </ThoughtPhase>
          )}

        {/* Phase 2: Opponent Threat & Risk Management */}
        {opponentThreat && (
          <ThoughtPhase 
            number="2" 
            title="リスク管理と相手の要求値 (Threat Assessment)" 
            color={opponentThreat.lethalThreat ? 'rose' : 'amber'}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-lg bg-black/40 p-3">
                <div className="text-xs text-white/50">相手の次ターン最大打点予測</div>
                <div className={`text-xl font-bold ${opponentThreat.lethalThreat ? 'text-rose-400' : 'text-amber-400'}`}>
                  {opponentThreat.expectedMaxDamage} <span className="text-sm font-normal text-white/50">ダメージ</span>
                </div>
              </div>
              <div className="flex-1 rounded-lg bg-black/40 p-3">
                <div className="text-xs text-white/50">要求手札のハードル</div>
                <div className="text-xl font-bold text-emerald-400">
                  約 {opponentThreat.requiredCards} <span className="text-sm font-normal text-white/50">枚要求</span>
                </div>
              </div>
            </div>
            {opponentThreat.lethalThreat && (
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-500">!</span>
                次ターンに敗北の可能性があります。手札干渉や壁役の展開（ケア）を最優先してください。
              </div>
            )}
          </ThoughtPhase>
        )}

        </div>

        {/* 新セクション: 1000回シミュ構築改善 (Pro) */}
        <div className={!isUnlockedPro ? 'opacity-10 pointer-events-none select-none blur-md mt-6' : 'mt-6'}>
          {simCoaching && (
            <ThoughtPhase 
              number="⚙️" 
              title="構築連動インサイト (1000-Sim Analysis)" 
              color="emerald"
            >
              <div className="space-y-4">
                <div className="text-sm font-medium text-white/90">
                  {simCoaching.headline}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {simCoaching.metrics.map((m: SimulationMetric) => (
                    <div key={m.key} className="rounded border border-white/10 bg-black/40 p-2 text-center">
                      <div className="text-[10px] text-white/50">{m.label}</div>
                      <div className={`text-lg font-bold ${m.bucket === 'green' ? 'text-emerald-400' : m.bucket === 'yellow' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {m.value}%
                      </div>
                    </div>
                  ))}
                </div>
                {simCoaching.suggestions.length > 0 && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="mb-2 text-xs font-bold text-emerald-400">プロ推薦カード（最適化案）</div>
                    <div className="text-sm text-white/80">
                      {simCoaching.suggestions[0].action}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {simCoaching.suggestions[0].candidateCardNames.map(c => (
                          <span key={c} className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ThoughtPhase>
          )}
        </div>
      </div>

      <div className={`mt-8 grid gap-4 lg:grid-cols-2 ${!isUnlockedPro ? 'opacity-10 pointer-events-none select-none blur-md' : ''}`}>
        <div className="rounded-xl bg-white/5 p-4">
          <div className="mb-3 text-sm font-bold text-white/70">代替のプレイング（リスク許容ルート）</div>
          <div className="space-y-3">
            {alternatives.slice(0, 3).map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-4">
          <div className="mb-3 text-sm font-bold text-white/70">プレイングを支えるキーカード</div>
          <div className="space-y-3">
            {keyCards
              .filter((card, index, self) => 
                index === self.findIndex((t) => (
                  t.cardName === card.cardName || (t.cardId && t.cardId === card.cardId)
                ))
              )
              .slice(0, 3)
              .map((card) => (
                <KeyCardRow key={card.cardId || card.cardName} card={card} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThoughtPhase({ number, title, color, children }: { number: string; title: string; color: 'indigo' | 'amber' | 'rose' | 'emerald'; children: React.ReactNode }) {
  const colorMap = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  };
  
  const iconColorMap = {
    indigo: 'bg-indigo-500 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-500 text-white',
    emerald: 'bg-emerald-500 text-white',
  };

  return (
    <div className={`relative rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${iconColorMap[color]}`}>
          {number}
        </div>
        <h3 className="font-bold text-white/90">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function formatPlanName(plan: string): string {
  switch (plan) {
    case '2-2-2_route': return '2-2-2 ルート (最速ビートダウン)';
    case '2-1-2-1_route': return '2-1-2-1 ルート (システム干渉メイン)';
    case '1-2-2-1_route': return '1-2-2-1 ルート (非ルール・コントロール)';
    case 'control_lo': return 'LO/コントロール盤面形成';
    case 'survival_stall': return '耐久・ストール戦略';
    default: return plan;
  }
}

function ActionRow({ action }: { action: ScoredAction }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-3 transition-colors hover:border-white/10">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{action.cardName}</div>
        <div className="text-[10px] font-black tracking-wider text-white/30">{Math.round(action.score)} SCORE</div>
      </div>
      <div className="text-xs text-white/70">{action.line}</div>
    </div>
  );
}

function KeyCardRow({ card }: { card: KeyCard }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/40 p-3 transition-colors hover:border-white/10">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{card.cardName}</div>
      </div>
      <div className="text-[11px] text-white/60">{card.reason}</div>
    </div>
  );
}
