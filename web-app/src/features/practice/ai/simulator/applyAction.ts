import { CanonicalGameState, AIBoardPokemon, AICardRef } from '../core/types';
import { ActionAtom } from '../generator/types';
import { cloneState } from './cloneState';

/**
 * 指定された原子行動をゲーム状態に適用し、新しい状態を返します。
 * 元の状態は変更しません（不変性）。
 */
export function applyAction(state: CanonicalGameState, action: ActionAtom): CanonicalGameState {
    const nextState = cloneState(state);
    const self = nextState.self;

    switch (action.type) {
        case 'PLAY_BASIC': {
            const cardIndex = self.hand.findIndex(c => c.instanceId === action.cardId);
            if (cardIndex !== -1) {
                const card = self.hand.splice(cardIndex, 1)[0];
                const newPokemon: AIBoardPokemon = {
                    ...card,
                    damage: 0,
                    hp: 100, // 暫定
                    maxHp: 100,
                    attachedEnergyIds: [],
                    specialConditions: [],
                    stage: 'BASIC',
                    ownerId: nextState.currentPlayerId
                };
                if (action.toBench) {
                    self.bench.push(newPokemon);
                }
            }
            break;
        }

        case 'EVOLVE': {
            const cardIndex = self.hand.findIndex(c => c.instanceId === action.toCardId);
            if (cardIndex !== -1) {
                const evolutionCard = self.hand.splice(cardIndex, 1)[0];
                const targets = [self.active, ...self.bench];
                const target = targets.find(p => p?.instanceId === action.fromId);
                if (target) {
                    // ポケモンを置換
                    target.instanceId = evolutionCard.instanceId;
                    target.baseCardId = evolutionCard.baseCardId;
                    target.name = evolutionCard.name;
                    target.stage = 'STAGE1'; // 暫定
                }
            }
            break;
        }

        case 'ATTACH_ENERGY': {
            const cardIndex = self.hand.findIndex(c => c.instanceId === action.cardId);
            if (cardIndex !== -1) {
                const energyCard = self.hand.splice(cardIndex, 1)[0];
                const targets = [self.active, ...self.bench];
                const target = targets.find(p => p?.instanceId === action.toPokemonId);
                if (target) {
                    target.attachedEnergyIds.push(energyCard.instanceId);
                    self.energyAttachedThisTurn = true;
                }
            }
            break;
        }

        case 'PLAY_SUPPORTER': {
            const cardIndex = self.hand.findIndex(c => c.instanceId === action.cardId);
            if (cardIndex !== -1) {
                const card = self.hand.splice(cardIndex, 1)[0];
                self.discard.push(card);
                self.supporterUsed = true;
                // サポートの効果シミュレーション（簡易版：3枚引く等）
                // ここでは状態変更フラグのみ立てる
            }
            break;
        }

        case 'RETREAT': {
            if (self.active) {
                const targetIndex = self.bench.findIndex(p => p.instanceId === action.toId);
                if (targetIndex !== -1) {
                    const nextActive = self.bench.splice(targetIndex, 1)[0];
                    const oldActive = self.active;
                    self.active = nextActive;
                    self.bench.push(oldActive);
                    self.retreatUsed = true;
                }
            }
            break;
        }

        case 'ATTACK': {
            // 攻撃の解決（ダメージ計算などは resolveEffects で行う）
            self.attackUsed = true;
            break;
        }

        case 'PASS': {
            // 何もしない
            break;
        }

        // 他のアクションも同様に実装
    }

    return nextState;
}

/**
 * 一連の行動（シーケンス）をすべて適用します。
 */
export function applySequence(state: CanonicalGameState, actions: ActionAtom[]): CanonicalGameState {
    return actions.reduce((currState, action) => applyAction(currState, action), state);
}
