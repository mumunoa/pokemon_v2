/**
 * AIが検討する単一の原子行動
 */
export type ActionAtom =
  | { type: 'PLAY_BASIC'; cardId: string; toBench: boolean; toActive?: boolean }
  | { type: 'EVOLVE'; fromId: string; toCardId: string }
  | { type: 'PLAY_ITEM'; cardId: string; target?: string; choice?: string[] }
  | { type: 'PLAY_SUPPORTER'; cardId: string; target?: string; choice?: string[] }
  | { type: 'PLAY_STADIUM'; cardId: string }
  | { type: 'ATTACH_ENERGY'; cardId: string; toPokemonId: string }
  | { type: 'RETREAT'; fromId: string; toId: string }
  | { type: 'USE_ABILITY'; sourceId: string; abilityId: string; target?: string }
  | { type: 'ATTACK'; attackId: string; target?: string }
  | { type: 'PASS' };

/**
 * atomicな行動を組み合わせた一連の手順
 */
export interface ActionSequence {
    actions: ActionAtom[];
    label: string;
    description: string;
}
