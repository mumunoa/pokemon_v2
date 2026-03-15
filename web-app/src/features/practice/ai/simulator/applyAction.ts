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

        case 'PLAY_ITEM': {
            const cardIndex = self.hand.findIndex(c => c.instanceId === action.cardId);
            if (cardIndex !== -1) {
                const card = self.hand.splice(cardIndex, 1)[0];
                self.discard.push(card);
                // 山札圧縮/サーチのシミュレーション
                // ネストボール等の場合はベンチに仮想のたねポケモンを追加
                if (card.name.includes('ネスト') || card.name.includes('ハイパー')) {
                    const virtualPokemon: AIBoardPokemon = {
                        instanceId: 'virtual-search-' + Math.random(),
                        baseCardId: 'placeholder',
                        name: 'サーチされたポケモン',
                        type: 'pokemon',
                        kinds: 'non_rule',
                        superType: 'pokemon',
                        damage: 0,
                        hp: 100,
                        maxHp: 100,
                        attachedEnergyIds: [],
                        specialConditions: [],
                        stage: 'BASIC',
                        ownerId: nextState.currentPlayerId
                    };
                    if (self.bench.length < 5) self.bench.push(virtualPokemon);
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
                // サポートの効果シミュレーション（平均的なドロー枚数を加算）
                // 実際には山札から引くが、シミュレーション上は「仮想カード」を増やす
                for (let i = 0; i < 3; i++) {
                    self.hand.push({
                        instanceId: 'virtual-draw-' + i + '-' + Math.random(),
                        baseCardId: 'placeholder',
                        name: 'ドローしたカード',
                        type: 'item',
                        kinds: 'non_rule',
                        superType: 'item'
                    });
                }
            }
            break;
        }

        case 'ATTACK': {
            self.attackUsed = true;
            // 攻撃の解決: 相手のバトル場に暫定ダメージを与える
            if (nextState.opponent.active) {
                // 暫定で100ダメージ（平均的）
                nextState.opponent.active.damage += 100;
            }
            break;
        }

        case 'PASS': {
            // PASSを選択したことによる小さなペナルティ（行動優先のため）
            nextState.unproductiveTurn = true; 
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
