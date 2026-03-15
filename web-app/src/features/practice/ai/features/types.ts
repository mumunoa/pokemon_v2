/**
 * 手札の特徴量 - HandFeatures
 */
export interface HandFeatures {
    playableBasics: number;
    playableEvolutionPieces: number;
    playableSearchCards: number;
    playableDrawCards: number;
    playableSwitchCards: number;
    playableRecoveryCards: number;
    playableDisruptionCards: number;
    playableBossCards: number;
    playableEnergyCount: number;
    deadCardCount: number;
    comboReadyScore: number;     // 0.0 - 1.0
    handFlexibilityScore: number; // 0.0 - 1.0
    immediateAttackAccess: number; // 0 or 1
    nextTurnAttackAccess: number;  // 0 or 1
}

/**
 * 自分盤面の特徴量 - BoardFeatures
 */
export interface BoardFeatures {
    activeAttackReady: number;      // 0 or 1
    benchAttackReadyCount: number;
    backupAttackerCount: number;
    drawEngineCount: number;
    searchEngineCount: number;
    pivotQuality: number;           // 0.0 - 1.0
    retreatSafety: number;          // 0.0 - 1.0
    benchLiabilityScore: number;    // 負債（負け筋）スコア
    survivalScore: number;          // 0.0 - 1.0
    evolutionProgressScore: number;
    energySpreadScore: number;
    tempoBoardScore: number;
}

/**
 * 山札の特徴量 - DeckFeatures
 */
export interface DeckFeatures {
    deckCount: number;
    thinnessScore: number;          // 圧縮度
    liveOutDensity: number;         // 有効札密度
    keyCardRemainingScore: number;  // 重要札の残り具合
    drawToOutProbability1: number;  // 1枚引いて当たりが出る確率
    drawToOutProbability2: number;  // 2枚引いて当たりが出る確率
    drawToOutProbability3: number;  // 3枚引いて当たりが出る確率
    deckOutRisk: number;            // 0.0 - 1.0
}

/**
 * サイド・賞品の特徴量 - PrizeFeatures
 */
export interface PrizeFeatures {
    prizedKeyPiecePenalty: number;
    prizedEvolutionPenalty: number;
    prizedEnergyPenalty: number;
    prizedAceSpecPenalty: number;
    prizeCheckConfidence: number;   // 0.0 - 1.0 (サイド把握度)
    comebackValue: number;          // 逆転の可能性
}

/**
 * 相手盤面の特徴量 - OpponentBoardFeatures
 */
export interface OpponentBoardFeatures {
    oppImmediateThreatScore: number; // 現ターンの脅威
    oppNextThreatScore: number;      // 次ターンの脅威
    oppSystemValueScore: number;     // 相手のシステムの価値
    oppBenchLiabilityScore: number;  // 相手の負け筋露出
    oppEnergyCommitmentScore: number;
    gustTargetValueScore: number;    // ボスで呼ぶ価値
    snipeTargetValueScore: number;   // ベンチ狙撃の価値
}

/**
 * サイドレースの特徴量 - PrizeRaceFeatures
 */
export interface PrizeRaceFeatures {
    selfPrizesToWin: number;
    oppPrizesToWin: number;
    selfAttackCountToWin: number;
    oppAttackCountToWin: number;
    selfPrizeRouteScore: number;     // 勝利へのルートの良さ
    oppPrizeRouteThreat: number;    // 敗北へのルートの危険度
    raceAdvantage: number;           // 相対的な有利度 (正: 自分有利)
}

/**
 * 相手手札の特徴量 - OpponentHandFeatures
 */
export interface OpponentHandFeatures {
    oppHandCountPressure: number;    // 枚数による圧力
    oppKnownComboScore: number;      // バレているコンボ
    oppLikelyBrickScore: number;     // 事故っている可能性
    disruptionValueScore: number;    // 今手札干渉を打つ価値
}

/**
 * 相手トラッシュの特徴量 - OpponentDiscardFeatures
 */
export interface OpponentDiscardFeatures {
    oppBossUsedCount: number;
    oppSwitchUsedCount: number;
    oppRecoveryUsedCount: number;
    oppEnergyUsedCount: number;
    oppSearchUsedCount: number;
    oppOutsExhaustionScore: number;  // 相手の切れ具合
    resourceLockPotential: number;    // 縛り/枯渇を狙えるか
}

/**
 * 全領域の特徴量をまとめたもの
 */
export interface CombinedFeatures {
    hand: HandFeatures;
    board: BoardFeatures;
    deck: DeckFeatures;
    prize: PrizeFeatures;
    oppBoard: OpponentBoardFeatures;
    prizeRace: PrizeRaceFeatures;
    oppHand: OpponentHandFeatures;
    oppDiscard: OpponentDiscardFeatures;
}
