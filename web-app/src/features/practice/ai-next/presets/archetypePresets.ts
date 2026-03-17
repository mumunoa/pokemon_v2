
import { ArchetypeStrategy } from '../domain/types';

/**
 * Archetype presets for tailored AI coaching.
 */

const PRESETS: Record<string, ArchetypeStrategy> = {
    'charizard_ex': {
        name: 'Charizard ex',
        priorityWeights: { prizeSwing: 1.1, setupGain: 1.3, stabilityGain: 1.2 },
        idealBoard: { minBenchItems: 4, requireEnergyOnActive: true, requireEvolutionReady: true }
    },
    'dragapult_ex': {
        name: 'Dragapult ex',
        priorityWeights: { prizeSwing: 1.3, setupGain: 1.1, stabilityGain: 1.1 },
        idealBoard: { minBenchItems: 3, requireEnergyOnActive: true, requireEvolutionReady: true }
    },
    'raging_bolt': {
        name: 'Raging Bolt ex',
        priorityWeights: { prizeSwing: 1.5, setupGain: 0.9, stabilityGain: 1.0 },
        idealBoard: { minBenchItems: 3, requireEnergyOnActive: true, requireEvolutionReady: false }
    },
    'regidrago_vstar': {
        name: 'Regidrago VSTAR',
        priorityWeights: { prizeSwing: 1.2, setupGain: 1.2, stabilityGain: 1.4 },
        idealBoard: { minBenchItems: 3, requireEnergyOnActive: true, requireEvolutionReady: true }
    },
    'generic': {
        name: 'Generic',
        priorityWeights: { prizeSwing: 1.0, setupGain: 1.0, stabilityGain: 1.0 },
        idealBoard: { minBenchItems: 3, requireEnergyOnActive: true, requireEvolutionReady: false }
    }
};

export function resolveArchetypePreset(archetype: string): ArchetypeStrategy {
    const key = archetype.toLowerCase().replace(/\s+/g, '_');
    return PRESETS[key] || PRESETS['generic'];
}
