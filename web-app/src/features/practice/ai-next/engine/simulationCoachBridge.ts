// simulationCoachBridge.ts
import type { BoardState, CardRoleProfile, RecommendationResult } from "../domain/types";
import { buildRecommendationFromRoleComplete } from "./recommendationEngine";
import { buildSimulationCoachingInsight, type StandardCardCandidate } from "./simulationCoachingEngine";
import type { DeckRoleSummary, OpeningSimulationRaw, RecommendationWithSimulation } from "./simulationCoachingTypes";

type HandCardLike = { instanceId?: string; name: string };

export type SimulationCoachBridgeParams = {
  board: BoardState;
  handCards: HandCardLike[];
  profiles: CardRoleProfile[];
  archetype?: string;
  simulation: OpeningSimulationRaw;
  deckRoleSummary?: DeckRoleSummary;
  standardCardPool?: StandardCardCandidate[];
};

export function buildRecommendationWithSimulation(
  params: SimulationCoachBridgeParams,
): RecommendationWithSimulation {
  const baseRecommendation: RecommendationResult = buildRecommendationFromRoleComplete({
    board: params.board,
    handCards: params.handCards,
    profiles: params.profiles,
    archetype: params.archetype,
  });

  const simulationCoaching = buildSimulationCoachingInsight({
    archetype: params.archetype,
    simulation: params.simulation,
    deckRoleSummary: params.deckRoleSummary,
    standardCardPool: params.standardCardPool ?? [],
  });

  return {
    baseRecommendation,
    simulationCoaching,
    version: "recommendation+simulation-coaching.v2",
  };
}
