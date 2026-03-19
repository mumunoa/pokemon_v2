import {
  StaticRole,
  RoleEvidence,
  RoleEvidenceSource,
  CardRoleProfile,
  SectionInferenceInput,
  EffectPrimitive,
  PrimitiveEvidence,
  RegressionSeed,
} from "../domain/types";
import {
  normalizeText,
  includesAny,
  includesAll,
  parseRetreatValue,
  uniqueItems,
} from "../utils/text";

type SectionInferenceResult = {
  roles: StaticRole[];
  evidence: RoleEvidence[];
  primitives: EffectPrimitive[];
  primitiveEvidence: PrimitiveEvidence[];
};

type CardLike = {
  id?: string;
  cardId?: string;
  name?: string;
  type?: string;
  kinds?: string;
  hp?: string | number;
  retreat?: string | number;
  evolvesTo?: string[];
};

type RescueRule = {
  roles: StaticRole[];
  reason: string;
  confidence: number;
};

export const ROLE_VERSION = "2026.03.18.primitive-layer.v2";

export function normalizeLegacyRoleToStaticRoles(role: string): StaticRole[] {
  switch (normalizeText(role)) {
    case "search":
      return ["consistency"];
    case "disrupt":
      return ["disrupt", "stall"];
    case "main_attacker":
      return ["main_attacker"];
    case "basic_pokemon":
      return ["basic_pokemon"];
    case "evolution_pokemon":
      return ["evolution_pokemon"];
    case "energy_search":
      return ["energy_search", "consistency"];
    case "key_item":
      return ["consistency"];
    case "two_prize":
      return [];
    default:
      return [];
  }
}

function addPrimitive(
  primitives: EffectPrimitive[],
  primitiveEvidence: PrimitiveEvidence[],
  primitive: EffectPrimitive,
  source: RoleEvidenceSource,
  matchedText: string,
  reason: string,
  confidence: number,
): void {
  primitives.push(primitive);
  primitiveEvidence.push({
    primitive,
    source,
    matchedText,
    reason,
    confidence,
  });
}

function addRole(
  roles: StaticRole[],
  evidence: RoleEvidence[],
  role: StaticRole,
  source: RoleEvidenceSource,
  matchedText: string,
  reason: string,
  confidence: number,
): void {
  roles.push(role);
  evidence.push({
    role,
    source,
    matchedText,
    reason,
    confidence,
  });
}

