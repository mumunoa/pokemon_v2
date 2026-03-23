import type { CardRoleProfile } from "../domain/types";
import type { EffectContext, EffectSpec } from "./effectSpecTypes";
import { primitiveToEffectSkeleton } from "./primitiveToEffectSkeleton";
import { MANUAL_EFFECT_OVERRIDES, getManualOverride } from "./manualOverrides";

function fromProfile(profile: CardRoleProfile): EffectSpec {
  const skeleton = primitiveToEffectSkeleton(profile);

  return {
    cardName: profile.cardName,
    category: skeleton.category,
    buildSkeleton: () => skeleton,
    priorityBase: 40 + (profile.staticRoles.length * 3) + ((profile.primitives?.length ?? 0) * 2),
    canPlay: (ctx: EffectContext) => {
      if (skeleton.actionType === "play_supporter" && ctx.supporterUsed) return false;
      if (skeleton.actionType === "attach_energy" && ctx.energyAttachedThisTurn) return false;
      if (skeleton.targetType === "deck_basic" && !ctx.hasFreeBenchSlot) return false;
      return true;
    },
    chooseTargets: () => [],
    explainWhyNow: (ctx: EffectContext) => {
      const notes = [...skeleton.notes];
      if (skeleton.intents.includes("opening_setup") && ctx.phase === "opening") notes.push("序盤の再現性に直結する。");
      if (skeleton.intents.includes("gust_finisher") && ctx.phase === "endgame") notes.push("終盤のサイド詰めで価値が高い。");
      if (skeleton.intents.includes("draw_stability") && ctx.drawNeed >= 60) notes.push("現在は手札補充が急務。");
      if (skeleton.intents.includes("bench_setup") && ctx.setupNeed >= 60) notes.push("現在は盤面形成が最優先。");
      return Array.from(new Set(notes)).slice(0, 4);
    },
  };
}

export function buildEffectSpecForCard(cardName: string, profile?: CardRoleProfile): EffectSpec | undefined {
  const manual = getManualOverride(cardName);
  if (manual) return manual;
  if (profile) return fromProfile(profile);
  return undefined;
}

export function buildEffectSpecCatalog(profiles: CardRoleProfile[]): Record<string, EffectSpec> {
  const catalog: Record<string, EffectSpec> = { ...MANUAL_EFFECT_OVERRIDES };
  for (const profile of profiles) {
    if (!catalog[profile.cardName]) catalog[profile.cardName] = fromProfile(profile);
  }
  return catalog;
}
