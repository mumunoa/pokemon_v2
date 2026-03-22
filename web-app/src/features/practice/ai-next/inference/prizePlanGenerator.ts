import { BoardState, MacroStrategy, WinConditionPlan } from '../domain/types';

/**
 * プロプレイヤーの大局観（サイド落ちやターン数の逆算）をシミュレートするジェネレーター
 */
export function generateMacroStrategy(board: BoardState, archetype: string): MacroStrategy {
  const myRemainingPrizes = 6 - board.prizesTakenByPlayer;
  const oppRemainingPrizes = 6 - board.prizesTakenByOpponent;

  // 雑な初期ヒューリスティックによる必要ターン数の計算（1ターンに2枚取れる前提）
  // 実際には手札や盤面のエネ状況から精緻に計算する
  let estimatedTurnsToWin = Math.ceil(myRemainingPrizes / 2);
  let opponentEstimatedTurnsToWin = Math.ceil(oppRemainingPrizes / 2);

  // もし自分が先に動いていて、相手の方がターン数が短い、あるいは同じなら妨害が必要
  let activePlan: WinConditionPlan = '2-2-2_route';
  let description = '相手のポケモンex/Vを3回倒して最速でサイドを取り切るルートです。';

  if (opponentEstimatedTurnsToWin <= estimatedTurnsToWin) {
    if (board.active?.hp && board.active.hp > 300) {
      activePlan = 'survival_stall';
      description = '相手の進行が早いため、高耐久ポケモンを壁にして相手の要求値を上げ、息切れを狙うルートです。';
    } else {
      // 妨害が必要
      activePlan = '1-2-2-1_route';
      description = '相手のペースが早いです。小ツキや非ルールのポケモンを挟んでサイドレースをずらしつつ、手札干渉で相手の要求値を上げるルートを取ります。';
    }
  } else if (myRemainingPrizes === 6 && oppRemainingPrizes === 6) {
    activePlan = '2-2-2_route';
    description = '序盤の標準的なプランです。最速でシステムポケモンやアタッカーを育て、相手のexやVポケモンを3回倒す「2-2-2」ルートを目指します。';
  }

  // もしアーキタイプがLO（カビゴンLOなど）なら固定ルート
  if (archetype === 'Snorlax Stall' || archetype === 'Pidgeot Control') {
    activePlan = 'control_lo';
    description = '相手の山札切れ（LO）または投了を狙うコントロールルートです。相手のアタッカーをバトル場に縛ることを最優先します。';
    estimatedTurnsToWin = 15; // 擬似的に長くする
  }

  return {
    activePlan,
    estimatedTurnsToWin,
    opponentEstimatedTurnsToWin,
    description
  };
}
