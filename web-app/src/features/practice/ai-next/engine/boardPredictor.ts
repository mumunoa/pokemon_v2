import { BoardState, ActionCandidate } from '../domain/types';

/**
 * Predict the board state after an action is taken.
 * (Lightweight version of applyAction for ai-next domain)
 */
export function predictBoardState(board: BoardState, action: ActionCandidate): BoardState {
  const next = { ...board, bench: [...board.bench], hand: [...board.hand] };

  if (action.tags.includes('bench_setup')) {
    // 仮想的にベンチが増えたとみなす
    next.bench.push({
      cardId: 'predicted-' + Math.random(),
      name: action.target || '新ポケモン',
      damage: 0,
      hp: 100,
      retreat: 1,
      energies: 0,
      isSystem: false,
      canAttack: false
    });
  }

  if (action.tags.includes('draw')) {
    // 仮想的に手札が増えたとみなす（枚数はタグ等から推測。簡易的に2枚とする）
    for (let i = 0; i < 2; i++) next.hand.push('predicted-card');
  }

  if (action.tags.includes('energy')) {
    if (next.active) {
      next.active = { ...next.active, energies: next.active.energies + 1 };
    }
  }

  return next;
}
