import type { CardRoleProfile } from "../domain/types";
import type { CoachCard, CoachBoardFeatures, CoachGameState, CoachPhase, EnergyType } from "./types";

function inferPhase(state: CoachGameState): CoachPhase {
  const totalTaken = (state.players.player1.prizesTaken ?? 0) + (state.players.player2.prizesTaken ?? 0);
  if (totalTaken <= 2) return "opening";
  if (totalTaken <= 7) return "midgame";
  return "endgame";
}

function hasRoleInHand(handProfiles: CardRoleProfile[], roles: string[]): boolean {
  return handProfiles.some((p) => p.staticRoles.some((r) => roles.includes(String(r))));
}

function calculateAttackReadiness(card: CoachCard | null): { ready: boolean; needed: number } {
  if (!card || !card.attacks || card.attacks.length === 0) return { ready: false, needed: 99 };
  const attached = card.attachedEnergyTypes || [];
  
  const results = card.attacks.map(attack => {
    const cost = attack.cost || [];
    if (cost.length === 0) return { ready: true, needed: 0 };
    
    let current = [...attached];
    let missing = 0;
    
    // 特定タイプのマッチング
    const specificCosts = cost.filter(c => c !== "colorless");
    const colorlessCount = cost.filter(c => c === "colorless").length;
    
    for (const c of specificCosts) {
      const idx = current.indexOf(c);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        missing++;
      }
    }
    
    // 無色コストのマッチング（残ったエネで賄う）
    const remaining = current.length;
    if (remaining < colorlessCount) {
      missing += (colorlessCount - remaining);
    }
    
    return { ready: missing === 0, needed: missing };
  });
  
  return results.sort((a, b) => a.needed - b.needed)[0];
}

export function extractBoardFeatures(state: CoachGameState, handProfiles: CardRoleProfile[]): CoachBoardFeatures {
  const me = state.players.player1;
  const opp = state.players.player2;
  const phase = inferPhase(state);

  const energyInfo = calculateAttackReadiness(me.active);
  const activeEnergyCount = me.active?.attachedEnergyIds?.length ?? 0;
  const activeCanAttack = energyInfo.ready;
  const activeRetreatCost = me.active?.retreat ?? 0;
  
  // 逃げ性能の評価
  const canRetreat = (activeEnergyCount >= activeRetreatCost) || activeRetreatCost === 0;
  const hasFreePivot = me.bench.some(p => p.retreat === 0);

  const ownBenchCount = me.bench.length;
  const oppBenchCount = opp.bench.length;
  const oppSystemCount = opp.bench.filter((p) =>
    ["ピジョット", "イキリンコ", "ロトム", "ビーダル", "キチキギス"].some((name) => p.name.includes(name)),
  ).length;
  const oppHeavyRetreatCount = opp.bench.filter((p) => (p.retreat ?? 0) >= 2).length;

  const hasDrawInHand = hasRoleInHand(handProfiles, ["draw", "hand_refresh", "topdeck_tutor"]);
  const hasSearchInHand = hasRoleInHand(handProfiles, ["basic_search", "pokemon_search", "evolution_search", "bench_setup"]);
  const hasBenchSetupInHand = hasRoleInHand(handProfiles, ["bench_setup", "basic_search"]);
  const hasGustInHand = hasRoleInHand(handProfiles, ["gust"]);
  const hasRecoveryInHand = hasRoleInHand(handProfiles, ["resource_recovery", "recovery", "energy_recovery"]);
  const ownTwoPrizeExposed = !!me.active && ((me.active.hp ?? 999) - (me.active.damage ?? 0) <= 240);

  const setupNeed =
    phase === "opening"
      ? ownBenchCount <= 1
        ? 85
        : ownBenchCount === 2
        ? 60
        : 30
      : !activeCanAttack
      ? 58
      : 18;

  const drawNeed = me.hand.length <= 3 ? 80 : me.hand.length <= 5 ? 52 : 22;
  const gustNeed =
    phase === "endgame" ? (hasGustInHand ? 55 : 72) : oppSystemCount > 0 ? 48 : 24;
  const tempoNeed = activeCanAttack ? 30 : 64;
  const recoveryNeed = (me.active?.damage ?? 0) >= 100 ? 54 : hasRecoveryInHand ? 18 : 8;
  const safetyNeed = ownTwoPrizeExposed ? 72 : 28;
  const followupNeed = phase === "opening" ? (ownBenchCount < 3 ? 60 : 30) : 20;

  return {
    phase,
    ownPrizesRemaining: 6 - me.prizesTaken,
    oppPrizesRemaining: 6 - opp.prizesTaken,
    ownBenchCount,
    oppBenchCount,
    activeCanAttack,
    activeEnergyCount,
    activeEnergyReady: energyInfo.ready,
    activeEnergyNeeded: energyInfo.needed,
    activeRetreatCost,
    canRetreat,
    hasFreePivot,
    hasDrawInHand,
    hasSearchInHand,
    hasBenchSetupInHand,
    hasGustInHand,
    hasRecoveryInHand,
    ownTwoPrizeExposed,
    oppSystemCount,
    oppHeavyRetreatCount,
    setupNeed,
    drawNeed,
    gustNeed,
    tempoNeed,
    recoveryNeed,
    safetyNeed,
    followupNeed,
  };
}
