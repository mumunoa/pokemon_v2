// simulationCoachSupabase.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StandardCardCandidate } from "./simulationCoachingEngine";

type StandardCardRow = {
  name: string;
  regulation: "standard" | "expanded";
  roles: string[] | null;
  priority_score: number | null;
};

export async function fetchStandardCoachingCardPool(
  supabase: SupabaseClient,
  wantedRoles: string[] = [],
  limit = 100,
): Promise<StandardCardCandidate[]> {
  let query = supabase
    .from("cards")
    .select("name, regulation, roles, priority_score")
    .eq("regulation", "standard")
    .limit(limit);

  if (wantedRoles.length > 0) {
    query = query.overlaps("roles", wantedRoles);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch standard coaching card pool: ${error.message}`);
  }

  const rows = (data ?? []) as StandardCardRow[];
  return rows.map((row) => ({
    cardName: row.name,
    regulation: row.regulation,
    roles: row.roles ?? [],
    priorityScore: row.priority_score ?? 0,
  }));
}
