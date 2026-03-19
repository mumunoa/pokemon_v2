import { BoardState } from '../domain/types';

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
