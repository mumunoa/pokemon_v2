import type { CardRoleProfile } from "../domain/types";
import type { EffectCategory, EffectIntent, EffectSkeleton, EffectTargetType } from "./effectSpecTypes";

function inferCategory(profile?: CardRoleProfile): EffectCategory {
  const name = profile?.cardName ?? "";
  if (name.includes("エネルギー")) return "energy";
  if (profile?.staticRoles.includes("stadium_control")) return "stadium";
  return "item";
}

export function primitiveToEffectSkeleton(profile: CardRoleProfile): EffectSkeleton {
  const p = new Set(profile.primitives ?? []);
  const roles = profile.staticRoles;
  const intents: EffectIntent[] = [];
  const notes: string[] = [];
  let actionType: EffectSkeleton["actionType"] = "play_item";
  let targetType: EffectTargetType = "none";
  const boardImpact: EffectSkeleton["boardImpact"] = {};

  if (roles.includes("bench_setup")) intents.push("opening_setup", "bench_setup");
  if (roles.includes("draw")) intents.push("draw_stability");
  if (roles.includes("hand_refresh")) intents.push("hand_refresh");
  if (roles.includes("gust")) intents.push("gust_finisher");
  if (roles.includes("switch")) intents.push("switch_tempo");
  if (roles.includes("pivot")) intents.push("pivot");
  if (roles.includes("energy_accel")) intents.push("energy_accel");
  if (roles.includes("energy_recovery")) intents.push("energy_recovery");
  if (roles.includes("resource_recovery")) intents.push("resource_recovery");
  if (roles.includes("damage_boost")) intents.push("damage_push");
  if (roles.includes("stadium_control")) intents.push("stadium_control");
  if (roles.includes("board_expansion")) intents.push("board_expansion");
  if (roles.includes("disrupt") || roles.includes("stall")) intents.push("disrupt");
  if (roles.includes("survival")) intents.push("survival");
  if (roles.includes("consistency")) intents.push("consistency");
  if (roles.includes("setup_cheat")) intents.push("setup_cheat");
  if (roles.includes("ability_lock")) intents.push("ability_lock");
  if (roles.includes("item_lock")) intents.push("item_lock");

  if (p.has("search_deck_to_bench")) {
    actionType = "play_item";
    targetType = "deck_basic";
    boardImpact.benchDelta = 1;
    notes.push("山札から直接ベンチ展開。");
  } else if (p.has("search_basic_pokemon")) {
    actionType = "play_item";
    targetType = "deck_basic";
    notes.push("たねポケモンへアクセス。");
  } else if (p.has("search_any_pokemon") || p.has("search_pokemon_ex")) {
    actionType = "play_item";
    targetType = "deck_pokemon";
    notes.push("任意ポケモンへアクセス。");
  } else if (p.has("search_evolution_pokemon")) {
    actionType = "play_item";
    targetType = "deck_evolution";
    notes.push("進化ポケモンへアクセス。");
  }

  if (p.has("draw_cards")) {
    actionType = "play_supporter";
    boardImpact.handDelta = 2;
    notes.push("手札を増やす。");
  }
  if (p.has("refresh_hand")) {
    actionType = "play_supporter";
    boardImpact.handDelta = 1;
    boardImpact.disruptionPressure = roles.includes("disrupt") ? 1 : 0;
    notes.push("手札を引き直す。");
  }
  if (p.has("gust_opponent")) {
    actionType = "play_supporter";
    targetType = "opponent_bench";
    boardImpact.gust = true;
    boardImpact.prizePressure = 1;
    notes.push("相手ベンチを呼び出す。");
  }
  if (p.has("switch_self")) {
    actionType = "play_item";
    targetType = "self_pokemon";
    boardImpact.activeSwitch = true;
    notes.push("自分の盤面を入れ替える。");
  }
  if (p.has("attach_energy_from_deck") || p.has("attach_energy_from_hand") || p.has("attach_energy_from_discard")) {
    actionType = "use_ability";
    targetType = "self_pokemon";
    boardImpact.energyAttachDelta = 1;
    notes.push("通常テンポ以上のエネルギー供給。");
  }
  if (p.has("recover_energy_from_discard")) {
    targetType = "discard_energy";
    boardImpact.discardRecoveryDelta = 1;
    notes.push("トラッシュのエネルギー再利用。");
  }
  if (p.has("recover_pokemon_from_discard") || p.has("resource_loop")) {
    targetType = "discard_any";
    boardImpact.discardRecoveryDelta = 1;
    notes.push("トラッシュの重要札再利用。");
  }
  if (p.has("bench_expand")) {
    actionType = "play_stadium";
    boardImpact.boardExpansion = true;
    notes.push("ベンチ枠拡張。");
  }
  if (p.has("evolution_cheat")) {
    boardImpact.setupCheat = true;
    notes.push("通常より早い進化。");
  }

  return {
    source: "primitive",
    category: inferCategory(profile),
    actionType,
    targetType,
    primitives: profile.primitives ?? [],
    staticRoles: profile.staticRoles,
    intents: Array.from(new Set(intents)),
    boardImpact,
    notes,
  };
}