function inferPrimitivesFromText(
  text: string,
  source: RoleEvidenceSource,
): { primitives: EffectPrimitive[]; primitiveEvidence: PrimitiveEvidence[] } {
  const primitives: EffectPrimitive[] = [];
  const primitiveEvidence: PrimitiveEvidence[] = [];
  const normalized = normalizeText(text);

  if (includesAny(normalized, ["山札から"]) && includesAny(normalized, ["手札に加える", "手札にもどす", "持ってくる"])) {
    addPrimitive(primitives, primitiveEvidence, "search_deck_to_hand", source, text, "山札から手札への取得。", 0.98);
  }

  if (includesAny(normalized, ["山札から"]) && includesAny(normalized, ["ベンチに出す", "ベンチに置く"])) {
    addPrimitive(primitives, primitiveEvidence, "search_deck_to_bench", source, text, "山札から直接ベンチ展開。", 0.98);
  }

  if (includesAny(normalized, ["たねポケモン", "たねを", "hpが「70」以下", "hp70以下"])) {
    addPrimitive(primitives, primitiveEvidence, "search_basic_pokemon", source, text, "たねポケモン条件。", 0.97);
  }

  if (includesAny(normalized, ["進化ポケモン", "進化カード", "1進化", "2進化", "進化させる"])) {
    addPrimitive(primitives, primitiveEvidence, "search_evolution_pokemon", source, text, "進化ポケモン条件。", 0.96);
  }

  if (
    includesAny(normalized, ["ポケモンを", "ポケモンex", "ポケモン"]) &&
    includesAny(normalized, ["山札から"]) &&
    includesAny(normalized, ["手札に加える", "ベンチに出す", "選ぶ"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "search_any_pokemon", source, text, "ポケモン全般へのアクセス。", 0.9);
  }

  if (includesAny(normalized, ["ポケモンex", "exを"])) {
    addPrimitive(primitives, primitiveEvidence, "search_pokemon_ex", source, text, "ポケモンex条件。", 0.9);
  }

  if (includesAny(normalized, ["グッズ", "どうぐ"]) && includesAny(normalized, ["山札から", "手札に加える"])) {
    addPrimitive(primitives, primitiveEvidence, "search_item", source, text, "グッズ・どうぐへのアクセス。", 0.88);
  }

  if (includesAny(normalized, ["サポート"]) && includesAny(normalized, ["山札から", "手札に加える"])) {
    addPrimitive(primitives, primitiveEvidence, "search_supporter", source, text, "サポートへのアクセス。", 0.88);
  }

  if (includesAny(normalized, ["スタジアム"]) && includesAny(normalized, ["山札から", "手札に加える"])) {
    addPrimitive(primitives, primitiveEvidence, "search_stadium", source, text, "スタジアムへのアクセス。", 0.88);
  }

  if (includesAny(normalized, ["エネルギー"]) && includesAny(normalized, ["山札から", "手札に加える"])) {
    addPrimitive(primitives, primitiveEvidence, "search_energy", source, text, "エネルギーへのアクセス。", 0.9);
  }

  if (
    includesAny(normalized, ["引く", "枚まで引く", "枚になるように引く", "枚になるようにする", "山札の上から"]) &&
    includesAny(normalized, ["カード", "枚"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "draw_cards", source, text, "ドロー処理。", 0.97);
  }

  if (
    includesAny(normalized, ["手札をすべて", "手札を山札にもどし", "手札を切って", "手札をトラッシュし", "おたがいのプレイヤーはそれぞれ手札を"]) &&
    includesAny(normalized, ["引く", "枚になるように"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "refresh_hand", source, text, "手札更新処理。", 0.98);
  }

  if (
    includesAny(normalized, ["山札の上から", "山札の上にもどす", "山札の上に置く", "山札の上から2枚", "好きな順番"]) &&
    !includesAny(normalized, ["引く"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "topdeck_tutor", source, text, "山札トップ固定・順序操作。", 0.96);
  }

  if (
    includesAny(normalized, ["山札を見て", "手札を見て", "好きな順番", "のぞむなら", "山札を切る"]) &&
    !includesAny(normalized, ["ベンチに出す", "手札に加える"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "deck_fixing", source, text, "山札・手札の質調整。", 0.84);
  }

  if (
    includesAny(normalized, ["相手のベンチポケモン"]) &&
    includesAny(normalized, ["バトルポケモンと入れ替える", "バトル場に出す", "バトル場へ"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "gust_opponent", source, text, "相手ポケモンの強制呼び出し。", 0.99);
  }

  if (
    includesAny(normalized, ["自分のバトルポケモン", "自分のポケモン", "自分のバトル場"]) &&
    includesAny(normalized, ["ベンチポケモンと入れ替える", "入れ替える"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "switch_self", source, text, "自分側の入れ替え。", 0.98);
  }

  if (
    includesAny(normalized, ["エネルギーを"]) &&
    includesAny(normalized, ["つける", "付ける"]) &&
    includesAny(normalized, ["自分のポケモン", "このポケモン", "ベンチポケモン"])
  ) {
    if (includesAny(normalized, ["トラッシュから"])) {
      addPrimitive(primitives, primitiveEvidence, "attach_energy_from_discard", source, text, "トラッシュからのエネ加速。", 0.97);
    } else if (includesAny(normalized, ["山札から"])) {
      addPrimitive(primitives, primitiveEvidence, "attach_energy_from_deck", source, text, "山札からのエネ加速。", 0.97);
    } else {
      addPrimitive(primitives, primitiveEvidence, "attach_energy_from_hand", source, text, "手札などからのエネ加速。", 0.9);
    }
  }

  if (
    includesAny(normalized, ["トラッシュから"]) &&
    includesAny(normalized, ["ポケモン", "ポケモンカード"]) &&
    includesAny(normalized, ["手札に加える", "山札にもどす", "ベンチに出す"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "recover_pokemon_from_discard", source, text, "ポケモン再利用。", 0.95);
  }

  if (
    includesAny(normalized, ["トラッシュから"]) &&
    includesAny(normalized, ["エネルギー"]) &&
    includesAny(normalized, ["手札に加える", "山札にもどす", "つける"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "recover_energy_from_discard", source, text, "エネルギー再利用。", 0.95);
  }

  if (
    includesAny(normalized, ["エネルギーを"]) &&
    includesAny(normalized, ["トラッシュ", "はがす", "失わせる", "すべてなくなる"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "energy_denial", source, text, "エネルギー妨害。", 0.94);
  }

  if (
    includesAny(normalized, ["hpを", "回復", "ダメカンを"]) &&
    includesAny(normalized, ["回復", "とる", "のぞく"])
  ) {
    if (includesAny(normalized, ["ダメカン"])) {
      addPrimitive(primitives, primitiveEvidence, "remove_damage_counter", source, text, "ダメカン除去。", 0.95);
    } else {
      addPrimitive(primitives, primitiveEvidence, "heal_hp", source, text, "HP回復。", 0.95);
    }
  }

  if (includesAny(normalized, ["きぜつしない", "きぜつを防ぐ"])) {
    addPrimitive(primitives, primitiveEvidence, "prevent_knockout", source, text, "気絶回避。", 0.97);
  }

  if (includesAny(normalized, ["受けるワザのダメージ", "ダメージを受けない", "ダメージは", "ダメージを「-"])) {
    addPrimitive(primitives, primitiveEvidence, "reduce_damage_taken", source, text, "被ダメージ軽減。", 0.92);
  }

  if (includesAny(normalized, ["特性を使えない", "特性がなくなる", "特性はすべてなくなる"])) {
    addPrimitive(primitives, primitiveEvidence, "lock_ability", source, text, "特性ロック。", 0.99);
  }

  if (includesAny(normalized, ["グッズは使えない", "相手はグッズを使えない"])) {
    addPrimitive(primitives, primitiveEvidence, "lock_item", source, text, "グッズロック。", 0.99);
  }

  if (includesAny(normalized, ["にげられない", "逃げられない"])) {
    addPrimitive(primitives, primitiveEvidence, "trap_retreat", source, text, "逃げ封じ。", 0.96);
  }

  if (includesAny(normalized, ["逃げるためのエネルギーを", "にげるためのエネルギーを"]) && includesAny(normalized, ["多くなる", "+", "増える"])) {
    addPrimitive(primitives, primitiveEvidence, "increase_retreat_cost", source, text, "にげエネ増加。", 0.95);
  }

  if (includesAny(normalized, ["番を終える", "ワザが使えない"])) {
    addPrimitive(primitives, primitiveEvidence, "trap_retreat", source, text, "相手のテンポ制限。", 0.84);
  }

  if (
    includesAny(normalized, ["相手のポケモン全員", "ベンチポケモン全員", "それぞれに", "相手のポケモン全員に"]) &&
    includesAny(normalized, ["ダメージ", "ダメカン"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "spread_damage", source, text, "全体・複数面への干渉。", 0.95);
  }
  
  if (includesAny(normalized, ["サイドを", "多くとる", "サイドを1枚多く", "サイドを2枚多く"])) {
    addPrimitive(primitives, primitiveEvidence, "prize_swing", source, text, "サイド追加取得効果。", 0.99);
  }

  if (
    includesAny(normalized, ["相手のベンチポケモン", "ベンチポケモン1匹", "ベンチポケモンを1匹"]) &&
    includesAny(normalized, ["ダメージ", "ダメカン"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "snipe_bench", source, text, "ベンチ狙撃。", 0.96);
  }

  if (
    includesAny(normalized, ["このワザのダメージは", "追加で", "ダメージが「+", "ダメージを追加", "×", "倍になる"]) ||
    /\+\d+/.test(normalized)
  ) {
    addPrimitive(primitives, primitiveEvidence, "damage_modifier", source, text, "打点変動。", 0.9);
  }

  if (includesAny(normalized, ["ベンチは8匹まで", "ベンチの数は8匹", "ベンチを8匹"])) {
    addPrimitive(primitives, primitiveEvidence, "bench_expand", source, text, "ベンチ枠拡張。", 0.99);
  }

  if (includesAny(normalized, ["ベンチに出す", "ベンチに置く"]) && !includesAny(normalized, ["山札から"])) {
    addPrimitive(primitives, primitiveEvidence, "bench_fill", source, text, "手札などからのベンチ補充。", 0.82);
  }

  if (
    includesAny(normalized, ["進化させる", "そのポケモンの上にのせる", "出したばかり", "この番に出した"]) &&
    includesAny(normalized, ["この番", "ただちに", "そのまま", "進化してよい", "進化できる"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "evolution_cheat", source, text, "通常テンポを超える進化。", 0.98);
  }

  if (
    includesAny(normalized, ["トラッシュから", "手札にもどす", "山札にもどす"]) &&
    includesAny(normalized, ["グッズ", "サポート", "スタジアム", "カード"])
  ) {
    addPrimitive(primitives, primitiveEvidence, "resource_loop", source, text, "汎用リソースの回収。", 0.86);
  }

  if (includesAny(normalized, ["コイン", "オモテ", "ウラ"])) {
    addPrimitive(primitives, primitiveEvidence, "coin_flip_conditional", source, text, "コイントス条件付き。", 0.8);
  }

  return {
    primitives: uniqueItems(primitives),
    primitiveEvidence,
  };
}

function mapPrimitivesToRoles(
  primitives: EffectPrimitive[],
  source: RoleEvidenceSource,
  text: string,
): { roles: StaticRole[]; evidence: RoleEvidence[] } {
  const roles: StaticRole[] = [];
  const evidence: RoleEvidence[] = [];

  const add = (role: StaticRole, reason: string, confidence: number) => {
    addRole(roles, evidence, role, source, text, reason, confidence);
  };

  if (primitives.includes("search_basic_pokemon")) add("basic_search", "たねポケモンへのアクセス。", 0.97);
  if (primitives.includes("search_evolution_pokemon")) add("evolution_search", "進化ラインへのアクセス。", 0.97);
  if (primitives.includes("search_any_pokemon")) add("pokemon_search", "ポケモン全般へのアクセス。", 0.95);
  if (primitives.includes("search_pokemon_ex")) add("pokemon_ex_search", "ポケモンexへのアクセス。", 0.93);
  if (primitives.includes("search_item")) add("item_search", "グッズ・どうぐへのアクセス。", 0.9);
  if (primitives.includes("search_supporter")) add("supporter_search", "サポートへのアクセス。", 0.9);
  if (primitives.includes("search_stadium")) add("stadium_search", "スタジアムへのアクセス。", 0.9);
  if (primitives.includes("search_energy")) add("energy_search", "エネルギーへのアクセス。", 0.92);

  if (primitives.includes("search_deck_to_bench") || primitives.includes("bench_fill") || primitives.includes("bench_expand")) {
    add("bench_setup", "盤面のベンチ形成を前進させる。", 0.95);
  }

  if (primitives.includes("draw_cards")) add("draw", "純ドロー効果。", 0.96);
  if (primitives.includes("refresh_hand")) add("hand_refresh", "手札を掘り直す更新効果。", 0.98);
  if (primitives.includes("topdeck_tutor")) add("topdeck_tutor", "山札上固定・順序操作。", 0.98);

  if (primitives.includes("gust_opponent")) add("gust", "相手を呼び出して盤面を動かす。", 0.99);
  if (primitives.includes("switch_self")) add("switch", "自分側の入れ替え。", 0.98);

  if (
    primitives.includes("attach_energy_from_hand") ||
    primitives.includes("attach_energy_from_discard") ||
    primitives.includes("attach_energy_from_deck")
  ) {
    add("energy_accel", "エネルギーを前倒しで供給する。", 0.96);
  }

  if (primitives.includes("recover_energy_from_discard") || primitives.includes("search_energy")) {
    add("energy_recovery", "エネルギーを回収・再利用する。", 0.93);
  }

  if (primitives.includes("energy_denial")) add("energy_denial", "相手のエネルギー計画を崩す。", 0.94);

  if (primitives.includes("heal_hp") || primitives.includes("remove_damage_counter")) {
    add("recovery", "回復で盤面を立て直す。", 0.93);
  }

  if (primitives.includes("recover_pokemon_from_discard") || primitives.includes("resource_loop")) {
    add("resource_recovery", "ポケモンや汎用札を再利用する。", 0.9);
  }

  if (primitives.includes("prevent_knockout") || primitives.includes("reduce_damage_taken")) {
    add("survival", "耐久ラインを上げる。", 0.92);
  }

  if (primitives.includes("lock_item") || primitives.includes("lock_ability") || primitives.includes("trap_retreat") || primitives.includes("increase_retreat_cost")) {
    add("stall", "相手の行動速度を落とす。", 0.9);
    add("disrupt", "相手のテンポ・行動を阻害する。", 0.88);
  }

  if (primitives.includes("spread_damage")) add("spread", "複数面に干渉する。", 0.95);
  if (primitives.includes("snipe_bench")) add("snipe", "狙ったベンチへ干渉する。", 0.96);
  if (primitives.includes("damage_modifier")) add("damage_boost", "条件付きで打点を伸ばす。", 0.9);
  if (primitives.includes("lock_ability")) add("ability_lock", "特性ロック。", 0.99);
  if (primitives.includes("lock_item")) add("item_lock", "グッズロック。", 0.99);
  if (primitives.includes("evolution_cheat")) add("setup_cheat", "通常進行より早い進化。", 0.99);
  if (primitives.includes("bench_expand")) add("board_expansion", "盤面枠を広げる。", 0.99);
  if (primitives.includes("bench_expand") || primitives.includes("increase_retreat_cost")) add("stadium_control", "スタジアム由来の盤面制御。", 0.84);

  if (primitives.includes("prize_swing")) {
    add("main_attacker", "サイドレースを有利にする強力なアタッカー。", 0.95);
  }

  const consistencyPrimitives: EffectPrimitive[] = [
    "search_deck_to_hand",
    "search_deck_to_bench",
    "search_any_pokemon",
    "search_basic_pokemon",
    "search_evolution_pokemon",
    "search_pokemon_ex",
    "search_item",
    "search_supporter",
    "search_stadium",
    "search_energy",
    "draw_cards",
    "refresh_hand",
    "topdeck_tutor",
    "deck_fixing",
    "resource_loop",
  ];

  if (primitives.some((primitive) => consistencyPrimitives.includes(primitive))) {
    add("consistency", "必要札到達率を高める。", 0.86);
  }

  return {
    roles: uniqueItems(roles),
    evidence,
  };
}

function inferBySource(text: string, source: RoleEvidenceSource): SectionInferenceResult {
  const { primitives, primitiveEvidence } = inferPrimitivesFromText(text, source);
  const mapped = mapPrimitivesToRoles(primitives, source, text);

  const roles = [...mapped.roles];
  const evidence = [...mapped.evidence];

  if (source === "ability") {
    if (
      includesAny(text, ["自分の番に1回", "1回使える", "自分の番ごとに"]) &&
      primitives.includes("draw_cards")
    ) {
      addRole(roles, evidence, "draw", "ability", text, "特性による継続ドローエンジン。", 0.99);
      addRole(roles, evidence, "consistency", "ability", text, "毎ターン再現性を底上げする特性。", 0.97);
    }

    if (
      includesAny(text, ["自分の番に1回", "1回使える"]) &&
      (primitives.includes("search_deck_to_hand") || primitives.includes("search_deck_to_bench"))
    ) {
      addRole(roles, evidence, "consistency", "ability", text, "毎ターンの到達率を高める特性。", 0.96);
    }
  }

  if (source === "support") {
    if (primitives.includes("refresh_hand")) {
      addRole(roles, evidence, "draw", "support", text, "手札更新を伴うサポート補充。", 0.93);
    }

    if (primitives.includes("coin_flip_conditional") && primitives.includes("search_any_pokemon")) {
      addRole(roles, evidence, "consistency", "support", text, "確率付きサーチでも一定の再現性補助。", 0.77);
    }
  }

  if (source === "attack") {
    if (includesAny(text, ["どく", "まひ", "こんらん", "ねむり", "やけど"])) {
      addRole(roles, evidence, "stall", "attack", text, "特殊状態による妨害。", 0.82);
    }
  }

  return {
    roles: uniqueItems(roles),
    evidence,
    primitives,
    primitiveEvidence,
  };
}

const CARD_RESCUE_RULES: Record<string, RescueRule[]> = {
  [normalizeText("ふしぎなアメ")]: [
    { roles: ["evolution_search", "setup_cheat", "consistency"], reason: "2進化を前倒しする代表カード。", confidence: 0.99 },
  ],
  [normalizeText("ジャッジマン")]: [
    { roles: ["hand_refresh", "stall", "disrupt", "consistency"], reason: "手札更新と相手干渉を兼ねる。", confidence: 0.99 },
  ],
  [normalizeText("モンスターボール")]: [
    { roles: ["pokemon_search", "consistency"], reason: "条件付きのポケモンサーチ。", confidence: 0.82 },
  ],
  [normalizeText("きずぐすり")]: [
    { roles: ["recovery", "survival"], reason: "HP回復で耐久ラインをずらす。", confidence: 0.99 },
  ],
  [normalizeText("ハイパーボール")]: [
    { roles: ["pokemon_search", "consistency"], reason: "本来は汎用ポケモンサーチ。", confidence: 0.97 },
  ],
  [normalizeText("夜のタンカ")]: [
    { roles: ["resource_recovery", "energy_recovery", "consistency"], reason: "ポケモン・基本エネルギーの再利用。", confidence: 0.97 },
  ],
  [normalizeText("暗号マニアの解読")]: [
    { roles: ["topdeck_tutor", "consistency"], reason: "山札上固定によるトップデッキ調整。", confidence: 0.99 },
  ],
  [normalizeText("ポケパッド")]: [
    { roles: ["resource_recovery", "consistency"], reason: "サポート再利用で中長期の再現性を高める。", confidence: 0.92 },
  ],
  [normalizeText("シークレットボックス")]: [
    { roles: ["item_search", "supporter_search", "stadium_search", "energy_search", "consistency"], reason: "複数カテゴリへアクセスするACE SPEC系の万能安定札。", confidence: 0.95 },
  ],
  [normalizeText("むしとりセット")]: [
    { roles: ["basic_search", "bench_setup", "consistency"], reason: "虫系・たね展開の初動補助。", confidence: 0.72 },
  ],
  [normalizeText("ゼロの大空洞")]: [
    { roles: ["bench_setup", "board_expansion", "stadium_control", "consistency"], reason: "ベンチ枠拡張による盤面形成補助。", confidence: 0.99 },
  ],
  [normalizeText("ロケット団の監視塔")]: [
    { roles: ["stall", "disrupt", "stadium_control"], reason: "盤面制約・テンポ阻害寄りのスタジアム。", confidence: 0.78 },
  ],
  [normalizeText("活力の森")]: [
    { roles: ["consistency", "stadium_control"], reason: "継続的なゲームプラン補助スタジアム。", confidence: 0.74 },
  ],
  [normalizeText("たけしのスカウト")]: [
    { roles: ["basic_search", "evolution_search", "consistency"], reason: "たね・進化の柔軟サーチ。", confidence: 0.9 },
  ],
  [normalizeText("シアノ")]: [
    { roles: ["pokemon_ex_search", "consistency"], reason: "ポケモンexへのアクセス。", confidence: 0.9 },
  ],
  [normalizeText("アカマツ")]: [
    { roles: ["consistency"], reason: "引き込み・計画補助寄りのサポート。", confidence: 0.7 },
  ],
  [normalizeText("リーリエの決心")]: [
    { roles: ["hand_refresh", "draw", "consistency"], reason: "手札更新型のサポート。", confidence: 0.9 },
  ],
  [normalizeText("ヒカリ")]: [
    { roles: ["energy_accel", "consistency"], reason: "エネルギー運用を補助。", confidence: 0.72 },
  ],
};

export const ROLE_REGRESSION_SEEDS: RegressionSeed[] = [
  {
    name: "ふしぎなアメ",
    source: "support",
    text: "自分の「進化していないポケモン」を1匹選び、そのポケモンから進化する「1進化カード」、またはその上の「2進化カード」を、自分の手札から1枚選ぶ。その後、選んだ「進化カード」をそのポケモンの上にのせ、進化させる。",
    expectedRoles: ["evolution_search", "setup_cheat", "consistency"],
  },
  {
    name: "ジャッジマン",
    source: "support",
    text: "おたがいのプレイヤーはそれぞれ手札を山札にもどして切る。その後、それぞれ4枚引く。",
    expectedRoles: ["hand_refresh", "draw", "stall", "disrupt", "consistency"],
  },
  {
    name: "モンスターボール",
    source: "support",
    text: "コインを1回投げオモテなら、自分の山札からポケモンを1枚選び、相手に見せて、手札に加える。そして山札を切る。",
    expectedRoles: ["pokemon_search", "consistency"],
  },
  {
    name: "きずぐすり",
    source: "support",
    text: "自分のポケモン1匹のHPを「30」回復する。",
    expectedRoles: ["recovery", "survival"],
  },
  {
    name: "ハイパーボール",
    source: "support",
    text: "このカードは, 自分の手札を2枚トラッシュしなければ使えない。自分の山札からポケモンを1枚選び、相手に見せて、手札に加える。そして山札を切る。",
    expectedRoles: ["pokemon_search", "consistency"],
  },
  {
    name: "夜のタンカ",
    source: "support",
    text: "自分のトラッシュから「ポケモン」または「基本エネルギー」を1枚選び、相手に見せて、手札に加える。",
    expectedRoles: ["resource_recovery", "energy_recovery", "consistency"],
  },
  {
    name: "暗号マニアの解読",
    source: "support",
    text: "自分の山札から好きなカードを2枚選ぶ。選んだカードを好きな順番で山札の上にもどす。そして山札を切る。",
    expectedRoles: ["topdeck_tutor", "consistency"],
  },
  {
    name: "ゼロの大空洞",
    source: "rule",
    text: "おたがいのプレイヤーは、自分のベンチにポケモンを8匹まで出せる。",
    expectedRoles: ["bench_setup", "board_expansion", "stadium_control", "consistency"],
  },
];

export function inferRolesFromSection(input: SectionInferenceInput): SectionInferenceResult {
  return inferBySource(input.text ?? "", input.source);
}

export function createRoleProfile(card: CardLike, sections: SectionInferenceInput[]): CardRoleProfile {
  const allRoles: StaticRole[] = [];
  const allEvidence: RoleEvidence[] = [];
  const allPrimitives: EffectPrimitive[] = [];
  const allPrimitiveEvidence: PrimitiveEvidence[] = [];

  for (const section of sections) {
    const result = inferRolesFromSection(section);
    allRoles.push(...result.roles);
    allEvidence.push(...result.evidence);
    allPrimitives.push(...result.primitives);
    allPrimitiveEvidence.push(...result.primitiveEvidence);
  }

  const normalizedName = normalizeText(card.name ?? "");
  const rescueRules = CARD_RESCUE_RULES[normalizedName] ?? [];
  for (const rescue of rescueRules) {
    for (const role of rescue.roles) {
      addRole(allRoles, allEvidence, role, "heuristic", card.name ?? "", rescue.reason, rescue.confidence);
    }
  }

  if (normalizeText(card.type ?? "") === "pokemon") {
    const retreatValue = parseRetreatValue(card.retreat);
    if (retreatValue !== null && retreatValue <= 1) {
      addRole(allRoles, allEvidence, "pivot", "heuristic", `retreat=${retreatValue}`, "にげるエネルギーが軽く、ピボット適性が高い。", 0.88);
    }
  }

  // 進化先の重要度（ドラパルトex等）を考慮した重み付け (ISSUE-011強化)
  const masterEvolutionMeta = ["ドラパルトex", "リザードンex", "ルギアVSTAR", "サーナイトex", "パオジアンex"];
  if (card.evolvesTo?.some(e => masterEvolutionMeta.includes(e))) {
    addRole(allRoles, allEvidence, "consistency", "meta_evolution", "トップティアへの進化。", "強力なアタッカーへの進化元として重要度が極めて高い。", 0.99);
    addRole(allRoles, allEvidence, "bench_setup", "meta_evolution", "トップティアへの進化。", "優先的にベンチに用意すべき進化元。", 0.9);
  }
  
  // 高打点・高HPアタッカー判定
  const hpValue = typeof card.hp === 'number' ? card.hp : parseInt(String(card.hp || '0'));
  if (hpValue >= 280 || (hpValue >= 200 && (card.kinds?.includes('ex') || card.kinds?.includes('has_rule')))) {
    addRole(allRoles, allEvidence, "main_attacker", "attribute", `hp=${hpValue}`, "高いHP・耐久性能を持つメインアタッカー候補。", 0.85);
  }

  const mergedText = sections.map((section) => section.text ?? "").join("\n");
  if (includesAny(mergedText, ["スタジアム"]) && includesAny(mergedText, ["ベンチは8匹まで", "ベンチの数は8匹"])) {
    addRole(allRoles, allEvidence, "bench_setup", "heuristic", mergedText, "ベンチ枠拡張スタジアム。", 0.98);
    addRole(allRoles, allEvidence, "board_expansion", "heuristic", mergedText, "ベンチ枠そのものを広げる。", 0.98);
    addRole(allRoles, allEvidence, "stadium_control", "heuristic", mergedText, "スタジアム由来の盤面制御。", 0.9);
    addRole(allRoles, allEvidence, "consistency", "heuristic", mergedText, "ベンチ枠が広がり再現性が上がる。", 0.9);
  }

  if (includesAny(mergedText, ["逃げるためのエネルギーを", "にげるためのエネルギーを"]) && includesAny(mergedText, ["多くなる", "増える", "+"])) {
    addRole(allRoles, allEvidence, "stall", "heuristic", mergedText, "にげエネ干渉スタジアム。", 0.95);
    addRole(allRoles, allEvidence, "disrupt", "heuristic", mergedText, "相手の退避ラインを崩す。", 0.9);
    addRole(allRoles, allEvidence, "stadium_control", "heuristic", mergedText, "スタジアム由来のテンポ干渉。", 0.9);
  }

  const staticRoles = uniqueItems(allRoles);
  const reasons = uniqueItems(allEvidence.map((item) => item.reason));
  const confidence =
    allEvidence.length > 0
      ? allEvidence.reduce((sum, item) => sum + item.confidence, 0) / allEvidence.length
      : 0.5;

  return {
    cardId: card.id || card.cardId || "unknown",
    cardName: card.name || "unknown",
    staticRoles,
    deckRoles: [],
    dynamicRoles: [],
    keyScore: 0,
    labels: staticRoles,
    reasons,
    confidence,
    evidence: allEvidence,
    primitives: uniqueItems(allPrimitives),
    primitiveEvidence: allPrimitiveEvidence,
    inferredAt: new Date().toISOString(),
    version: ROLE_VERSION,
  };
}
