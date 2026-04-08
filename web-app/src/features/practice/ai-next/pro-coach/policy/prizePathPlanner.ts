import type { CardRoleProfile } from "../../domain/types";
import type { CoachBoardFeatures, CoachGameState, PrizePlan, PrizeTargetStep } from "../types";

function ownPrizesRemaining(state: CoachGameState): number {
  return Math.max(0, 6 - state.players.player1.prizesTaken);
}

function inferPattern(remaining: number): number[] {
  if (remaining <= 1) return [1];
  if (remaining === 2) return [2];
  if (remaining === 3) return [2, 1];
  if (remaining === 4) return [2, 2];
  if (remaining === 5) return [2, 2, 1];
  return [2, 2, 2];
}

function buildTargetSequence(
  state: CoachGameState,
  pattern: number[],
): PrizeTargetStep[] {
  const oppActive = state.players.player2.active?.name ?? "相手のバトル場";
  const oppBench = state.players.player2.bench.map((c) => c.name);
  const targets: PrizeTargetStep[] = [];

  pattern.forEach((prizes, index) => {
    const fallback =
      prizes >= 2
        ? (oppBench.find((name) => /ex|V|ルール/.test(name)) ?? oppActive)
        : (oppBench[0] ?? oppActive);

    targets.push({
      targetName: fallback,
      prizes,
      isRequired: index === 0,
    });
  });

  return targets;
}

export function planPrizePath(
  features: CoachBoardFeatures,
  state: CoachGameState,
  profiles: CardRoleProfile[],
): PrizePlan {
  const remaining = ownPrizesRemaining(state);
  const pattern = inferPattern(remaining);
  const targetSequence = buildTargetSequence(state, pattern);

  const hasGust = profiles.some((p) => p.staticRoles.includes("gust"));
  const hasRecovery = profiles.some((p) => p.staticRoles.includes("recovery"));
  const successProbability = Math.max(
    18,
    Math.min(
      92,
      56
        + (features.activeCanAttack ? 10 : 0)
        + (features.hasSearchInHand ? 8 : 0)
        + (features.hasDrawInHand ? 6 : 0)
        + (hasGust ? 4 : 0)
        + (hasRecovery ? 2 : 0)
        - Math.round(features.safetyNeed * 0.16)
        - Math.round(features.setupNeed * 0.10),
    ),
  );

  const fragilityScore = Math.max(
    8,
    Math.min(
      96,
      28
        + (features.ownTwoPrizeExposed ? 22 : 0)
        + Math.round(features.safetyNeed * 0.18)
        + (features.ownBenchCount <= 1 ? 12 : 0)
        - (features.hasRecoveryInHand ? 8 : 0),
    ),
  );

  const estimatedTurnsToFinish = Math.max(
    1,
    Math.min(
      5,
      Math.ceil(remaining / Math.max(1, features.activeCanAttack ? 2 : 1)) +
        (features.activeEnergyReady ? 0 : 1),
    ),
  );

  return {
    id: `plan_${pattern.join("-")}`,
    pattern,
    targetSequence,
    estimatedTurnsToFinish,
    successProbability,
    fragilityScore,
  };
}
