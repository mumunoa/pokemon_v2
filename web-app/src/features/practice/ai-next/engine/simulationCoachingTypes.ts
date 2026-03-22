// simulationCoachingTypes.ts
import type { RecommendationResult } from "../domain/types";

export type SimulationBucket = "green" | "yellow" | "red";

export type SimulationMetricKey =
  | "seedRate"
  | "setupRate"
  | "supportAccessRate"
  | "energyAccessRate";

export type SimulationMetric = {
  key: SimulationMetricKey;
  label: string;
  value: number;
  greenMin: number;
  yellowMin: number;
  severity: number;
  bucket: SimulationBucket;
  diagnosis: string;
};

export type SimulationThresholdProfile = {
  seedRate: { greenMin: number; yellowMin: number };
  setupRate: { greenMin: number; yellowMin: number };
  supportAccessRate: { greenMin: number; yellowMin: number };
  energyAccessRate: { greenMin: number; yellowMin: number };
};

export type OpeningSimulationRaw = {
  trials: number;
  seedRate: number;
  setupRate: number;
  supportAccessRate: number;
  energyAccessRate: number;
  stableOpeningRate?: number;
  failBreakdown?: {
    noSeed?: number;
    noBenchByTurn2?: number;
    noSupportByTurn2?: number;
    noEnergyByTurn2?: number;
    noAttackReadyByTurn2?: number;
    noEvolutionByTurn2?: number;
  };
  pathBreakdown?: {
    successWithSupport?: number;
    successWithoutSupport?: number;
    successWithEnergySearch?: number;
    successWithoutEnergySearch?: number;
  };
};

export type DeckRoleSummary = {
  pokemonCount?: number;
  basicPokemonCount?: number;
  evolutionLineCount?: number;
  supportCount?: number;
  drawSupportCount?: number;
  gustSupportCount?: number;
  searchSupportCount?: number;
  itemCount?: number;
  searchItemCount?: number;
  switchItemCount?: number;
  energySearchItemCount?: number;
  recoveryItemCount?: number;
  stadiumCount?: number;
  toolCount?: number;
  basicEnergyCount?: number;
  specialEnergyCount?: number;
};

export type CoachingImprovementSuggestion = {
  id: string;
  priority: 1 | 2 | 3;
  title: string;
  issueKey: string;
  diagnosis: string;
  action: string;
  whyItMatters: string;
  cutGuidance: string[];
  addRoleTags: string[];
  candidateCardNames: string[];
  expectedImpact: string;
};

export type SimulationCoachingInsight = {
  headline: string;
  summary: string;
  metrics: SimulationMetric[];
  bottlenecks: string[];
  reproducibleRules: string[];
  suggestions: CoachingImprovementSuggestion[];
};

export type RecommendationWithSimulation = {
  baseRecommendation: RecommendationResult;
  simulationCoaching: SimulationCoachingInsight;
  version: string;
};

export const DEFAULT_SIMULATION_THRESHOLDS: SimulationThresholdProfile = {
  seedRate: { greenMin: 90, yellowMin: 85 },
  setupRate: { greenMin: 70, yellowMin: 60 },
  supportAccessRate: { greenMin: 85, yellowMin: 75 },
  energyAccessRate: { greenMin: 75, yellowMin: 60 },
};
