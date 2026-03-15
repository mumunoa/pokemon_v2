import { GamePhase } from './types';

export const PHASE_WEIGHTS: Record<GamePhase, Record<string, number>> = {
    PREPARE: {
        hand: 2.5,
        board: 2.0,
        deck: 1.0,
        prize: 1.6,
        oppBoard: 1.4,
        prizeRace: 0.4,
        oppHand: 0.3,
        oppDiscard: 0.0
    },
    EARLY: {
        hand: 2.0,
        board: 3.2,
        deck: 1.4,
        prize: 2.0,
        oppBoard: 1.8,
        prizeRace: 1.3,
        oppHand: 0.7,
        oppDiscard: 0.9
    },
    MID: {
        hand: 1.6,
        board: 2.8,
        deck: 1.7,
        prize: 1.1,
        oppBoard: 3.0,
        prizeRace: 3.0,
        oppHand: 1.8,
        oppDiscard: 2.9
    },
    LATE: {
        hand: 1.4,
        board: 2.1,
        deck: 2.5,
        prize: 1.0,
        oppBoard: 2.6,
        prizeRace: 4.2,
        oppHand: 2.9,
        oppDiscard: 3.2
    }
};

export const INITIAL_WIN_CONDITIONS = [
    '相手のサイドを0にする',
    '相手の山札を切らす'
];
