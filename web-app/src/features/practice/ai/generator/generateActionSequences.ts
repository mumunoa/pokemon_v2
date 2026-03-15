import { ActionAtom, ActionSequence } from './types';
import { CanonicalGameState } from '../core/types';
import { generateActionAtoms } from './generateActionAtoms';

/**
 * 原子行動を組み合わせて、戦略的な候補シーケンスを生成します。
 */
export function generateActionSequences(state: CanonicalGameState): ActionSequence[] {
    const atoms = generateActionAtoms(state);
    const sequences: ActionSequence[] = [];

    // --- 戦略 A: 最短攻撃ルート ---
    const attackAtoms = atoms.filter(a => a.type === 'ATTACK');
    attackAtoms.forEach(attack => {
        // 攻撃の前に「手張り」や「進化」があるかチェック
        const setupActions: ActionAtom[] = [];
        
        // 進化があれば入れる
        const evolutions = atoms.filter(a => a.type === 'EVOLVE' && a.fromId === state.self.active?.instanceId);
        if (evolutions.length > 0) setupActions.push(evolutions[0]);

        // 手張りがあれば入れる
        const energyAttach = atoms.filter(a => a.type === 'ATTACH_ENERGY' && a.toPokemonId === state.self.active?.instanceId);
        if (energyAttach.length > 0) setupActions.push(energyAttach[0]);

        sequences.push({
            actions: [...setupActions, attack],
            label: '攻撃ルート',
            description: 'バトルポケモンの準備を整えて攻撃します。'
        });
    });

    // --- 戦略 B: 盤面展開優先ルート ---
    const deployActions = atoms.filter(a => a.type === 'PLAY_BASIC' || a.type === 'EVOLVE' || a.type === 'PLAY_ITEM');
    if (deployActions.length > 0) {
        sequences.push({
            actions: deployActions.slice(0, 3), // 最初の3アクションに限定
            label: '展開優先',
            description: 'ベンチの展開とポケモンの準備を優先します。'
        });
    }

    // --- 戦略 C: サポート活用ルート ---
    const supportAction = atoms.find(a => a.type === 'PLAY_SUPPORTER');
    if (supportAction) {
        // サポートを使った後に展開・攻撃を検討
        sequences.push({
            actions: [supportAction],
            label: 'サポート活用',
            description: 'サポートカードを使用してリソースを補充します。'
        });
    }

    // --- 戦略 D: 番を終わるのみ ---
    sequences.push({
        actions: [{ type: 'PASS' }],
        label: '番を終わる',
        description: '何もせず番を終わります。'
    });

    // 重複や無効なシーケンスのフィルタリング（本来はここで prune される）
    const uniqueSequences = pruneSequences(sequences);

    return uniqueSequences;
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
