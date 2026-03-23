import type { EffectContext, EffectSkeleton, EffectTarget, EffectSpec } from "./effectSpecTypes";

function none(): EffectTarget[] {
  return [];
}

function opponentBenchTargets(ctx: EffectContext): EffectTarget[] {
  return ctx.oppBenchCount > 0 ? [{ type: "opponent_bench", label: "相手ベンチ1体" }] : [];
}

function selfPokemonTargets(ctx: EffectContext): EffectTarget[] {
  return ctx.ownBenchCount > 0 ? [{ type: "self_pokemon", label: "自分のポケモン1体" }] : [{ type: "self_active", label: "バトルポケモン" }];
}

function base(
  cardName: string,
  skeleton: EffectSkeleton,
  priorityBase: number,
  canPlay?: EffectSpec["canPlay"],
  chooseTargets?: EffectSpec["chooseTargets"],
  explainWhyNow?: EffectSpec["explainWhyNow"],
): EffectSpec {
  return {
    cardName,
    category: skeleton.category,
    buildSkeleton: () => skeleton,
    priorityBase,
    canPlay,
    chooseTargets,
    explainWhyNow,
  };
}

export const MANUAL_EFFECT_OVERRIDES: Record<string, EffectSpec> = {
  "なかよしポフィン": base("なかよしポフィン", {
    source: "manual", category: "item", actionType: "play_item", targetType: "deck_basic",
    primitives: ["search_basic_pokemon", "search_deck_to_bench"], staticRoles: ["basic_search", "bench_setup", "consistency"],
    intents: ["opening_setup", "bench_setup", "consistency"], boardImpact: { benchDelta: 2 }, notes: ["HP条件付きだが、序盤の最大展開札。"],
  }, 96, (ctx)=>ctx.hasFreeBenchSlot, ()=>[{ type:"deck_basic", label:"HP条件つきたねポケモン最大2体"}], (ctx)=>["序盤のベンチ形成を一気に進められる。", ctx.setupNeed >= 60 ? "現在は盤面形成優先の局面。" : "序盤の再現性を底上げする。"]),
  "ネストボール": base("ネストボール", {
    source: "manual", category: "item", actionType: "play_item", targetType: "deck_basic",
    primitives: ["search_basic_pokemon", "search_deck_to_bench"], staticRoles: ["basic_search", "bench_setup", "consistency"],
    intents: ["opening_setup", "bench_setup", "consistency"], boardImpact: { benchDelta: 1 }, notes: ["たねを直接ベンチに置く標準展開札。"],
  }, 90, (ctx)=>ctx.hasFreeBenchSlot, ()=>[{ type:"deck_basic", label:"たねポケモン1体"}], ()=>["直接ベンチへ置けるので、初動安定に直結する。"]),
  "ハイパーボール": base("ハイパーボール", {
    source: "manual", category: "item", actionType: "play_item", targetType: "deck_pokemon",
    primitives: ["search_any_pokemon"], staticRoles: ["pokemon_search", "consistency"],
    intents: ["consistency", "opening_setup"], boardImpact: {}, notes: ["手札コストは重いが、任意ポケモンへ触れる。"],
  }, 84, (ctx)=>ctx.handSize >= 3, ()=>[{ type:"deck_pokemon", label:"任意のポケモン1枚"}], ()=>["必要札への到達率が高い。", "ただし手札コスト管理が必要。"]),
  "ふしぎなアメ": base("ふしぎなアメ", {
    source: "manual", category: "item", actionType: "play_item", targetType: "self_pokemon",
    primitives: ["evolution_cheat"], staticRoles: ["setup_cheat", "evolution_search", "consistency"],
    intents: ["setup_cheat", "opening_setup", "consistency"], boardImpact: { setupCheat: true }, notes: ["Stage2 デッキの速度を一段引き上げる。"],
  }, 88, (ctx)=>ctx.phase !== "endgame", selfPokemonTargets, ()=>["通常進化の1ターンを短縮できる。", "Stage2 プランで最重要級。"]),
  "ポケパッド": base("ポケパッド", {
    source: "manual", category: "item", actionType: "play_item", targetType: "discard_any",
    primitives: ["resource_loop"], staticRoles: ["resource_recovery", "consistency"],
    intents: ["resource_recovery", "consistency"], boardImpact: { discardRecoveryDelta: 2 }, notes: ["サポート再利用による長期戦安定。"],
  }, 66, ()=>true, ()=>[{ type:"discard_any", label:"トラッシュのサポート最大2枚"}], ()=>["終盤のサポート密度を高められる。"]),
  "夜のタンカ": base("夜のタンカ", {
    source: "manual", category: "item", actionType: "play_item", targetType: "discard_any",
    primitives: ["recover_pokemon_from_discard", "recover_energy_from_discard"], staticRoles: ["resource_recovery", "energy_recovery", "consistency"],
    intents: ["resource_recovery", "energy_recovery", "consistency"], boardImpact: { discardRecoveryDelta: 1 }, notes: ["ポケモン/基本エネルギーの柔軟回収。"],
  }, 78, ()=>true, ()=>[{ type:"discard_any", label:"トラッシュのポケモン or 基本エネルギー1枚"}], ()=>["次の攻撃役やエネルギーラインを戻せる。"]),
  "ポケモンいれかえ": base("ポケモンいれかえ", {
    source: "manual", category: "item", actionType: "play_item", targetType: "self_pokemon",
    primitives: ["switch_self"], staticRoles: ["switch", "pivot"], intents: ["switch_tempo", "pivot"],
    boardImpact: { activeSwitch: true }, notes: ["にげエネを使わずテンポを維持する。"],
  }, 72, (ctx)=>ctx.ownBenchCount > 0, selfPokemonTargets, ()=>["アクティブ固定を解除してテンポを戻せる。"]),
  "エネルギーつけかえ": base("エネルギーつけかえ", {
    source: "manual", category: "item", actionType: "play_item", targetType: "self_pokemon",
    primitives: ["attach_energy_from_hand"], staticRoles: ["energy_accel", "consistency"], intents: ["energy_accel", "consistency"],
    boardImpact: { energyAttachDelta: 1 }, notes: ["実質的な攻撃準備短縮。"],
  }, 70, ()=>true, selfPokemonTargets, ()=>["アタッカー切り替えと同時に打点準備を進められる。"]),
  "エネルギー回収": base("エネルギー回収", {
    source: "manual", category: "item", actionType: "play_item", targetType: "discard_energy",
    primitives: ["recover_energy_from_discard"], staticRoles: ["energy_recovery", "consistency"], intents: ["energy_recovery", "consistency"],
    boardImpact: { discardRecoveryDelta: 2 }, notes: ["トラッシュの基本エネルギー回収。"],
  }, 58, ()=>true, ()=>[{ type:"discard_energy", label:"基本エネルギー最大2枚"}], ()=>["エネルギーラインを再構築できる。"]),
  "ガラスのラッパ": base("ガラスのラッパ", {
    source: "manual", category: "item", actionType: "play_item", targetType: "self_bench",
    primitives: ["attach_energy_from_hand"], staticRoles: ["energy_accel", "consistency"], intents: ["energy_accel", "consistency"],
    boardImpact: { energyAttachDelta: 1 }, notes: ["対象条件付きのエネ加速。"],
  }, 62, ()=>true, ()=>[{ type:"self_bench", label:"条件を満たすベンチポケモン"}], ()=>["ベンチアタッカーの立ち上がりを早める。"]),
  "ダークボール": base("ダークボール", {
    source: "manual", category: "item", actionType: "play_item", targetType: "deck_pokemon",
    primitives: ["search_any_pokemon"], staticRoles: ["pokemon_search", "consistency"], intents: ["consistency", "opening_setup"],
    boardImpact: {}, notes: ["条件付きポケモンサーチ。"],
  }, 64, ()=>true, ()=>[{ type:"deck_pokemon", label:"条件に合うポケモン1枚"}], ()=>["条件に合うデッキでは初動安定に寄与する。"]),
  "ポケギア3.0": base("ポケギア3.0", {
    source: "manual", category: "item", actionType: "play_item", targetType: "deck_pokemon",
    primitives: ["search_supporter"], staticRoles: ["supporter_search", "consistency"], intents: ["consistency", "draw_stability"],
    boardImpact: {}, notes: ["サポート到達率を上げる。"],
  }, 68, ()=>true, none, ()=>["サポートへアクセスしてターンの質を上げる。"]),
  "シークレットボックス": base("シークレットボックス", {
    source: "manual", category: "ace_spec", actionType: "play_item", targetType: "none",
    primitives: ["search_item", "search_supporter", "search_stadium", "search_energy"], staticRoles: ["item_search", "supporter_search", "stadium_search", "energy_search", "consistency"],
    intents: ["consistency", "opening_setup", "resource_recovery"], boardImpact: {}, notes: ["複数カテゴリへ一気に触れるACE SPEC。"],
  }, 92, ()=>true, none, ()=>["1枚で複数の要求を満たせるため、局面解像度が高い。"]),
  "アンフェアスタンプ": base("アンフェアスタンプ", {
    source: "manual", category: "ace_spec", actionType: "play_item", targetType: "none",
    primitives: ["refresh_hand"], staticRoles: ["hand_refresh", "disrupt", "stall", "consistency"], intents: ["hand_refresh", "disrupt", "consistency"],
    boardImpact: { disruptionPressure: 2 }, notes: ["終盤の要求値上げが非常に強い。"],
  }, 86, ()=>true, none, (ctx)=>[ctx.phase === "endgame" ? "終盤の逆転・詰めで非常に強力。" : "中盤以降の手札干渉として有効。"]),
  "プライムキャッチャー": base("プライムキャッチャー", {
    source: "manual", category: "ace_spec", actionType: "play_item", targetType: "opponent_bench",
    primitives: ["gust_opponent", "switch_self"], staticRoles: ["gust", "switch", "consistency"], intents: ["gust_finisher", "switch_tempo", "consistency"],
    boardImpact: { gust: true, activeSwitch: true, prizePressure: 1 }, notes: ["呼び出しと入れ替えを同時に行う最上級テンポ札。"],
  }, 98, (ctx)=>ctx.oppBenchCount > 0, opponentBenchTargets, ()=>["相手盤面を崩しながら自分の攻撃役も整えられる。"]),
  "ボスの指令": base("ボスの指令", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "opponent_bench",
    primitives: ["gust_opponent"], staticRoles: ["gust", "consistency"], intents: ["gust_finisher", "gust_system", "gust_trap"],
    boardImpact: { gust: true, prizePressure: 1 }, notes: ["詰め・システム狩り・縛りの3役を持つ。"],
  }, 95, (ctx)=>!ctx.supporterUsed && ctx.oppBenchCount > 0, opponentBenchTargets, (ctx)=>[ctx.phase === "endgame" ? "終盤のサイド詰め札として最重要。" : "システム狩りや縛りでも高価値。"]),
  "リーリエの決心": base("リーリエの決心", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["draw_cards", "refresh_hand"], staticRoles: ["draw", "hand_refresh", "consistency"], intents: ["draw_stability", "hand_refresh", "consistency"],
    boardImpact: { handDelta: 2 }, notes: ["事故緩和と必要札到達を兼ねる。"],
  }, 82, (ctx)=>!ctx.supporterUsed, none, ()=>["必要札への到達率を引き上げる。"]),
  "トウコ": base("トウコ", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "deck_pokemon",
    primitives: ["search_any_pokemon"], staticRoles: ["pokemon_search", "consistency"], intents: ["consistency", "opening_setup"],
    boardImpact: {}, notes: ["目的ポケモンへ直結するサポート。"],
  }, 78, (ctx)=>!ctx.supporterUsed, ()=>[{ type:"deck_pokemon", label:"必要なポケモン1枚"}], ()=>["次ターンまで含めた必要札確保に使える。"]),
  "シアノ": base("シアノ", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "deck_pokemon",
    primitives: ["search_pokemon_ex"], staticRoles: ["pokemon_ex_search", "consistency"], intents: ["consistency", "opening_setup"],
    boardImpact: {}, notes: ["ポケモンex へのアクセス。"],
  }, 74, (ctx)=>!ctx.supporterUsed, ()=>[{ type:"deck_pokemon", label:"ポケモンex 1枚"}], ()=>["主力exへ到達して次のテンポを作る。"]),
  "アカマツ": base("アカマツ", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["draw_cards", "deck_fixing"], staticRoles: ["draw", "consistency"], intents: ["draw_stability", "consistency"],
    boardImpact: { handDelta: 1 }, notes: ["柔軟な安定札。"],
  }, 68, (ctx)=>!ctx.supporterUsed, none, ()=>["次の必要札へ寄せる安定行動。"]),
  "ヒカリ": base("ヒカリ", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "self_pokemon",
    primitives: ["attach_energy_from_hand"], staticRoles: ["energy_accel", "consistency"], intents: ["energy_accel", "consistency"],
    boardImpact: { energyAttachDelta: 1 }, notes: ["エネルギー運用を前進させる。"],
  }, 72, (ctx)=>!ctx.supporterUsed, selfPokemonTargets, ()=>["攻撃開始ターンを前倒しできる。"]),
  "メイのはげまし": base("メイのはげまし", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["draw_cards"], staticRoles: ["draw", "consistency"], intents: ["draw_stability", "consistency"],
    boardImpact: { handDelta: 2 }, notes: ["手札補充の安定札。"],
  }, 64, (ctx)=>!ctx.supporterUsed, none, ()=>["不足リソースを埋める。"]),
  "アクロマの実験": base("アクロマの実験", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["draw_cards", "deck_fixing"], staticRoles: ["draw", "consistency"], intents: ["draw_stability", "consistency"],
    boardImpact: { handDelta: 2 }, notes: ["必要札選別に強い。"],
  }, 80, (ctx)=>!ctx.supporterUsed, none, ()=>["掘り進めながら質を高められる。"]),
  "ロケット団のサカキ": base("ロケット団のサカキ", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["draw_cards", "deck_fixing"], staticRoles: ["draw", "consistency"], intents: ["draw_stability", "consistency"],
    boardImpact: { handDelta: 1 }, notes: ["ロケット団デッキの安定札として扱う。"],
  }, 70, (ctx)=>!ctx.supporterUsed, none, ()=>["ロケット団プランの継続性を上げる。"]),
  "ロケット団のアテナ": base("ロケット団のアテナ", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["refresh_hand"], staticRoles: ["hand_refresh", "disrupt", "stall", "consistency"], intents: ["hand_refresh", "disrupt", "consistency"],
    boardImpact: { handDelta: 1, disruptionPressure: 1 }, notes: ["相手要求値を上げる更新札として扱う。"],
  }, 76, (ctx)=>!ctx.supporterUsed, none, ()=>["手札更新と干渉を両立できる。"]),
  "ジャッジマン": base("ジャッジマン", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["refresh_hand"], staticRoles: ["hand_refresh", "draw", "disrupt", "stall", "consistency"], intents: ["hand_refresh", "disrupt", "consistency"],
    boardImpact: { handDelta: 1, disruptionPressure: 1 }, notes: ["相手手札も巻き込む標準干渉札。"],
  }, 80, (ctx)=>!ctx.supporterUsed, none, (ctx)=>[ctx.phase === "endgame" ? "終盤の相手要求値上げとして有効。" : "中盤の再現性阻害と自分の引き直しを両立する。"]),
  "ゼイユ": base("ゼイユ", {
    source: "manual", category: "supporter", actionType: "play_supporter", targetType: "none",
    primitives: ["draw_cards", "deck_fixing"], staticRoles: ["draw", "consistency"], intents: ["draw_stability", "consistency"],
    boardImpact: { handDelta: 1 }, notes: ["山と手札の質を上げる安定札。"],
  }, 62, (ctx)=>!ctx.supporterUsed, none, ()=>["必要札へ寄せる安定行動。"]),
  "ブレイブバングル": base("ブレイブバングル", {
    source: "manual", category: "tool", actionType: "play_tool", targetType: "self_pokemon",
    primitives: ["damage_modifier"], staticRoles: ["damage_boost"], intents: ["damage_push"],
    boardImpact: { prizePressure: 1 }, notes: ["打点ラインを押し上げるどうぐ。"],
  }, 60, ()=>true, selfPokemonTargets, ()=>["サイドを1ターン早く進める打点調整になる。"]),
  "ふうせん": base("ふうせん", {
    source: "manual", category: "tool", actionType: "play_tool", targetType: "self_pokemon",
    primitives: ["switch_self"], staticRoles: ["pivot", "switch"], intents: ["pivot", "switch_tempo"],
    boardImpact: { activeSwitch: true }, notes: ["逃げ性能改善によるテンポ維持。"],
  }, 64, ()=>true, selfPokemonTargets, ()=>["今後の retreat コストを軽くして柔軟性を上げる。"]),
  "ジャミングタワー": base("ジャミングタワー", {
    source: "manual", category: "stadium", actionType: "play_stadium", targetType: "none",
    primitives: ["lock_item"], staticRoles: ["stadium_control", "item_lock", "disrupt", "stall"], intents: ["stadium_control", "item_lock", "disrupt"],
    boardImpact: { disruptionPressure: 1 }, notes: ["相手の道具依存やグッズラインに圧をかける。"],
  }, 72, ()=>true, none, ()=>["対面依存だが、相手の再現性を大きく落とせる。"]),
  "活力の森": base("活力の森", {
    source: "manual", category: "stadium", actionType: "play_stadium", targetType: "none",
    primitives: ["deck_fixing"], staticRoles: ["stadium_control", "consistency"], intents: ["stadium_control", "consistency"],
    boardImpact: {}, notes: ["継続的な盤面補助スタジアムとして扱う。"],
  }, 56, ()=>true, none, ()=>["長期戦で盤面条件を整える。"]),
  "ロケット団の監視塔": base("ロケット団の監視塔", {
    source: "manual", category: "stadium", actionType: "play_stadium", targetType: "none",
    primitives: ["increase_retreat_cost"], staticRoles: ["stadium_control", "stall", "disrupt"], intents: ["stadium_control", "disrupt"],
    boardImpact: { disruptionPressure: 1 }, notes: ["逃げ要求値を上げる。"],
  }, 74, ()=>true, none, ()=>["高にげエネ縛りと相性が良い。"]),
  "ゼロの大空洞": base("ゼロの大空洞", {
    source: "manual", category: "stadium", actionType: "play_stadium", targetType: "none",
    primitives: ["bench_expand"], staticRoles: ["board_expansion", "bench_setup", "stadium_control", "consistency"], intents: ["board_expansion", "bench_setup", "consistency"],
    boardImpact: { boardExpansion: true, benchDelta: 1 }, notes: ["ベンチ枠拡張で複数エンジンを並べる。"],
  }, 82, ()=>true, none, ()=>["盤面上限を上げて中盤以降の展開天井を広げる。"]),
};

export function getManualOverride(cardName: string): EffectSpec | undefined {
  return MANUAL_EFFECT_OVERRIDES[cardName];
}
