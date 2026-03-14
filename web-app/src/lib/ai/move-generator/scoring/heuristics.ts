import { AIInput, CandidateMove } from '@/types/ai';

/**
 * 盤面評価関数 (Board Evaluation)
 * 現在の盤面状況を数値化（Positive: 自分有利, Negative: 相手有利）
 */
function evaluateBoard(input: AIInput): number {
    const self = input.self;
    const opponent = input.opponent;
    let score = 0;

    // 1. サイド枚数の評価 (重み: 100)
    score += (6 - self.prizeCount) * 100;
    score -= (6 - opponent.prizeCount) * 100;

    // 2. 場のアタッカーの育ち具合 (重み: 10)
    const selfEnergy = [self.active, ...self.bench].reduce((sum, p) => sum + (p?.attachedEnergyIds.length || 0), 0);
    const oppEnergy = [opponent.active, ...opponent.bench].reduce((sum, p) => sum + (p?.attachedEnergyIds.length || 0), 0);
    score += selfEnergy * 10;
    score -= oppEnergy * 10;

    // 3. システムポケモンの生存 (ベンチ数)
    score += self.bench.length * 5;

    // 4. 手札のリソース量
    score += self.hand.length * 2;

    return score;
}

/**
 * 各候補手にスコアを付与します。
 * Layer 2+: プロ視点ヒューリスティック + 盤面評価
 */
export function scoreMoves(input: AIInput, moves: CandidateMove[]): CandidateMove[] {
    const turn = input.turn;
    const self = input.self;
    const opponent = input.opponent;
    const boardScore = evaluateBoard(input);

    // ゲームフェーズの判定
    const isEarlyGame = turn <= 3;
    const isLateGame = self.prizeCount <= 2 || opponent.prizeCount <= 2;

    return moves.map(move => {
        let score = 0;

        // --- 各アクションの基礎加点 ---

        // 1. 攻撃 (ATTACK)
        // ユーザー要望: 他にできることがあるなら最優先にはしない（番が終わるため）
        if (move.type === 'ATTACK') {
            score += 10; 
            if (opponent.active && opponent.active.damage > 50) { 
                score += 15;
                move.reasons = ['他の準備を終えた後、サイド奪取のため攻撃を推奨'];
            }
        }

        // 2. エネルギー添付 (ATTACH_ENERGY)
        else if (move.type === 'ATTACH_ENERGY') {
            score += 40; // 攻撃より優先
            if (move.targetCardInstanceId === self.active?.instanceId) {
                score += isEarlyGame ? 25 : 15;
            }
        }

        // 3. 進化 (EVOLVE)
        else if (move.type === 'EVOLVE') {
            score += 45; // 盤面形成を優先
        }

        // 4. ベンチ展開 (PLAY_TO_BENCH)
        else if (move.type === 'PLAY_TO_BENCH') {
            if (isEarlyGame) {
                score += 60; // 序盤は最優先
                if (self.bench.length === 0) score += 40;
            } else {
                score += 20;
            }
        }

        // 5. サポート (PLAY_SUPPORTER)
        else if (move.type === 'PLAY_SUPPORTER') {
            score += 50; // 基本的に攻撃より先に打ちたい
            if (self.hand.length <= 3) score += 30;
        }

        // --- プロ視点の公開情報による補正 (Step 2: Trash Scanning) ---
        
        // 相手がボスの指令を使い切っている(4枚)場合、ベンチのHPの低いポケモンを出すリスクが減る
        if (opponent.resourcesConsumed.bossOrders >= 4 && move.type === 'PLAY_TO_BENCH') {
            score += 10;
            move.reasons = move.reasons ? [...move.reasons, '相手のボスが尽きているため安全に展開可能'] : ['生存リスク低下による展開'];
        }

        // --- 盤面評価値による補正 ---
        // 自分が盤面評価で負けている（boardScore < 0）場合、リサーチや展開アクションをさらに強化
        if (boardScore < 0) {
            if (move.type === 'PLAY_SUPPORTER' || move.type === 'PLAY_TO_BENCH') {
                score += 20;
            }
        }

        return { ...move, score };
    });
}
