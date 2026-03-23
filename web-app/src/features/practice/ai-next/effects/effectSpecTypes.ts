import type { CardRoleProfile, EffectPrimitive, StaticRole } from "../domain/types";

export type EffectIntent =
  | "opening_setup"
  | "bench_setup"
  | "draw_stability"
  | "hand_refresh"
  | "gust_finisher"
  | "gust_system"
  | "gust_trap"
  | "switch_tempo"
  | "pivot"
  | "energy_accel"
  | "energy_recovery"
  | "resource_recovery"
  | "damage_push"
  | "stadium_control"
  | "board_expansion"
  | "disrupt"
  | "survival"
  | "consistency"
  | "setup_cheat"
  | "ability_lock"
  | "item_lock";

export type EffectCategory =
  | "pokemon"
  | "item"
  | "supporter"
  | "tool"
  | "stadium"
  | "energy"
  | "ace_spec";

export type EffectTargetType =
  | "none"
  | "self_active"
  | "self_bench"
  | "self_pokemon"
  | "opponent_active"
  | "opponent_bench"
  | "deck_basic"
  | "deck_pokemon"
  | "deck_evolution"
  | "deck_energy"
  | "discard_pokemon"
  | "discard_energy"
  | "discard_any";

export type EffectBoardImpact = {
  handDelta?: number;
  benchDelta?: number;
  activeSwitch?: boolean;
  gust?: boolean;
  energyAttachDelta?: number;
  discardRecoveryDelta?: number;
  prizePressure?: number;
  disruptionPressure?: number;
  boardExpansion?: boolean;
  setupCheat?: boolean;
};

export type EffectSkeleton = {
  source: "primitive" | "manual";
  category: EffectCategory;
  actionType:
    | "play_item"
    | "play_supporter"
    | "play_tool"
    | "play_stadium"
    | "attach_energy"
    | "use_ability"
    | "attack";
  targetType: EffectTargetType;
  primitives: EffectPrimitive[];
  staticRoles: StaticRole[];
  intents: EffectIntent[];
  boardImpact: EffectBoardImpact;
  notes: string[];
};

export type EffectTarget = {
  type: EffectTargetType;
  label: string;
  cardName?: string;
  cardId?: string;
};

export type EffectContext = {
  phase: "opening" | "midgame" | "endgame";
  setupNeed: number;
  drawNeed: number;
  gustNeed: number;
  safetyNeed: number;
  handSize: number;
  ownBenchCount: number;
  oppBenchCount: number;
  supporterUsed: boolean;
  energyAttachedThisTurn: boolean;
  hasFreeBenchSlot: boolean;
  opponentHasSystem: boolean;
  opponentHasHeavyRetreat: boolean;
  profile?: CardRoleProfile;
};

export type EffectSpec = {
  cardName: string;
  category: EffectCategory;
  buildSkeleton: (profile?: CardRoleProfile) => EffectSkeleton;
  priorityBase: number;
  canPlay?: (ctx: EffectContext) => boolean;
  chooseTargets?: (ctx: EffectContext) => EffectTarget[];
  explainWhyNow?: (ctx: EffectContext) => string[];
};
