import type { CardRoleProfile } from "../domain/types";

export type OpeningDeckCard = {
  id?: string;
  cardId?: string;
  name: string;
  type?: string;
  kinds?: string;
};

function isBasicPokemon(card: OpeningDeckCard): boolean {
  return card.type === "pokemon" && card.kinds === "basic";
}

function hasSupporter(cards: OpeningDeckCard[]): boolean {
  return cards.some((card) => card.type === "trainer" && card.kinds === "supporter");
}

function openingPrimitiveProgress(handProfiles: CardRoleProfile[]): number {
  let score = 0;
  for (const p of handProfiles) {
    if (p.staticRoles.includes("basic_search")) score += 0.20;
    if (p.staticRoles.includes("bench_setup")) score += 0.20;
    if (p.staticRoles.includes("pokemon_search")) score += 0.15;
    if (p.staticRoles.includes("draw")) score += 0.15;
    if (p.staticRoles.includes("hand_refresh")) score += 0.15;
    if (p.staticRoles.includes("topdeck_tutor")) score += 0.08;
    if (p.staticRoles.includes("energy_accel")) score += 0.10;
    if (p.staticRoles.includes("setup_cheat")) score += 0.08;
    if (p.staticRoles.includes("consistency")) score += 0.10;
  }
  return Math.min(score, 1);
}

function threshold(archetype: string): number {
  switch (archetype) {
    case "charizard_ex":
      return 68;
    case "dragapult_ex":
      return 66;
    case "gardevoir_ex":
      return 67;
    case "rocket_control":
      return 64;
    default:
      return 65;
  }
}

function openingScore(input: {
  hasBasic: boolean;
  benchCount: number;
  hasSupporter: boolean;
  hasDrawRole: boolean;
  hasSearchRole: boolean;
  hasEvolutionLine: boolean;
  primitiveProgress: number;
}): number {
  let score = 0;
  if (input.hasBasic) score += 25;
  score += Math.min(input.benchCount, 3) * 10;
  if (input.hasSupporter) score += 12;
  if (input.hasDrawRole) score += 10;
  if (input.hasSearchRole) score += 12;
  if (input.hasEvolutionLine) score += 8;
  score += input.primitiveProgress * 15;
  return Math.min(score, 100);
}

export function simulateOpeningMetrics(params: {
  deck: OpeningDeckCard[];
  profileMap: Map<string, CardRoleProfile>;
  archetype: string;
  iterations?: number;
}) {
  const iterations = params.iterations ?? 1000;
  let basicHits = 0;
  let supporterHits = 0;
  let setupHits = 0;

  for (let i = 0; i < iterations; i++) {
    const shuffled = [...params.deck]
      .map((card) => ({ card, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.card);

    const hand = shuffled.slice(0, 7);
    const handProfiles = hand
      .map((card) => params.profileMap.get(card.cardId ?? card.id ?? card.name))
      .filter(Boolean) as CardRoleProfile[];

    const hasBasic = hand.some(isBasicPokemon);
    const supporter = hasSupporter(hand);

    if (hasBasic) basicHits += 1;
    if (supporter) supporterHits += 1;

    const hasDrawRole = handProfiles.some((p) =>
      p.staticRoles.some((r) => ["draw", "hand_refresh", "topdeck_tutor"].includes(String(r))),
    );
    const hasSearchRole = handProfiles.some((p) =>
      p.staticRoles.some((r) => ["basic_search", "pokemon_search", "evolution_search", "bench_setup"].includes(String(r))),
    );
    const hasEvolutionLine = handProfiles.some((p) =>
      p.staticRoles.some((r) => ["evolution_search", "setup_cheat"].includes(String(r))),
    );

    const score = openingScore({
      hasBasic,
      benchCount: hand.filter(isBasicPokemon).slice(0, 3).length,
      hasSupporter: supporter,
      hasDrawRole,
      hasSearchRole,
      hasEvolutionLine,
      primitiveProgress: openingPrimitiveProgress(handProfiles),
    });

    if (score >= threshold(params.archetype)) setupHits += 1;
  }

  return {
    basicRate: basicHits / iterations,
    supporterRate: supporterHits / iterations,
    setupSuccessRate: setupHits / iterations,
  };
}
