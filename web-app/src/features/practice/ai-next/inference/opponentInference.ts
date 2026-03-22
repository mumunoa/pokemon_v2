import { BoardState, OpponentThreat } from '../domain/types';

/**
 * Infer the opponent's archetype from public information (active, bench, discard).
 */
export function inferOpponentArchetype(board: BoardState): string {
  const opponentCards = [
    ...(board.opponentActive ? [board.opponentActive.name] : []),
    ...board.opponentBench.map(p => p.name),
    ...board.opponentDiscard
  ];

  if (opponentCards.some(name => name.includes('リザードン'))) {
    return 'Charizard ex';
  }
  if (opponentCards.some(name => name.includes('ドラパルト'))) {
    return 'Dragapult ex';
  }
  if (opponentCards.some(name => name.includes('タケルライコ'))) {
    return 'Raging Bolt ex';
  }
  if (opponentCards.some(name => name.includes('サーナイト'))) {
    return 'Gardevoir ex';
  }
  if (opponentCards.some(name => name.includes('パオジアン'))) {
    return 'Chien-Pao ex';
  }
  if (opponentCards.some(name => name.includes('ルギア'))) {
    return 'Lugia VSTAR';
  }
  if (opponentCards.some(name => name.includes('レジドラゴ'))) {
    return 'Regidrago VSTAR';
  }

  return 'generic';
}

/**
 * Infer opponent's next turn threat (damage, lethal potential, and disruption value).
 */
export function inferOpponentThreat(board: BoardState, archetype: string): OpponentThreat {
  let expectedMaxDamage = 0;
  let requiredCards = 1;

  if (archetype === 'Charizard ex') {
    expectedMaxDamage = 180 + (board.prizesTakenByPlayer * 30);
    // 既にリザードンが見えているか
    const hasCharizard = (board.opponentActive?.name.includes('リザードン') || 
                          board.opponentBench.some(p => p.name.includes('リザードン')));
    requiredCards = hasCharizard ? 1 : 2; // ボスやふしぎなアメなど
  } else if (archetype === 'Dragapult ex') {
    expectedMaxDamage = 200; 
    requiredCards = 3; 
  } else if (archetype === 'Raging Bolt ex') {
    expectedMaxDamage = 280; 
    requiredCards = 2; 
  } else {
    expectedMaxDamage = 150; 
    requiredCards = 2;
  }

  // 現時点のアクティブのHPから、相手が突破可能かを判断
  const myActiveHp = board.active?.hp ?? 0;
  const lethalThreat = expectedMaxDamage >= myActiveHp && myActiveHp > 0;

  // 相手の要求値とリーサルの有無から、手札干渉（ナンジャモ・ツツジなど）の価値を算出
  let disruptValue = requiredCards * 15;
  if (lethalThreat) {
    disruptValue += 40; // リーサルを回避するための妨害価値を高く
  }

  return {
    expectedMaxDamage,
    requiredCards,
    lethalThreat,
    disruptValue,
  };
}
