'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAiCoach } from '@/hooks/useAiCoach';
import { InitialSimulationCard } from '../AI/InitialSimulationCard';
import { CoachPanel } from '../../ai-next';
import { useGameStore } from '@/features/practice/store/useGameStore';
import { useTicketUnlock } from '../../hooks/useTicketUnlock';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlement } from '@/hooks/useEntitlement';
import { buildBoardScore } from '@/features/practice/lib/boardScore';
import { buildBoardScoreReason } from '@/features/practice/lib/boardScoreReason';
import { buildBoardInsightShareSummary } from '@/features/practice/lib/boardInsightShare';
import { BoardInsightCard } from '../Coach/BoardInsightCard';
import { BoardInsightShareSheet } from '../Coach/BoardInsightShareSheet';
import type { BoardInsightUiState } from '@/types/board-insight';
import { CoachPhaseCard } from './coach-ui/CoachPhaseCard';
import { PreparationStrategyCard } from './coach-ui/PreparationStrategyCard';
import { WinPathSummaryCard } from './coach-ui/WinPathSummaryCard';
import { TurnStrategyCard } from './coach-ui/TurnStrategyCard';
import { RecommendedSequenceCard } from './coach-ui/RecommendedSequenceCard';
import { KeyActionCard } from './coach-ui/KeyActionCard';
import { AlternativeLinesCard } from './coach-ui/AlternativeLinesCard';
import { TurnTabs } from './coach-ui/TurnTabs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function isPreparationPhase(input: {
  coachResult: any;
  openingEvaluation: any;
  turn?: number;
  player1Deck?: any[];
}): boolean {
  if (input.coachResult?.recommendedSequence?.actions?.length) return false;
  if (input.turn && input.turn > 0) return false;
  if (input.openingEvaluation) return true;
  return !input.player1Deck || input.player1Deck.length === 0;
}

