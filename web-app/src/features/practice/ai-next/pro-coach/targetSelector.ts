import { CoachGameState, CoachCard } from "./types";
import { CardRoleProfile } from "../domain/types";

/**
 * プロコーチ用ターゲット選択ロジック
 */

type TargetCandidate = { targetId: string; targetName: string };
type CoachContext = { state: CoachGameState; profiles: CardRoleProfile[] };

// 内部用：引数が Context か State かを判定して正規化する
function normalizeContext(input: CoachContext | CoachGameState): CoachGameState {
  if ("state" in input) return (input as CoachContext).state;
  return input as CoachGameState;
}

// 攻撃対象（通常は相手のバトル場）
export function selectAttackTargets(ctx: CoachContext | CoachGameState, source: CoachCard): TargetCandidate[] {
  const state = normalizeContext(ctx);
  const oppActive = state.players.player2.active;
  if (!oppActive) return [];
  return [{ targetId: oppActive.id, targetName: oppActive.name }];
}

// 相手を呼び出す（ボスの指令など）
export function selectGustTargets(ctx: CoachContext | CoachGameState, source?: CoachCard): TargetCandidate[] {
  const state = normalizeContext(ctx);
  return state.players.player2.bench.map(c => ({
    targetId: c.id,
    targetName: c.name
  }));
}

// エネルギーを貼る対象
export function selectEnergyTargets(ctx: CoachContext | CoachGameState, energyType?: string): TargetCandidate[] {
  const state = normalizeContext(ctx);
  const candidates: TargetCandidate[] = [];
  if (state.players.player1.active) {
    candidates.push({ 
      targetId: state.players.player1.active.id, 
      targetName: state.players.player1.active.name 
    });
  }
  state.players.player1.bench.forEach(c => {
    candidates.push({ targetId: c.id, targetName: c.name });
  });
  return candidates;
}

// 進化対象の選定
export function selectEvolutionTargets(ctx: CoachContext | CoachGameState, evoCard: CoachCard): TargetCandidate[] {
  const state = normalizeContext(ctx);
  const evolvesFrom = (evoCard as any).evolvesFrom || "";
  const candidates: TargetCandidate[] = [];

  const check = (c: CoachCard | null) => {
    if (c && (c.name === evolvesFrom || (evolvesFrom === "" && c.type === "pokemon"))) {
      candidates.push({ targetId: c.id, targetName: c.name });
    }
  };

  check(state.players.player1.active);
  state.players.player1.bench.forEach(check);
  
  return candidates;
}

// トラッシュからの回収対象
export function selectRecoveryTargets(ctx: CoachContext | CoachGameState, recoveryCard?: CoachCard): TargetCandidate[] {
  const state = normalizeContext(ctx);
  return state.players.player1.discard.map(c => ({
    targetId: c.id,
    targetName: c.name
  }));
}

// ベンチ配置スコアリング（簡易実装）
export function selectBenchTargets(ctx: CoachContext | CoachGameState, card: CoachCard): Array<{ targetId: string; score: number }> {
  // 型エラー回避のためのプレースホルダー
  return [{ targetId: "bench", score: 0 }];
}

// 互換性のための汎用関数
export function selectTargets(ctx: any, action: any): any {
  const state = normalizeContext(ctx);
  if (action?.kind === 'attack') return state.players.player2.active;
  return null;
}
