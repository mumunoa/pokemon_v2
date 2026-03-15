import { CanonicalGameState } from '../core/types';
import { CombinedFeatures } from '../features/types';
import { PHASE_WEIGHTS } from '../core/constants';

/**
 * 盤面評価関数 (Static Evaluation)
 * 特徴量をフェーズに応じた重みで掛け合わせ、現在の盤面の強さを数値化します。
 */
export function scoreState(state: CanonicalGameState, features: CombinedFeatures): number {
    const weights = PHASE_WEIGHTS[state.phase];
    
    // 1. 各領域のスコアリング
    const handScore = calculateHandScore(features.hand);
    const boardScore = calculateBoardScore(features.board);
    const deckScore = calculateDeckScore(features.deck);
    const prizeScore = calculatePrizeScore(features.prize);
    const oppBoardScore = calculateOpponentBoardScore(features.oppBoard);
    const prizeRaceScore = calculatePrizeRaceScore(features.prizeRace);
    const oppHandScore = calculateOpponentHandScore(features.oppHand);
    const oppDiscardScore = calculateOpponentDiscardScore(features.oppDiscard);

    // 2. 重み付き合計
    let totalScore = 0;
    totalScore += handScore * weights.hand;
    totalScore += boardScore * weights.board;
    totalScore += deckScore * weights.deck;
    totalScore += prizeScore * weights.prize;
    totalScore += oppBoardScore * weights.oppBoard;
    totalScore += prizeRaceScore * weights.prizeRace;
    totalScore += oppHandScore * weights.oppHand;
    totalScore += oppDiscardScore * weights.oppDiscard;

    // 3. 特殊補正 (リーサル、事故、先行後攻)
    totalScore += calculateAdjustments(state, features);

    return Math.round(totalScore);
}

/**
 * 領域別スコア：手札
 * リソースの質と柔軟性を評価
 */
function calculateHandScore(f: CombinedFeatures['hand']): number {
    let score = 0;
    score += f.playableBasics * 10;
    score += f.playableEvolutionPieces * 15;
    score += f.playableSearchCards * 20;
    score += f.playableDrawCards * 25;
    score += f.playableEnergyCount * 12;
    score += f.playableBossCards * 30;
    score += f.comboReadyScore * 50;
    score -= f.deadCardCount * 5;
    return score;
}

/**
 * 領域別スコア：自分盤面
 * アタッカー、システム、生存率を評価
 */
function calculateBoardScore(f: CombinedFeatures['board']): number {
    let score = 0;
    score += f.activeAttackReady * 100;
    score += f.benchAttackReadyCount * 60;
    score += f.backupAttackerCount * 40;
    score += f.drawEngineCount * 50;
    score += (f.pivotQuality * 30);
    score += (f.retreatSafety * 20);
    score -= f.benchLiabilityScore; // 負け筋が多いほど減点
    return score;
}

/**
 * 領域別スコア：山札
 * 圧縮度と有効札密度
 */
function calculateDeckScore(f: CombinedFeatures['deck']): number {
    let score = 0;
    score += f.thinnessScore * 40;
    score += f.liveOutDensity * 100;
    score -= f.deckOutRisk * 200; // LO負けのリスクは極めて重要
    return score;
}

/**
 * 領域別スコア：サイド（自分）
 */
function calculatePrizeScore(f: CombinedFeatures['prize']): number {
    let score = 0;
    score -= f.prizedKeyPiecePenalty * 50;
    score += f.comebackValue * 30;
    return score;
}

/**
 * 領域別スコア：相手盤面 (敵の不利を自分のプラスにする)
 */
function calculateOpponentBoardScore(f: CombinedFeatures['oppBoard']): number {
    let score = 0;
    score -= f.oppImmediateThreatScore * 1.5;
    score -= f.oppNextThreatScore * 1.0;
    score += f.oppBenchLiabilityScore * 0.8; // 相手の負け筋露出はチャンス
    score += f.gustTargetValueScore * 40;
    return score;
}

/**
 * 領域別スコア：サイドレース
 * 勝利までの最短手数
 */
function calculatePrizeRaceScore(f: CombinedFeatures['prizeRace']): number {
    let score = 0;
    score += f.raceAdvantage * 150; // 最重要。1攻撃差が150点相当
    score -= f.selfPrizesToWin * 20;
    return score;
}

/**
 * 領域別スコア：相手手札
 */
function calculateOpponentHandScore(f: CombinedFeatures['oppHand']): number {
    let score = 0;
    score -= f.oppHandCountPressure * 30;
    score += f.oppLikelyBrickScore * 40; // 事故っているならチャンス
    score += f.disruptionValueScore * 50;
    return score;
}

/**
 * 領域別スコア：相手トラッシュ
 */
function calculateOpponentDiscardScore(f: CombinedFeatures['oppDiscard']): number {
    let score = 0;
    score += f.oppOutsExhaustionScore * 60;
    score += f.resourceLockPotential * 80; // 縛り勝利の可能性があるなら加点
    return score;
}

/**
 * 特殊補正
 */
function calculateAdjustments(state: CanonicalGameState, features: CombinedFeatures): number {
    let adj = 0;
    
    // リーサル補正
    if (features.prizeRace.selfPrizesToWin === 0) adj += 10000;
    
    // 敗北確定補正
    if (features.prizeRace.oppPrizesToWin === 0) adj -= 10000;

    // 先行1ターン目の盤面形成ボーナス
    if (state.firstTurnForSelf && features.board.backupAttackerCount >= 1) {
        adj += 50;
    }

    return adj;
}
