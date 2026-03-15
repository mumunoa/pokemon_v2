import { ActionAtom } from './types';
import { CanonicalGameState } from '../core/types';

/**
 * 実行可能な原子行動（ActionAtom）をすべて列挙します。
 */
export function generateActionAtoms(state: CanonicalGameState): ActionAtom[] {
    const atoms: ActionAtom[] = [];
    const self = state.self;

    if (!self) return atoms;

    // 1. たねポケモンを出す
    self.hand.filter(c => c.type === 'pokemon' && c.kinds === 'non_rule').forEach(card => {
        if (self.bench.length < 5) {
            atoms.push({ type: 'PLAY_BASIC', cardId: card.instanceId, toBench: true });
        }
    });

    // 2. 進化
    self.hand.filter(c => c.type === 'pokemon' && c.kinds !== 'non_rule').forEach(card => {
        // バトル場
        if (self.active) {
            atoms.push({ type: 'EVOLVE', fromId: self.active.instanceId, toCardId: card.instanceId });
        }
        // ベンチ
        self.bench.forEach(p => {
            if (p) {
                atoms.push({ type: 'EVOLVE', fromId: p.instanceId, toCardId: card.instanceId });
            }
        });
    });

    // 3. トレーナーズ
    self.hand.filter(c => c.type === 'trainer').forEach(card => {
        if (card.kinds === 'supporter') {
            if (!self.supporterUsed) {
                atoms.push({ type: 'PLAY_SUPPORTER', cardId: card.instanceId });
            }
        } else if (card.kinds === 'item') {
            atoms.push({ type: 'PLAY_ITEM', cardId: card.instanceId });
        } else if (card.kinds === 'stadium') {
            atoms.push({ type: 'PLAY_STADIUM', cardId: card.instanceId });
        }
    });

    // 4. エネルギー添付
    if (!self.energyAttachedThisTurn) {
        self.hand.filter(c => c.type === 'energy').forEach(card => {
            if (self.active) {
                atoms.push({ type: 'ATTACH_ENERGY', cardId: card.instanceId, toPokemonId: self.active.instanceId });
            }
            self.bench.forEach(p => {
                if (p) {
                    atoms.push({ type: 'ATTACH_ENERGY', cardId: card.instanceId, toPokemonId: p.instanceId });
                }
            });
        });
    }

    // 5. 特性
    if (self.active) {
        atoms.push({ type: 'USE_ABILITY', sourceId: self.active.instanceId, abilityId: 'active_ability' });
    }
    self.bench.forEach(p => {
        if (p) {
            atoms.push({ type: 'USE_ABILITY', sourceId: p.instanceId, abilityId: 'bench_ability' });
        }
    });

    // 6. 逃げる
    if (self.active && !self.retreatUsed && self.bench.length > 0) {
        self.bench.forEach(p => {
            if (p) {
                atoms.push({ type: 'RETREAT', fromId: self.active!.instanceId, toId: p.instanceId });
            }
        });
    }

    // 7. 攻撃
    if (self.active && !self.attackUsed) {
        atoms.push({ type: 'ATTACK', attackId: 'default_attack' });
    }

    // 8. 番を終わる
    atoms.push({ type: 'PASS' });

    return atoms;
}
