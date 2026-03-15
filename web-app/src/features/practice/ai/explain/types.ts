/**
 * AIによる行動の解説構造
 */
export interface ActionExplanation {
    title: string;
    description: string;
    pros: string[];
    cons: string[];
    score: number;
    strategicValue: string; // 'LETHAL' | 'SETUP' | 'DISRUPTION' | 'RECOVERY'
}

/**
 * AIコーチからのコメント
 */
export interface CoachCommentary {
    mainAdvice: string;
    bestActions: ActionExplanation[];
    alternatives: ActionExplanation[];
    gameContext: string; // '今は準備の時です' 等
}
