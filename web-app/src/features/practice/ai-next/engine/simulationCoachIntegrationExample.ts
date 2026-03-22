// simulationCoachIntegrationExample.ts
import type { BoardState, CardRoleProfile } from "../domain/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRecommendationWithSimulation } from "./simulationCoachBridge";
import { fetchStandardCoachingCardPool } from "./simulationCoachSupabase";
import type { DeckRoleSummary, OpeningSimulationRaw, RecommendationWithSimulation } from "./simulationCoachingTypes";

type HandCardLike = { instanceId?: string; name: string };

export type BuildProRecommendationPipelineParams = {
  supabase: SupabaseClient;
  board: BoardState;
  handCards: HandCardLike[];
  profiles: CardRoleProfile[];
  archetype?: string;
  simulation: OpeningSimulationRaw;
  deckRoleSummary?: DeckRoleSummary;
};

export async function buildProRecommendationPipeline(
  params: BuildProRecommendationPipelineParams,
): Promise<RecommendationWithSimulation> {
  const standardCardPool = await fetchStandardCoachingCardPool(
    params.supabase,
    [
      "seed_search_item",
      "bench_setup",
      "draw_support",
      "search_support",
      "search_item",
      "energy_search_item",
      "basic_energy",
      "matchup_tool",
    ],
    120,
  );

  return buildRecommendationWithSimulation({
    board: params.board,
    handCards: params.handCards,
    profiles: params.profiles,
    archetype: params.archetype,
    simulation: params.simulation,
    deckRoleSummary: params.deckRoleSummary,
    standardCardPool,
  });
}
