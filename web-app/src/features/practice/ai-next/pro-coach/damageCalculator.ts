/**
 * プロコーチ用ダメージ計算ロジック
 */

type DamageInput = {
  attacker: any;
  defender: any;
  attackName: string;
};

type DamageResult = {
  expectedDamage: number;
  knockout: boolean;
  expectedPrizes: number;
};

export function calculateExpectedAttackResult(input: DamageInput): DamageResult {
  const { attacker, defender, attackName } = input;
  if (!attacker || !defender) return { expectedDamage: 0, knockout: false, expectedPrizes: 0 };

  // 技の検索
  const attack = attacker.attacks.find((a: any) => a.name === attackName) || attacker.attacks[0];
  if (!attack) return { expectedDamage: 0, knockout: false, expectedPrizes: 0 };

  // 基本ダメージの抽出 (数字以外が含まれる場合は簡易パース)
  let baseDamage = 0;
  if (typeof attack.damage === 'number') {
    baseDamage = attack.damage;
  } else if (typeof attack.damage === 'string') {
    baseDamage = parseInt(attack.damage.replace(/[^0-9]/g, ''), 10) || 0;
  }

  // 弱点・抵抗力の簡易計算 (将来的に属性マッチングを追加可能)
  let expectedDamage = baseDamage;

  // きぜつ判定
  const currentDamage = defender.damage || 0;
  const remainingHp = (defender.hp || 0) - currentDamage;
  const knockout = expectedDamage >= remainingHp;

  // 取得サイド数の判定 (ルールを持つポケモンの場合は 2)
  let expectedPrizes = 1;
  const rules = defender.rules || [];
  if (rules.some((r: any) => r.text && (r.text.includes("2枚") || r.text.includes("2 prizes") || r.text.includes("exルール")))) {
    expectedPrizes = 2;
  }

  return {
    expectedDamage,
    knockout,
    expectedPrizes: knockout ? expectedPrizes : 0
  };
}

// 互換性エイリアス
export const calculateDamage = (action: any, target: any) => {
  return calculateExpectedAttackResult({ attacker: action.source, defender: target, attackName: action.attackName }).expectedDamage;
};