export const AiAnalysisDrawerNew: React.FC<Props> = ({ isOpen, onClose }) => {
  const player1Deck = useGameStore((state) => state.player1Deck);
  const player2Deck = useGameStore((state) => state.player2Deck);
  const logs = useGameStore((state) => state.logs);
  const stateVersion = useGameStore((state) => state.stateVersion);
  
  // 局面が変わる（logs.length または stateVersion が変わる）たびに解禁をリセット
  const stabilityUnlock = useTicketUnlock([player1Deck, stateVersion]);
  const proCoachUnlock = useTicketUnlock([player1Deck, player2Deck, logs.length, stateVersion]);
  
  const { isThinking, commentary, planType } = useAiCoach(proCoachUnlock.isUnlocked);
  const { runCoachAnalysis, coachResult, coachLoading, openingEvaluation } = useGameStore();
  const { refreshProfile } = useAuth();
  const entitlement = useEntitlement();
  const [isShareOpen, setIsShareOpen] = useState(false);

  const isProActual = planType === 'pro' || planType === 'elite';
  const isPro = isProActual || proCoachUnlock.isUnlocked;

  const currentTurn = coachResult?.currentTurn ?? 0;
  const preparationPhase = isPreparationPhase({
    coachResult,
    openingEvaluation,
    turn: currentTurn,
    player1Deck,
  });

  const boardInsight = useMemo(() => {
    if (!coachResult) return null;

    const openingMetrics = openingEvaluation
      ? {
          openingScore: openingEvaluation.seedRate?.rate,
          consistencyScore: openingEvaluation.setupRate?.rate,
          riskScore: openingEvaluation.failureBreakdown?.length > 0 ? 50 : 20,
        }
      : coachResult.openingMetrics;

    const breakdown = buildBoardScore({
      openingMetrics,
      coachResult,
      tacticalConfidence: coachResult.confidenceScore,
    });

    const reason = buildBoardScoreReason(breakdown);

    return {
      breakdown,
      reason,
      generatedAt: new Date().toISOString(),
    };
  }, [coachResult, openingEvaluation]);

  const uiState = useMemo(() => {
    let accessLevel: BoardInsightUiState['accessLevel'] = 'pre_analysis';

    if (boardInsight) {
      if (isProActual) {
        accessLevel = planType === 'elite' ? 'elite' : 'pro';
      } else if (proCoachUnlock.isUnlocked) {
        accessLevel = 'ticket_unlocked';
      } else {
        accessLevel = 'free_summary';
      }
    }

    return {
      status: (coachLoading ? 'running' : boardInsight ? 'ready' : 'idle') as 'running' | 'ready' | 'idle',
      accessLevel,
    };
  }, [boardInsight, coachLoading, isProActual, planType, proCoachUnlock.isUnlocked]);

  const shareSummary = useMemo(() => {
    if (!boardInsight) return null;
    return buildBoardInsightShareSummary({
      deckName: player1Deck?.[0]?.name ? `${player1Deck[0].name}デッキ` : '現在の盤面',
      boardInsight,
      bestAction: coachResult?.bestAction,
    });
  }, [boardInsight, player1Deck, coachResult]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-[10001] h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-slate-950/95 shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                AI Pro Coach
              </div>
              <h2 className="mt-1 text-xl font-bold text-white">
                AIプロコーチ
                {!isProActual && !proCoachUnlock.isUnlocked && (
                  <span className="ml-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">
                    FREE
                  </span>
                )}
                {proCoachUnlock.isUnlocked && !isProActual && (
                  <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                    UNLOCKED
                  </span>
                )}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                8レイヤー推論エンジン + 勝ち筋ライン評価
              </p>
            </div>
            <button
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
              onClick={onClose}
            >
              閉じる
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* 個別カードは CoachPanel 内に統合されたため非表示 */}
          {/*
          <CoachPhaseCard
            coachResult={coachResult}
            isPreparationPhase={preparationPhase}
            openingEvaluation={openingEvaluation}
            currentTurn={currentTurn}
          />

          <PreparationStrategyCard
            isPreparationPhase={preparationPhase}
            openingEvaluation={openingEvaluation}
            coachResult={coachResult}
            isPro={isPro}
          />

          <WinPathSummaryCard
            coachResult={coachResult}
            isPro={isPro}
          />

          <TurnStrategyCard
            coachResult={coachResult}
            isPro={isPro}
          />

          <RecommendedSequenceCard
            sequence={coachResult?.recommendedSequence}
            alternatives={coachResult?.sequenceAlternatives ?? []}
            isPro={isPro}
            isLoading={coachLoading}
          />

          <KeyActionCard
            bestAction={coachResult?.bestAction}
            isPro={isPro}
          />

          <AlternativeLinesCard
            title="その他の有力ライン"
            alternatives={coachResult?.sequenceAlternatives ?? coachResult?.alternatives ?? []}
            isPro={isPro}
          />

          <TurnTabs
            isPreparationPhase={preparationPhase}
            openingEvaluation={openingEvaluation}
            coachResult={coachResult}
            commentary={commentary}
            isPro={isPro}
          />
          */}

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-white">1 デッキ安定度（初動AI分析）</h3>
            <div className="mt-3">
              <InitialSimulationCard 
                planType={planType} 
                isUnlocked={stabilityUnlock.isUnlocked} 
                onUnlock={stabilityUnlock.handleUnlock} 
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-white">2 プロタクティカル分析</h3>
            <div className="mt-3">
              <CoachPanel
                result={coachResult}
                isLoading={coachLoading}
                onRun={async () => {
                  await runCoachAnalysis();
                  await refreshProfile();
                }}
                isProUser={isProActual}
                onUpgradeClick={() => {
                  window.location.href = '/billing';
                }}
                isUnlocked={proCoachUnlock.isUnlocked}
                onUnlock={proCoachUnlock.handleUnlock}
                openingEvaluation={openingEvaluation}
                isPreparationPhase={preparationPhase}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-white">3 おすすめの一手</h3>
            {isThinking && (
              <p className="mt-3 text-sm text-slate-300">Thinking...</p>
            )}

            {!commentary && !isThinking && (
              <p className="mt-3 text-sm text-slate-400">
                盤面に変化があると自動で分析を開始します。
              </p>
            )}

            {commentary && (
              <div className="mt-3 space-y-3">
                {(commentary.bestActions ?? []).map((action: any, idx: number) => (
                  <div key={`${action.title}-${idx}`} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                    <div className="text-sm font-semibold text-white">{action.title}</div>
                    <div className="mt-1 text-sm text-slate-300">{action.description}</div>

                    {isPro ? (
                      <div className="mt-3 grid gap-2">
                        {(action.pros ?? []).map((pro: string, pIdx: number) => (
                          <div key={pIdx} className="text-sm text-emerald-300">✅ {pro}</div>
                        ))}
                        {(action.cons ?? []).map((con: string, cIdx: number) => (
                          <div key={cIdx} className="text-sm text-amber-300">⚠️ {con}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
                        理由は Pro プランで公開中
                        <div className="mt-2 text-xs text-amber-100/80">
                          1チケット消費して解禁 / ※ 残り回数は毎日0時に回復します
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 有料プランへの誘導ボタン */}
          <div className="px-1">
            <Link
              href="/billing"
              className="flex items-center justify-between w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 transition-all shadow-lg group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <span className="text-xl">💎</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">Pro プランにアップグレード</div>
                  <div className="text-[10px] text-white/70 font-medium">1000回シミュ・全戦術を無制限に。</div>
                </div>
              </div>
              <div className="relative z-10 bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:translate-x-1 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </Link>
          </div>

          {/* 
          {boardInsight && (
            <BoardInsightCard
              boardInsight={boardInsight}
              uiState={uiState}
              onRun={async () => {
                await runCoachAnalysis();
              }}
              onUnlock={handleUnlock}
              onUpgrade={() => {
                window.location.href = '/billing';
              }}
              onOpenShare={() => setIsShareOpen(true)}
            />
          )}
          */}



          {/* プロ解禁ボタンは CoachPanel 側のオーバーレイに統合されたため非表示 */}
          {/*
          {!isPro && (
            <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
              <div className="text-sm font-semibold text-white">さらに深いプロ分析を使う</div>
              <p className="mt-2 text-sm text-slate-200">
                1000回シミュレーション構築改善、代替ライン比較、リスク込みの順序最適化まで解放されます。
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={handleUnlock}
                  className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110"
                >
                  1チケット消費して解禁
                </button>
                <Link
                  href="/billing"
                  className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  プランの詳細を確認
                </Link>
              </div>
            </div>
          )}
          */}
        </div>
      </aside>

      {shareSummary && (
        <BoardInsightShareSheet
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          summary={shareSummary}
          shareUrl={typeof window !== 'undefined' ? window.location.href : undefined}
        />
      )}
    </>
  );
};
