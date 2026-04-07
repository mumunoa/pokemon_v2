import { createRoleProfile } from "@/features/practice/ai-next/inference/sectionRoleInference";
import { getSectionTexts } from "@/features/practice/ai-next/utils/text";
import { buildProfessionalCoachResult } from "@/features/practice/ai-next/pro-coach/recommendationEngine";
import type { CardRoleProfile } from "@/features/practice/ai-next/domain/types";
import { GameState, ZoneType } from "@/types/game";
import { CoachCard } from "../ai-next/pro-coach/types";

export function buildProfilesFromCurrentState(state: GameState): CardRoleProfile[] {
  const cards = Object.values(state.cards ?? {});
  return cards.map((card: any) => createRoleProfile(card, getSectionTexts(card)));
}

export function toCoachGameStateFromStore(state: GameState) {
  const getZoneCards = (zone: ZoneType) => (state.zones[zone] || []).map(id => state.cards[id]).filter(Boolean);

  const normalizeCard = (card: any): CoachCard | null => {
    if (!card) return null;
    
    // 付着しているエネルギーの実体を引いて、タイプを特定
    const attachedEnergyIds = Array.isArray(card.attachedEnergyIds) ? card.attachedEnergyIds : [];
    const attachedEnergyTypes = attachedEnergyIds
      .map((id: string) => state.cards[id])
      .filter(Boolean)
      .map((c: any) => (c.kinds || c.energyType || "colorless") as any);

    return {
      id: String(card.instanceId ?? card.id ?? card.cardId ?? card.baseCardId ?? card.name),
      baseCardId: card.baseCardId ?? card.cardId,
      name: card.name,
      type: card.type,
      kinds: card.kinds,
      hp: Number(card.hp ?? 0) || null,
      damage: Number(card.damage ?? 0) || 0,
      retreat: Number(card.retreatCost ?? card.retreat ?? 0) || null,
      attachedEnergyIds,
      attachedEnergyTypes,
      canAttack: !!card.canAttack,
      attacks: (card.attacks || []).map((a: any) => ({
        ...a,
        cost: Array.isArray(a.cost) ? a.cost : []
      })),
      ability: card.ability ?? [],
      tags: card.tags ?? [],
    };
  };

  const p1Active = getZoneCards('player1-active')[0];
  const p1Bench = [
    ...getZoneCards('player1-bench-1'),
    ...getZoneCards('player1-bench-2'),
    ...getZoneCards('player1-bench-3'),
    ...getZoneCards('player1-bench-4'),
    ...getZoneCards('player1-bench-5'),
  ];
  const p1Hand = getZoneCards('player1-hand');
  const p1Discard = getZoneCards('player1-trash');

  const p2Active = getZoneCards('player2-active')[0];
  const p2Bench = [
    ...getZoneCards('player2-bench-1'),
    ...getZoneCards('player2-bench-2'),
    ...getZoneCards('player2-bench-3'),
    ...getZoneCards('player2-bench-4'),
    ...getZoneCards('player2-bench-5'),
  ];
  const p2Hand = getZoneCards('player2-hand');
  const p2Discard = getZoneCards('player2-trash');

  return {
    turn: state.turnCount ?? 1,
    currentTurnPlayer: state.currentTurnPlayer ?? "player1",
    firstPlayer: "player1" as const,
    selectedArchetype: "generic",
    players: {
      player1: {
        active: normalizeCard(p1Active),
        bench: p1Bench.map(normalizeCard).filter((c): c is CoachCard => !!c),
        hand: p1Hand.map(normalizeCard).filter((c): c is CoachCard => !!c),
        discard: p1Discard.map(normalizeCard).filter((c): c is CoachCard => !!c),
        prizesTaken: 6 - state.zones['player2-prizes'].length,
        supporterUsed: !!state.turnFlags?.player1?.supporterUsed,
        energyAttachedThisTurn: !!state.turnFlags?.player1?.energyAttachedThisTurn,
      },
      player2: {
        active: normalizeCard(p2Active),
        bench: p2Bench.map(normalizeCard).filter((c): c is CoachCard => !!c),
        hand: p2Hand.map(normalizeCard).filter((c): c is CoachCard => !!c),
        discard: p2Discard.map(normalizeCard).filter((c): c is CoachCard => !!c),
        prizesTaken: 6 - state.zones['player1-prizes'].length,
        supporterUsed: !!state.turnFlags?.player2?.supporterUsed,
        energyAttachedThisTurn: !!state.turnFlags?.player2?.energyAttachedThisTurn,
      },
    },
    cards: state.cards ?? {},
  };
}


export async function runProfessionalCoachAnalysis(state: GameState) {
  const profiles = buildProfilesFromCurrentState(state);
  const coachState = toCoachGameStateFromStore(state);

  const deckForOpeningSimulation = Object.values(state.cards ?? {}).map((card: any) => ({
    id: card.instanceId ?? card.id ?? card.cardId ?? card.baseCardId ?? card.name,
    cardId: card.baseCardId ?? card.cardId ?? card.id ?? card.name,
    name: card.name,
    type: card.type,
    kinds: card.kinds,
  }));

  // 1. ローカルエンジンによる基礎分析 (候補手生成など)
  const baseResult = buildProfessionalCoachResult({
    state: coachState,
    profiles,
    deckForOpeningSimulation,
  });

  // 2. AI (Claude) による深層分析の実行
  try {
    const handNames = coachState.players.player1.hand.map(c => c.name);
    // types.ts で拡張した CoachBoardFeatures に合わせてデータを抽出
    const features = {
        ...baseResult, // 既存の phase や prizes 情報など
        ownHandNames: handNames,
        ownBenchNames: coachState.players.player1.bench.map(c => c.name),
        ownTrashNames: coachState.players.player1.discard.map(c => c.name),
        oppActiveName: coachState.players.player2.active?.name,
        oppBenchNames: coachState.players.player2.bench.map(c => c.name),
        totalEnergiesInPlay: (coachState.players.player1.active?.attachedEnergyIds?.length ?? 0) + 
                          coachState.players.player1.bench.reduce((acc, p) => acc + (p.attachedEnergyIds?.length ?? 0), 0)
    };

    const response = await fetch('/api/ai/pro-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        features,
        candidates: baseResult.alternatives.map(a => ({
            actionType: a.action.kind,
            cardName: a.cardName,
            description: a.line
        })),
        plan_type: 'pro' // TODO: ユーザープランに応じて切り替え
      })
    });

    if (response.ok) {
      const aiInsight = await response.json();
      
      // AI の構造化データをマージ
      return {
        ...baseResult,
        macroStrategy: aiInsight.macroStrategy || baseResult.macroStrategy,
        opponentThreat: aiInsight.opponentThreat || baseResult.opponentThreat,
        keyCards: aiInsight.keyCards || baseResult.keyCards,
        analysis: aiInsight.analysis || baseResult.analysis,
        simulationInsight: aiInsight.simulationInsight,
        aiEnriched: true
      };
    }
  } catch (error) {
    console.error('AI Strategy Enrichment Failed:', error);
  }

  // API 失敗時はローカルの基礎分析結果を返す
  return baseResult;
}
