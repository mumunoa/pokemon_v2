import { CoachBoardFeatures, CoachGameState, OpponentThreatInfo } from "../types";

/**
 * 相手 (player2) の盤面を精査し、次ターンの脅威と要求札を算出する
 */
export function evaluateOpponentThreat(
  features: CoachBoardFeatures, 
  state: CoachGameState
): OpponentThreatInfo {
  const opponent = state.players.player2;
  const oppActive = opponent.active;
  const oppBench = opponent.bench.filter(Boolean);
  const allOppPokemon = [oppActive, ...oppBench].filter(Boolean);

  let maxDamage = 0;
  let minRequiredCards = 99;
  let lethalThreat = false;

  // 1. 各ポケモンの技と必要エネを走査
  for (const pokemon of allOppPokemon) {
    if (!pokemon || !pokemon.attacks) continue;

    for (const attack of pokemon.attacks) {
      const damage = typeof attack.damage === 'number' ? attack.damage : parseInt(attack.damage || "0");
      // attachedEnergyIds からエネルギー数を取得
      const energyCount = pokemon.attachedEnergyIds?.length || 0;
      const energyCost = attack.cost?.length || 0;

      // 現時点での打点 (エネが足りている場合)
      if (energyCount >= energyCost) {
        if (damage > maxDamage) maxDamage = damage;
      } else {
        // エネが足りない場合、何枚必要か (手貼り1回で足りるか等)
        const diff = energyCost - energyCount;
        if (diff < minRequiredCards) minRequiredCards = diff;
      }
    }
  }

  // ポケモンがいない場合のデフォルト
  if (allOppPokemon.length === 0) {
    minRequiredCards = 0;
  } else if (minRequiredCards === 99) {
    minRequiredCards = 1; // 不明な場合は1枚要求とする
  }

  // 2. リーサル判定 (自分のバトル場のHPを上回るか)
  const ownActive = state.players.player1.active;
  if (ownActive && ownActive.hp && maxDamage >= ownActive.hp) {
    lethalThreat = true;
  }

  return {
    expectedMaxDamage: maxDamage,
    requiredCards: minRequiredCards,
    lethalThreat,
    disruptValue: features.gustNeed > 50 ? 20 : 5,
    probableHiddenCards: [] // 将来的にトラッシュから推測可能
  };
}
