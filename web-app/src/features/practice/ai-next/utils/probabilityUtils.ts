/**
 * 山札から指定したカードを引く確率を計算する関数群
 * プロプレイヤーが頭の中で行っている「確率論」のシミュレーション
 */

/**
 * 階乗を計算する（簡易版）
 */
function fact(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * 組み合わせ (nCr)
 */
function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  // nCr をオーバーフローしないように計算
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

/**
 * 山札から特定のカードを引く確率（ハイパー幾何分布）
 * @param deckRemaining 今の山札の残り枚数
 * @param targetCount 欲しいカードが山札に何枚残っているか（見えていない枚数）
 * @param drawCount 今回引く枚数（例：博士の研究なら 7）
 * @returns 少なくとも1枚引ける確率 (0.0 ~ 1.0)
 */
export function calculateDrawProbability(
  deckRemaining: number,
  targetCount: number,
  drawCount: number
): number {
  if (deckRemaining <= 0 || drawCount <= 0 || targetCount <= 0) return 0.0;
  if (drawCount >= deckRemaining) return 1.0;
  if (targetCount >= deckRemaining) return 1.0;

  // 1枚も引けない確率 = (山にある対象外のカードから drawCount 枚引く組み合わせ) / (山から drawCount 枚引く組み合わせ)
  const nonTargets = deckRemaining - targetCount;
  if (nonTargets < drawCount) {
     return 1.0; // 引けない確率が0になるケース
  }

  const probNone = combinations(nonTargets, drawCount) / combinations(deckRemaining, drawCount);
  return 1.0 - probNone;
}

/**
 * 山札圧縮の価値を評価する
 * 不要なカードを山から引っこ抜くこと（ネストボール等）で、メインのドローソースを打つ前に
 * どれだけ確率が上昇したか（期待値）を返す
 */
export function evaluateDeckCompressionValue(
  deckRemaining: number,
  targetCount: number,
  cardsToRemove: number,
  subsequentDraws: number
): number {
  if (deckRemaining <= cardsToRemove) return 0;
  
  const probBefore = calculateDrawProbability(deckRemaining, targetCount, subsequentDraws);
  const probAfter = calculateDrawProbability(deckRemaining - cardsToRemove, targetCount, subsequentDraws);
  
  // 確率の上昇分（パーセンテージポイント）を返す
  return Math.max(0, probAfter - probBefore);
}
