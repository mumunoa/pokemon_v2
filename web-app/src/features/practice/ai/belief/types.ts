/**
 * 相手のデッキタイプや持っていそうなカードの推定
 */
export interface BeliefSnapshot {
    opponentArchetypeProbabilities: Record<string, number>;
    opponentHandEstimates: Record<string, number>; // カード名ごとの所持確率
    opponentNextTurnThreats: ThreatEstimate[];
    prizeEstimates: PrizeEstimate[];
}

export interface ThreatEstimate {
    type: 'KO_ACTIVE' | 'KO_BENCH' | 'HAND_DISRUPTION' | 'ENERGY_LOCK';
    probability: number;
    severity: number;
}

export interface PrizeEstimate {
    index: number;
    cardIdCandidates: string[];
    isKeyCard: boolean;
}
