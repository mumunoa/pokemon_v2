import type { BoardState, BoardCardLite } from "../domain/types";
import type { CoachGameState, CoachCard, CoachPlayerState } from "./types";

/**
 * 標準版の BoardCardLite をプロ版の CoachCard に変換する
 */
function toCoachCard(lite: BoardCardLite | null): CoachCard | null {
  if (!lite) return null;
  return {
    id: lite.cardId,
    baseCardId: lite.cardId,
    name: lite.name,
    hp: lite.hp,
    damage: lite.damage,
    retreat: lite.retreat,
    attachedEnergyIds: Array(lite.energies || 0).fill("generic-energy"), // 簡易化: 個別IDは持たせない
    canAttack: lite.canAttack,
    // 技データは本来のDBから引く必要があるが、一旦liteに最低限の構造を持たせる想定
    attacks: [] 
  };
}

/**
 * 標準版の BoardState をプロ版の CoachGameState に変換する
 */
export function toCoachGameState(board: BoardState): CoachGameState {
  const player1: CoachPlayerState = {
    active: toCoachCard(board.active),
    bench: board.bench.map(toCoachCard).filter(Boolean) as CoachCard[],
    hand: board.hand.map(name => ({ id: name, name })), // 簡易版手札
    discard: board.discard.map(name => ({ id: name, name })),
    prizesTaken: board.prizesTakenByPlayer,
    supporterUsed: !board.availableSupporter,
    energyAttachedThisTurn: !board.availableEnergyAttachment
  };

  const player2: CoachPlayerState = {
    active: toCoachCard(board.active === null ? board.opponentActive : board.opponentActive), // 相手
    bench: board.opponentBench.map(toCoachCard).filter(Boolean) as CoachCard[],
    hand: [], // 相手の手札は基本不明
    discard: board.opponentDiscard.map(name => ({ id: name, name })),
    prizesTaken: board.prizesTakenByOpponent,
    supporterUsed: false,
    energyAttachedThisTurn: false
  };

  return {
    turn: board.turn,
    currentTurnPlayer: "player1",
    players: {
      player1,
      player2
    }
  };
}
