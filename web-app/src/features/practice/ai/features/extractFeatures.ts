import { CanonicalGameState, AICardRef, AIBoardPokemon } from '../core/types';
import { 
    CombinedFeatures, 
    HandFeatures, 
    BoardFeatures, 
    DeckFeatures, 
    PrizeFeatures, 
    OpponentBoardFeatures, 
    PrizeRaceFeatures, 
    OpponentHandFeatures, 
    OpponentDiscardFeatures 
} from './types';

/**
 * CanonicalGameStateから全8領域の特徴量を抽出します。
 */
export function extractFeatures(state: CanonicalGameState): CombinedFeatures {
    return {
        hand: extractHandFeatures(state),
        board: extractBoardFeatures(state),
        deck: extractDeckFeatures(state),
        prize: extractPrizeFeatures(state),
        oppBoard: extractOpponentBoardFeatures(state),
        prizeRace: extractPrizeRaceFeatures(state),
        oppHand: extractOpponentHandFeatures(state),
        oppDiscard: extractOpponentDiscardFeatures(state)
    };
}

/**
 * 1. 手札の特徴量抽出
 */
function extractHandFeatures(state: CanonicalGameState): HandFeatures {
    const hand = state.self.hand;
    
    const countByKind = (name: string) => hand.filter(c => c.name.includes(name)).length;
    
    return {
        playableBasics: hand.filter(c => c.type === 'pokemon' && c.kinds === 'non_rule').length,
        playableEvolutionPieces: hand.filter(c => c.type === 'pokemon' && c.kinds !== 'non_rule').length, // 暫定
        playableSearchCards: hand.filter(c => ['ボール', 'ネスト', 'ハイパー'].some(k => c.name.includes(k))).length,
        playableDrawCards: hand.filter(c => ['博士', 'ナンジャモ', 'ジャッジマン', 'ドロー'].some(k => c.name.includes(k))).length,
        playableSwitchCards: hand.filter(c => ['いれかえ', 'あなぬけ', 'カート'].some(k => c.name.includes(k))).length,
        playableRecoveryCards: hand.filter(c => ['つりざお', '回収'].some(k => c.name.includes(k))).length,
        playableDisruptionCards: hand.filter(c => ['ナンジャモ', 'ジャッジマン'].some(k => c.name.includes(k))).length,
        playableBossCards: countByKind('ボスの指令'),
        playableEnergyCount: hand.filter(c => c.type === 'energy').length,
        deadCardCount: 0, // 実装予定
        comboReadyScore: 0.5,
        handFlexibilityScore: 0.5,
        immediateAttackAccess: state.self.active && hand.some(c => c.type === 'energy') ? 1 : 0,
        nextTurnAttackAccess: 1
    };
}

/**
 * 2. 自分盤面の特徴量抽出
 */
function extractBoardFeatures(state: CanonicalGameState): BoardFeatures {
    const self = state.self;
    const active = self.active;
    const bench = self.bench;

    const isAttackReady = (p: AIBoardPokemon | null) => p ? (p.attachedEnergyIds.length >= 2 ? 1 : 0) : 0;

    return {
        activeAttackReady: isAttackReady(active),
        benchAttackReadyCount: bench.filter(p => isAttackReady(p)).length,
        backupAttackerCount: bench.length,
        drawEngineCount: bench.filter(p => ['輝く', 'システム'].some(k => p.name.includes(k))).length,
        searchEngineCount: 0,
        pivotQuality: bench.some(p => p.attachedEnergyIds.length === 0) ? 0.8 : 0.4,
        retreatSafety: active && active.damage < (active.hp * 0.5) ? 1.0 : 0.5,
        benchLiabilityScore: bench.length >= 4 ? 20 : 0,
        survivalScore: 0.7,
        evolutionProgressScore: bench.filter(p => p.damage === 0).length,
        energySpreadScore: self.energyAttachedThisTurn ? 1.0 : 0.0,
        tempoBoardScore: 0.5
    };
}

