
import { DeckList, ArchetypeStrategy } from '../domain/types';

/**
 * Interface to resolve archetype tactics and goals.
 */

export function analyzeDeckContext(deck: DeckList | null): ArchetypeStrategy {
  const archetype = deck?.archetype || 'generic';

  // Default values
  const strategy: ArchetypeStrategy = {
    name: archetype,
    priorityWeights: {
      prizeSwing: 1.0,
      setupGain: 1.0,
      stabilityGain: 1.0,
    },
    idealBoard: {
      minBenchItems: 3,
      requireEnergyOnActive: true,
      requireEvolutionReady: false,
    },
  };

  // Archetype-specific overrides
  if (archetype.toLowerCase().includes('charizard')) {
    strategy.priorityWeights.setupGain = 1.2;
    strategy.priorityWeights.stabilityGain = 1.3;
    strategy.idealBoard.minBenchItems = 4;
    strategy.idealBoard.requireEvolutionReady = true;
  } else if (archetype.toLowerCase().includes('dragapult')) {
    strategy.priorityWeights.prizeSwing = 1.2;
    strategy.priorityWeights.setupGain = 1.1;
  } else if (archetype.toLowerCase().includes('raging_bolt')) {
    strategy.priorityWeights.prizeSwing = 1.4;
    strategy.priorityWeights.setupGain = 0.8;
  }

  return strategy;
}
