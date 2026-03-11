import { GameState, PlayerId, ZoneType, CardInstance } from '../../types/game';

/**
 * 盤面の状態をAIが理解しやすいテキスト形式（Markdown）に変換します。
 */
export const generateGameStatusContext = (state: GameState): string => {
    const { cards, zones, currentTurnPlayer, turnCount, player1Deck, player2Deck } = state;

    let context = `## 現在のゲーム状況 (ターン: ${turnCount})\n`;
    context += `手番: ${currentTurnPlayer === 'player1' ? 'プレイヤー1 (自分)' : 'プレイヤー2 (相手)'}\n\n`;

    const renderPlayerState = (playerId: PlayerId) => {
        const isSelf = playerId === 'player1';
        const label = isSelf ? 'プレイヤー1 (自分)' : 'プレイヤー2 (相手)';

        let playerContext = `### ${label}\n`;

        // サイド
        const prizes = zones[`${playerId}-prizes`];
        playerContext += `- 残りサイド枚数: ${prizes.length}枚\n`;

        // バトル場
        const activeIds = zones[`${playerId}-active`];
        if (activeIds.length > 0) {
            const active = cards[activeIds[0]];
            playerContext += `- バトル場: ${renderCardInfo(active, cards)}\n`;
        } else {
            playerContext += `- バトル場: なし (きぜつ中または準備中)\n`;
        }

        // ベンチ
        playerContext += `- ベンチ:\n`;
        const benchIndices = [1, 2, 3, 4, 5];
        let hasBench = false;
        benchIndices.forEach(i => {
            const benchIds = zones[`${playerId}-bench-${i}` as ZoneType];
            if (benchIds && benchIds.length > 0) {
                const bench = cards[benchIds[0]];
                playerContext += `  ${i}. ${renderCardInfo(bench, cards)}\n`;
                hasBench = true;
            }
        });
        if (!hasBench) playerContext += `  (なし)\n`;

        // 手札 (自分のみ詳細、相手は枚数のみ)
        const hand = zones[`${playerId}-hand`];
        if (isSelf) {
            playerContext += `- 手札 (${hand.length}枚): ${hand.map(id => cards[id].name).join(', ')}\n`;
        } else {
            playerContext += `- 手札 (${hand.length}枚): (非公開)\n`;
        }

        // トラッシュ
        const trash = zones[`${playerId}-trash`];
        playerContext += `- トラッシュ (${trash.length}枚): ${trash.slice(-5).map(id => cards[id].name).join(', ')}${trash.length > 5 ? '...等' : ''}\n`;

        // 山札
        const deck = zones[`${playerId}-deck`];
        playerContext += `- 山札残り: ${deck.length}枚\n`;

        return playerContext;
    };

    context += renderPlayerState('player1');
    context += '\n';
    context += renderPlayerState('player2');

    return context;
};

/**
 * 個別のカード情報をAI向けの文字列に変換（エネ、ダメカン等）
 */
const renderCardInfo = (card: CardInstance, allCards: Record<string, CardInstance>): string => {
    let info = `**${card.name}**`;

    const conditions = [];
    if (card.damage > 0) conditions.push(`ダメカン:${card.damage}`);

    // 付随エネルギーの計算
    if (card.attachedEnergyIds && card.attachedEnergyIds.length > 0) {
        const energies = card.attachedEnergyIds.map(id => allCards[id]?.name).filter(Boolean);
        if (energies.length > 0) {
            conditions.push(`エネルギー:[${energies.join(', ')}]`);
        }
    }

    if (card.specialConditions && card.specialConditions.length > 0) {
        conditions.push(`状態:${card.specialConditions.join('/')}`);
    }

    if (conditions.length > 0) {
        info += ` (${conditions.join(', ')})`;
    }

    return info;
};

/**
 * AIコーチング用のシステムプロンプトを生成します。
 */
export const generateCoachSystemPrompt = (): string => {
    return `あなたはプロ級のポケモンカードコーチです。
必ず以下の【フォーマット】で回答してください。

【フォーマット】
---
事故率: [0-100]%
理想展開率: [0-100]%
推奨アクション: [タイトル]

# 戦略解説
[解説文]

## 候補手1：[タイプ]
- 内容: [手順]
- メリット: [効果]
- リスク: [被害]

## 候補手2：[タイプ]
- 内容: [手順]
- メリット: [効果]
- リスク: [被害]

## 回避すべきミス
- [ミスとその理由]
---`;
};
