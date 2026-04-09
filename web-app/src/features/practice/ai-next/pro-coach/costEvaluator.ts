import { EnergyType } from "./types";

/**
 * プロコーチ用コスト評価ロジック
 */

type CostCheckInput = {
  attackCost: EnergyType[];
  attachedEnergies: EnergyType[];
};

export function canPayAttackCost(input: CostCheckInput): { ready: boolean; needed: number } {
  const { attackCost, attachedEnergies } = input;
  if (!attackCost || attackCost.length === 0) return { ready: true, needed: 0 };
  if (!attachedEnergies) return { ready: false, needed: attackCost.length };

  const attackCounts: Record<string, number> = {};
  attackCost.forEach(type => {
    attackCounts[type] = (attackCounts[type] || 0) + 1;
  });

  const attachedCounts: Record<string, number> = {};
  attachedEnergies.forEach(type => {
    attachedCounts[type] = (attachedCounts[type] || 0) + 1;
  });

  let colorShortage = 0;
  let totalColorMatched = 0;

  // 無色以外の判定
  Object.keys(attackCounts).forEach(type => {
    if (type === "colorless") return;
    const required = attackCounts[type];
    const present = attachedCounts[type] || 0;
    if (present < required) {
      colorShortage += required - present;
    }
    totalColorMatched += Math.min(required, present);
  });

  if (colorShortage > 0) {
    return { ready: false, needed: colorShortage };
  }

  // 無色コストの判定
  const requiredColorless = attackCounts["colorless"] || 0;
  const remainingEnergies = attachedEnergies.length - totalColorMatched;

  if (remainingEnergies < requiredColorless) {
    return { ready: false, needed: requiredColorless - remainingEnergies };
  }

  return { ready: true, needed: 0 };
}

// 汎用判定（アイテム等）
export function canPayCost(state: any, action: any): boolean {
  if (!action.cost) return true;
  return true; // 簡易
}
