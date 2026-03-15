import { ActionAtom, ActionSequence } from './types';
import { CanonicalGameState } from '../core/types';
import { generateActionAtoms } from './generateActionAtoms';

/**
 * 原子行動を組み合わせて、戦略的な候補シーケンスを生成します。
 */
export function generateActionSequences(state: CanonicalGameState): ActionSequence[] {
    if (state.phase === 'PREPARE') {
        return generatePrepareSequences(state);
    }

    const atoms = generateActionAtoms(state);
    const sequences: ActionSequence[] = [];

    // --- 1. 戦略的統合シーケンス（ユーザー推奨の優先順位に基づく） ---
    // 順序: 山札圧縮/情報取得 -> 展開 -> エネルギー -> サポート -> ボス -> 攻撃
    const buildIntegratedSequence = (): ActionSequence | null => {
        const resultActions: ActionAtom[] = [];
        const usedAtomIndices = new Set<number>();

        // カテゴリ定義
        const categories = [
            { label: '山札圧縮・取得', types: ['PLAY_ITEM'], subType: 'search' }, 
            { label: '展開', types: ['PLAY_BASIC', 'EVOLVE'] },
            { label: 'エネルギー', types: ['ATTACH_ENERGY'] },
            { label: 'サポート', types: ['PLAY_SUPPORTER'] },
            { label: '入れ替え・ボス', types: ['RETREAT'], cardName: 'ボス' }, // 現状のAtomにBossがないため簡易
            { label: '攻撃', types: ['ATTACK'] }
        ];

        for (const cat of categories) {
            // 原子行動からカテゴリに合うものを抽出（簡易的な判定）
            const matchingAtoms = atoms.map((a, i) => ({ a, i })).filter(({ a, i }) => {
                if (usedAtomIndices.has(i)) return false;
                if (!cat.types.includes(a.type as any)) return false;
                return true;
            });

            matchingAtoms.forEach(({ a, i }) => {
                resultActions.push(a);
                usedAtomIndices.add(i);
            });
        }

        if (resultActions.length > 0 && !(resultActions.length === 1 && resultActions[0].type === 'PASS')) {
            return {
                actions: resultActions,
                label: 'おすすめの連続行動',
                description: '定石の順序に基づき、盤面展開から攻撃まで行います。'
            };
        }
        return null;
    };

    const integrated = buildIntegratedSequence();
    if (integrated) sequences.push(integrated);

    // --- 2. 単発・カテゴリ別シーケンス（探索用） ---
    // 攻撃ルート
    const attackAtoms = atoms.filter(a => a.type === 'ATTACK');
    attackAtoms.forEach(attack => {
        sequences.push({
            actions: [attack],
            label: '攻撃',
            description: 'バトルポケモンの技を使用します。'
        });
    });

    // 展開ルート
    const deployActions = atoms.filter(a => ['PLAY_BASIC', 'EVOLVE', 'PLAY_ITEM'].includes(a.type));
    if (deployActions.length > 0) {
        sequences.push({
            actions: deployActions.slice(0, 3),
            label: '盤面展開',
            description: 'ポケモンの準備を優先します。'
        });
    }

    // サポート
    const supportAction = atoms.find(a => a.type === 'PLAY_SUPPORTER');
    if (supportAction) {
        sequences.push({
            actions: [supportAction],
            label: 'サポート使用',
            description: 'サポートカードを使用して展開を加速します。'
        });
    }

    // --- 3. 番を終わる（フォールバック） ---
    // 他に行動がある場合、PASSの優先度を下げるため最後に追加
    sequences.push({
        actions: [{ type: 'PASS' }],
        label: '番を終わる',
        description: 'これ以上有効な行動がない、またはリソースを温存する場合に選択します。'
    });

    return pruneSequences(sequences);
}

function pruneSequences(sequences: ActionSequence[]): ActionSequence[] {
    // 簡易的な重複排除
    const seen = new Set<string>();
    return sequences.filter(s => {
        const key = JSON.stringify(s.actions);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * 対戦準備中の推奨行動を生成します
 */
function generatePrepareSequences(state: CanonicalGameState): ActionSequence[] {
    const handBasics = state.self.hand.filter(c => c.type === 'pokemon');
    const sequences: ActionSequence[] = [];

    // Case 1: バトル場にポケモンがいない場合
    if (!state.self.active) {
        if (handBasics.length === 0) {
            sequences.push({
                actions: [{ type: 'PASS' }], 
                label: '引き直し（マリガン）',
                description: '手札にたねポケモンがいないため、引き直しをしましょう。'
            });
        } else if (handBasics.length === 1) {
            sequences.push({
                actions: [{ type: 'PLAY_BASIC', cardId: handBasics[0].instanceId, toBench: false, toActive: true }],
                label: 'バトル場に出す',
                description: `${handBasics[0].name}をバトル場に出しましょう。`
            });
        } else {
            // 2枚以上の場合のヒューリスティック
            const rulePokemon = handBasics.filter(c => c.kinds === 'has_rule');
            const nonRulePokemon = handBasics.filter(c => c.kinds === 'non_rule');

            // 優先順位: 
            // 1. 非ルールのたねポケモン（サイド取リを抑える）
            // 2. HPが高い、または逃げエネが少ないなどの汎用性
            const candidates = nonRulePokemon.length > 0 ? nonRulePokemon : rulePokemon;
            const bestToActive = candidates[0]; 

            const hasRecovery = state.self.hand.some(c => c.name.includes('夜のたんか') || c.name.includes('すごいつりざお'));
            const recoveryNote = hasRecovery ? '手札に回収手段（夜のたんか等）があるため、このポケモンが倒されてもリカバリーが可能です。' : '';

            sequences.push({
                actions: [{ type: 'PLAY_BASIC', cardId: bestToActive.instanceId, toBench: false, toActive: true }],
                label: '一番おすすめのバトル場',
                description: `${bestToActive.name}は序盤の壁として優秀で、倒された時のリスクも低いです。${recoveryNote}`
            });
        }
    } else {
        // Case 2: ベンチにポケモンがいない場合（または追加で出すか）
        // 対戦準備中は情報を伏せる、特性温存のためベンチに出さないことを推奨
        const hasOnPlayAbility = state.self.hand.some(c => 
            c.type === 'pokemon' && (c.name.includes('ネオラント') || c.name.includes('イキリンコ') || c.name.includes('キチキギス'))
        );
        const abilityNote = hasOnPlayAbility ? '手札に出した時に効果を発揮する特性を持つポケモンがいるため、今は出さずに温存しましょう。' : '';

        sequences.push({
            actions: [{ type: 'PASS' }],
            label: 'ベンチに出さない（推奨）',
            description: `対戦準備中はベンチにポケモンを出さず、相手にデッキ情報を伏せておくのがセオリーです。${abilityNote}`
        });
    }

    return sequences;
}
