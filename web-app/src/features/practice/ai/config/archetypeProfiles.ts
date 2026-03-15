export interface ArchetypeProfile {
    id: string;
    name: string;
    keyCards: string[];
    priorityTargets: string[]; // 優先的に倒すべき相手ポケモン
    earlyGameGoal: string;
    midGameGoal: string;
    lateGameGoal: string;
    evaluationWeights: Record<string, number>;
}

export const ARCHETYPE_PROFILES: Record<string, ArchetypeProfile> = {
    MIRAIDON_AGGRO: {
        id: 'MIRAIDON_AGGRO',
        name: 'ミライドンex (アグロ系)',
        keyCards: ['ミライドンex', 'エレキジェネレーター', 'ライチュウV'],
        priorityTargets: ['システムポケモン', '進化前たねポケモン'],
        earlyGameGoal: '1ターン目から殴り始める',
        midGameGoal: 'サイドレースのテンポを維持する',
        lateGameGoal: 'ボスの指令でゲームを終わらせる',
        evaluationWeights: {
            board: 1.5,
            tempo: 2.0,
            resource: 0.8
        }
    },
    GARD_CONTROL: {
        id: 'GARD_CONTROL',
        name: 'サーナイトex (コントロール系)',
        keyCards: ['サーナイトex', 'キルリア', 'サケブシッポ'],
        priorityTargets: ['相手のアタッカー'],
        earlyGameGoal: 'キルリアを並べてドローエンジンを完成させる',
        midGameGoal: 'エネルギーをトラッシュに貯めて逆転の準備をする',
        lateGameGoal: '高火力またはベンチ狙撃でサイドを捲る',
        evaluationWeights: {
            board: 1.0,
            tempo: 0.5,
            resource: 2.2
        }
    }
};