/**
 * 3. 山札の特徴量抽出
 */
function extractDeckFeatures(state: CanonicalGameState): DeckFeatures {
    const count = state.self.deckCount;
    return {
        deckCount: count,
        thinnessScore: count < 40 ? 0.8 : 0.3,
        liveOutDensity: 0.2, // 山札の中身が見えないため暫定
        keyCardRemainingScore: 0.5,
        drawToOutProbability1: 0.1,
        drawToOutProbability2: 0.2,
        drawToOutProbability3: 0.3,
        deckOutRisk: count < 5 ? 0.9 : 0.1
    };
}

/**
 * 4. サイドの特徴量抽出
 */
function extractPrizeFeatures(state: CanonicalGameState): PrizeFeatures {
    return {
        prizedKeyPiecePenalty: 0,
        prizedEvolutionPenalty: 0,
        prizedEnergyPenalty: 0,
        prizedAceSpecPenalty: 0,
        prizeCheckConfidence: state.turn > 1 ? 0.3 : 0.0,
        comebackValue: state.self.prizeCount > state.opponent.prizeCount ? 0.8 : 0.2
    };
}

/**
 * 5. 相手盤面の特徴量抽出
 */
function extractOpponentBoardFeatures(state: CanonicalGameState): OpponentBoardFeatures {
    const opp = state.opponent;
    return {
        oppImmediateThreatScore: opp.active ? 10 : 0,
        oppNextThreatScore: opp.bench.length * 5,
        oppSystemValueScore: 10,
        oppBenchLiabilityScore: opp.bench.length >= 4 ? 15 : 0,
        oppEnergyCommitmentScore: opp.active?.attachedEnergyIds.length || 0,
        gustTargetValueScore: 0.5,
        snipeTargetValueScore: 0.2
    };
}

/**
 * 6. サイドレースの特徴量抽出
 */
function extractPrizeRaceFeatures(state: CanonicalGameState): PrizeRaceFeatures {
    const selfPrizes = state.self.prizeCount;
    const oppPrizes = state.opponent.prizeCount;
    
    // 完遂までの攻撃回数（簡易計算）
    const selfAttacks = Math.ceil(selfPrizes / 2);
    const oppAttacks = Math.ceil(oppPrizes / 2);

    return {
        selfPrizesToWin: selfPrizes,
        oppPrizesToWin: oppPrizes,
        selfAttackCountToWin: selfAttacks,
        oppAttackCountToWin: oppAttacks,
        selfPrizeRouteScore: 1.0 / (selfAttacks + 1),
        oppPrizeRouteThreat: 1.0 / (oppAttacks + 1),
        raceAdvantage: oppAttacks - selfAttacks
    };
}

/**
 * 7. 相手手札の特徴量抽出
 */
function extractOpponentHandFeatures(state: CanonicalGameState): OpponentHandFeatures {
    const count = state.opponent.handCount;
    return {
        oppHandCountPressure: count > 6 ? 0.9 : 0.3,
        oppKnownComboScore: 0,
        oppLikelyBrickScore: count < 2 ? 0.8 : 0.1,
        disruptionValueScore: count > 5 ? 0.8 : 0.2
    };
}

/**
 * 8. 相手トラッシュの特徴量抽出
 */
function extractOpponentDiscardFeatures(state: CanonicalGameState): OpponentDiscardFeatures {
    const discard = state.opponent.discard;
    const countByName = (name: string) => discard.filter(c => c.name.includes(name)).length;

    return {
        oppBossUsedCount: countByName('ボスの指令'),
        oppSwitchUsedCount: countByName('いれかえ') + countByName('あなぬけ'),
        oppRecoveryUsedCount: countByName('つりざお'),
        oppEnergyUsedCount: discard.filter(c => c.type === 'energy').length,
        oppSearchUsedCount: discard.filter(c => c.name.includes('ボール')).length,
        oppOutsExhaustionScore: discard.length / 30, // 暫定
        resourceLockPotential: 0.2
    };
}
