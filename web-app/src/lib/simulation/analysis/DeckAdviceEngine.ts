/*
 * deck-advice-engine.ts
 *
 * 目的:
 * - 初動1,000回試行シミュレーション結果とデッキ構成を元に、
 *   Proプラン品質の「デッキ改善ヒント」を返す。
 * - 役割不足 -> 症状 -> 改善方針 -> standard候補カード の順で説明する。
 * - 具体カード候補は Supabase の regulation = 'standard' のみから取得する。
 *
 * 想定:
 * - 既存コード側で deckCards / simulationSummary は作成済み
 * - Supabase client は getSupabaseClient() 経由で取得できる
 * - cards テーブルに roles / regulation / priority_score 等が入っている
 */

// -------------------------------
// 型定義
// -------------------------------

export type CardRole =
  | 'seed_pokemon'
  | 'main_attacker'
  | 'sub_attacker'
  | 'system_pokemon'
  | 'draw_support'
  | 'search_support'
  | 'gust_support'
  | 'other_support'
  | 'search_item'
  | 'seed_search_item'
  | 'draw_item'
  | 'switch_item'
  | 'energy_search_item'
  | 'energy_recovery_item'
  | 'tool'
  | 'stadium'
  | 'basic_energy'
  | 'special_energy'
  | 'ace_spec'
  | 'basic_pokemon' | 'main_attacker_basic' | 'main_attacker_stage1' | 'main_attacker_stage2'
  | 'support_pokemon' | 'consistency' | 'draw' | 'hand_refresh' | 'supporter_search'
  | 'gust' | 'search' | 'evolution_search' | 'pokemon_search' | 'basic_search'
  | 'bench_setup' | 'switch' | 'pivot' | 'energy_search' | 'energy_recovery' | 'resource_recovery' | 'recovery' | 'disrupt';

export type DeckArchetype =
  | 'basic_aggro'
  | 'stage1_main'
  | 'stage2_main'
  | 'toolbox'
  | 'control'
  | 'unknown';

export type DeckCard = {
  cardId: string;
  name: string;
  count: number;
  supertype: 'pokemon' | 'trainer' | 'energy';
  subtype?: string;
  stage?: 'basic' | 'stage1' | 'stage2';
  regulation?: string;
  roles: CardRole[];
};

export type SimulationSummary = {
  totalTrials: number;
  seedRate: number; // 0 ~ 1
  setupSuccessRate: number; // 0 ~ 1
  supportAccessRate: number; // 0 ~ 1
  energyAccessRate: number; // 0 ~ 1

  noSeedStartRate?: number; // 0 ~ 1
  noSupportByTurn2Rate?: number; // 0 ~ 1
  noEnergyByTurn2Rate?: number; // 0 ~ 1
  noBench2ByTurn2Rate?: number; // 0 ~ 1
  noAttackerReadyByTurn2Rate?: number; // 0 ~ 1
  noEvolutionReadyByTurn2Rate?: number; // 0 ~ 1
  brickedStartRate?: number; // 0 ~ 1
};

export type ThresholdBand = {
  good: number;
  caution: number;
};

export type ArchetypeThresholdPreset = {
  seedRate: ThresholdBand;
  setupSuccessRate: ThresholdBand;
  supportAccessRate: ThresholdBand;
  energyAccessRate: ThresholdBand;
  minPokemonCount: number;
  maxPokemonCount: number;
  minSupportCount: number;
  maxSupportCount: number;
  minDrawSupportCount: number;
  maxDrawSupportCount: number;
  minGoodsCount: number;
  maxGoodsCount: number;
  minSearchItemCount: number;
  maxSearchItemCount: number;
  minEnergyCount: number;
  maxEnergyCount: number;
};

export type DeckRoleSummary = {
  totalCards: number;
  pokemonCount: number;
  supportCount: number;
  drawSupportCount: number;
  searchSupportCount: number;
  gustSupportCount: number;
  otherSupportCount: number;
  goodsCount: number;
  searchItemCount: number;
  seedSearchItemCount: number;
  drawItemCount: number;
  switchItemCount: number;
  energySearchItemCount: number;
  energyRecoveryItemCount: number;
  toolCount: number;
  stadiumCount: number;
  basicEnergyCount: number;
  specialEnergyCount: number;
  energyCount: number;
  aceSpecCount: number;
  seedPokemonCount: number;
  mainAttackerCount: number;
  subAttackerCount: number;
  systemPokemonCount: number;
  stage1Count: number;
  stage2Count: number;
};

export type SymptomKey =
  | 'seed_fail_high'
  | 'setup_fail_high'
  | 'bench_setup_fail'
  | 'support_dead_turn_high'
  | 'energy_attach_fail'
  | 'energy_access_fail'
  | 'evolution_fail'
  | 'midgame_draw_thin'
  | 'search_density_low'
  | 'seed_density_low'
  | 'switch_density_low';

export type BottleneckKey =
  | 'seed_density_shortage'
  | 'early_search_shortage'
  | 'draw_support_shortage'
  | 'energy_total_shortage'
  | 'energy_access_shortage'
  | 'evolution_line_thin'
  | 'switch_access_shortage'
  | 'overloaded_meta_slots'
  | 'low_role_reproducibility';

export type CandidateCard = {
  id: string;
  name: string;
  regulation: string;
  legalMark?: string | null;
  roles: CardRole[];
  priorityScore?: number | null;
  reason: string;
};

export type AdviceSuggestion = {
  priority: 1 | 2 | 3;
  bottleneck: BottleneckKey;
  title: string;
  diagnosis: string;
  whyItHurts: string;
  action: string;
  recommendedRoles: CardRole[];
  candidateCards: CandidateCard[];
  cutGuidance: string[];
};

export type AdviceOutput = {
  archetype: DeckArchetype;
  overallComment: string;
  summaryLines: string[];
  bottlenecks: BottleneckKey[];
  suggestions: AdviceSuggestion[];
  debug?: {
    roleSummary: DeckRoleSummary;
    symptoms: SymptomKey[];
    preset: ArchetypeThresholdPreset;
  };
};

export type AdviceEngineInput = {
  deckCards: DeckCard[];
  simulation: SimulationSummary;
  archetype?: DeckArchetype;
  includeDebug?: boolean;
};

export type SupabaseCardRow = {
  id: string;
  name: string;
  regulation: string;
  legal_mark: string | null;
  roles: CardRole[] | null;
  priority_score: number | null;
};

// -------------------------------
// アーキタイプ別しきい値
// -------------------------------

const ARCHETYPE_PRESETS: Record<DeckArchetype, ArchetypeThresholdPreset> = {
  basic_aggro: {
    seedRate: { good: 0.88, caution: 0.80 },
    setupSuccessRate: { good: 0.70, caution: 0.60 },
    supportAccessRate: { good: 0.80, caution: 0.70 },
    energyAccessRate: { good: 0.75, caution: 0.65 },
    minPokemonCount: 10,
    maxPokemonCount: 18,
    minSupportCount: 7,
    maxSupportCount: 11,
    minDrawSupportCount: 3,
    maxDrawSupportCount: 7,
    minGoodsCount: 15,
    maxGoodsCount: 26,
    minSearchItemCount: 6,
    maxSearchItemCount: 14,
    minEnergyCount: 7,
    maxEnergyCount: 14,
  },
  stage1_main: {
    seedRate: { good: 0.85, caution: 0.75 },
    setupSuccessRate: { good: 0.65, caution: 0.55 },
    supportAccessRate: { good: 0.80, caution: 0.70 },
    energyAccessRate: { good: 0.70, caution: 0.60 },
    minPokemonCount: 12,
    maxPokemonCount: 20,
    minSupportCount: 7,
    maxSupportCount: 11,
    minDrawSupportCount: 3,
    maxDrawSupportCount: 7,
    minGoodsCount: 15,
    maxGoodsCount: 24,
    minSearchItemCount: 6,
    maxSearchItemCount: 14,
    minEnergyCount: 6,
    maxEnergyCount: 13,
  },
  stage2_main: {
    seedRate: { good: 0.85, caution: 0.75 },
    setupSuccessRate: { good: 0.60, caution: 0.50 },
    supportAccessRate: { good: 0.80, caution: 0.70 },
    energyAccessRate: { good: 0.70, caution: 0.60 },
    minPokemonCount: 14,
    maxPokemonCount: 22,
    minSupportCount: 7,
    maxSupportCount: 11,
    minDrawSupportCount: 3,
    maxDrawSupportCount: 7,
    minGoodsCount: 15,
    maxGoodsCount: 25,
    minSearchItemCount: 6,
    maxSearchItemCount: 14,
    minEnergyCount: 6,
    maxEnergyCount: 12,
  },
  toolbox: {
    seedRate: { good: 0.85, caution: 0.75 },
    setupSuccessRate: { good: 0.65, caution: 0.55 },
    supportAccessRate: { good: 0.80, caution: 0.70 },
    energyAccessRate: { good: 0.70, caution: 0.60 },
    minPokemonCount: 12,
    maxPokemonCount: 20,
    minSupportCount: 7,
    maxSupportCount: 11,
    minDrawSupportCount: 3,
    maxDrawSupportCount: 7,
    minGoodsCount: 15,
    maxGoodsCount: 25,
    minSearchItemCount: 6,
    maxSearchItemCount: 14,
    minEnergyCount: 6,
    maxEnergyCount: 13,
  },
  control: {
    seedRate: { good: 0.85, caution: 0.78 },
    setupSuccessRate: { good: 0.60, caution: 0.50 },
    supportAccessRate: { good: 0.85, caution: 0.75 },
    energyAccessRate: { good: 0.60, caution: 0.50 },
    minPokemonCount: 8,
    maxPokemonCount: 16,
    minSupportCount: 8,
    maxSupportCount: 14,
    minDrawSupportCount: 3,
    maxDrawSupportCount: 8,
    minGoodsCount: 18,
    maxGoodsCount: 28,
    minSearchItemCount: 4,
    maxSearchItemCount: 12,
    minEnergyCount: 4,
    maxEnergyCount: 10,
  },
  unknown: {
    seedRate: { good: 0.85, caution: 0.75 },
    setupSuccessRate: { good: 0.65, caution: 0.55 },
    supportAccessRate: { good: 0.80, caution: 0.70 },
    energyAccessRate: { good: 0.70, caution: 0.60 },
    minPokemonCount: 10,
    maxPokemonCount: 20,
    minSupportCount: 7,
    maxSupportCount: 12,
    minDrawSupportCount: 3,
    maxDrawSupportCount: 8,
    minGoodsCount: 15,
    maxGoodsCount: 26,
    minSearchItemCount: 4,
    maxSearchItemCount: 14,
    minEnergyCount: 6,
    maxEnergyCount: 14,
  },
};

// -------------------------------
// 自動役割付与 (ヒューリスティクス)
// -------------------------------
export function autoInferRoles(card: any): CardRole[] {
  const roles: CardRole[] = [];
  const name = card.name || '';
  const supertype = card.supertype || card.type || '';
  const subtype = card.subtype || card.kinds || '';

  // ポケモン
  if (supertype === 'pokemon') {
    if (card.stage === 'basic' || subtype === 'basic') roles.push('seed_pokemon');
    // かがやく系やHPの大きいものは一旦メインアタッカー、システムなどに振る
    if (name.includes('かがやく') || name.includes('ex') || name.includes('V') || name.includes('オーガポン')) {
      roles.push('main_attacker');
    } else if (name.includes('ビーダル') || name.includes('ピジョット') || name.includes('キュワワー') || name.includes('ロトム') || name.includes('ミュウ') || name.includes('ゲッコウガ') || name.includes('キチキギス')) {
      roles.push('system_pokemon');
    } else {
      roles.push('sub_attacker');
    }
  }

  // サポート
  if (supertype === 'trainer' && subtype === 'supporter') {
    if (name.includes('博士') || name.includes('ナンジャモ') || name.includes('リーリエ') || name.includes('マリィ') || name.includes('ツツジ') || name.includes('シロナ') || name.includes('ジャッジマン') || name.includes('コルニ') || name.includes('暗号マニア') || name.includes('アカマツ')) {
      roles.push('draw_support');
    } else if (name.includes('ペパー') || name.includes('カイ') || name.includes('スグリ') || name.includes('アクロマ') || name.includes('ボタン') || name.includes('マツバ')) {
      roles.push('search_support');
    } else if (name.includes('ボス') || name.includes('フラダリ') || name.includes('セレナ') || name.includes('プライムキャッチャー')) { // ボスは一応サポート
      roles.push('gust_support');
    } else {
      roles.push('other_support');
    }
  }

  // グッズ
  if (supertype === 'trainer' && subtype === 'item') {
    if (name.includes('ネストボール') || name.includes('なかよしポフィン') || name.includes('VIPパス') || name.includes('フェザーボール') || name.includes('ヒスイのヘビーボール') || name.includes('モンスターボール')) {
      roles.push('seed_search_item');
    }
    if (name.includes('ハイパーボール') || name.includes('キャプチャーアロマ') || name.includes('スーパーボール') || name.includes('しんかのおこう') || name.includes('プレシャスボール') || name.includes('マスターボール')) {
      roles.push('search_item');
    }
    if (name.includes('いれかえ') || name.includes('カート') || name.includes('あなぬけ') || name.includes('プライムキャッチャー')) {
      roles.push('switch_item');
    }
    if (name.includes('大地の器') || name.includes('エネルギー転送') || name.includes('エネルギースピナー')) {
      roles.push('energy_search_item');
    }
    if (name.includes('つりざお') || name.includes('エネルギー回収') || name.includes('エネルギーリサイクル')) {
      roles.push('energy_recovery_item');
    }
    if (name.match(/キャッチャー/)) {
      // プライムやカウンターなども（ボス代替）
      roles.push('gust_support');
    }
  }

  if (supertype === 'trainer' && subtype === 'tool') roles.push('tool');
  if (supertype === 'trainer' && subtype === 'stadium') roles.push('stadium');
  if (name.includes('ACE SPEC')) roles.push('ace_spec');

  // エネルギー
  if (supertype === 'energy') {
    if (subtype === 'special' || name.includes('特殊')) {
      roles.push('special_energy');
    } else {
      roles.push('basic_energy');
    }
  }

  return roles.length > 0 ? roles : ['system_pokemon']; // fallback
}

// -------------------------------
// Supabase client 抽象
// -------------------------------

export interface AdviceSupabaseClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): any;
      contains(column: string, value: unknown): any;
      order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): any;
      limit(value: number): Promise<{ data: SupabaseCardRow[] | null; error: Error | null }>;
    };
  };
}

export type GetSupabaseClient = () => AdviceSupabaseClient;

let getSupabaseClient: GetSupabaseClient | null = null;

export function registerAdviceSupabaseClient(factory: GetSupabaseClient): void {
  getSupabaseClient = factory;
}

// -------------------------------
// 役割集計
// -------------------------------

export function summarizeDeckRoles(deckCards: DeckCard[]): DeckRoleSummary {
  const summary: DeckRoleSummary = {
    totalCards: 0,
    pokemonCount: 0,
    supportCount: 0,
    drawSupportCount: 0,
    searchSupportCount: 0,
    gustSupportCount: 0,
    otherSupportCount: 0,
    goodsCount: 0,
    searchItemCount: 0,
    seedSearchItemCount: 0,
    drawItemCount: 0,
    switchItemCount: 0,
    energySearchItemCount: 0,
    energyRecoveryItemCount: 0,
    toolCount: 0,
    stadiumCount: 0,
    basicEnergyCount: 0,
    specialEnergyCount: 0,
    energyCount: 0,
    aceSpecCount: 0,
    seedPokemonCount: 0,
    mainAttackerCount: 0,
    subAttackerCount: 0,
    systemPokemonCount: 0,
    stage1Count: 0,
    stage2Count: 0,
  };

  for (const card of deckCards) {
    summary.totalCards += card.count;

    const isPokemon = card.supertype === 'pokemon';
    const isTrainer = card.supertype === 'trainer';
    const isEnergy = card.supertype === 'energy';

    const isSupporter = card.subtype === 'supporter';
    const isItem = card.subtype === 'item';
    const isTool = card.subtype === 'tool';
    const isStadium = card.subtype === 'stadium';

    if (isPokemon) {
      summary.pokemonCount += card.count;
      if (card.stage === 'stage1') summary.stage1Count += card.count;
      if (card.stage === 'stage2') summary.stage2Count += card.count;
    }

    if (isEnergy) {
      summary.energyCount += card.count;
    }

    if (isTrainer) {
      if (isSupporter) summary.supportCount += card.count;
      if (isItem) summary.goodsCount += card.count;
      if (isTool) summary.toolCount += card.count;
      if (isStadium) summary.stadiumCount += card.count;
    }

    // api/deck/route.ts または api/ai/simulation/route.ts にて
    // card_role_profiles から取得した static_roles が格納されています。
    const profileRoles = card.roles || [];

    // 1枚のカードが複数のタグ('draw', 'consistency'等)を持っていても
    // 1回しか合算しないよう、カードごとにフラグで管理します。
    let drawSupport = false;
    let searchSupport = false;
    let gustSupport = false;
    let otherSupport = false;

    let searchItem = false;
    let seedSearchItem = false;
    let drawItem = false;
    let switchItem = false;
    let energySearchItem = false;
    let energyRecoveryItem = false;
    let seedPokemon = false;
    let mainAttacker = false;
    let subAttacker = false;
    let systemPokemon = false;
    let basicEnergy = false;
    let specialEnergy = false;
    let aceSpec = false;

    for (const role of profileRoles) {
      // ポケモンの判定
      if (role === 'seed_pokemon' || role === 'basic_pokemon') seedPokemon = true;
      if (role === 'main_attacker' || role.startsWith('main_attacker_')) mainAttacker = true;
      if (role === 'sub_attacker') subAttacker = true;
      if (role === 'system_pokemon' || role === 'support_pokemon' || role === 'consistency') systemPokemon = true;

      // サポートの判定 (kinds="supporter")
      if (isSupporter) {
        if (role === 'draw_support' || role === 'draw' || role === 'hand_refresh') drawSupport = true;
        else if (role === 'search_support' || role === 'supporter_search' || role === 'search') searchSupport = true;
        else if (role === 'gust_support' || role === 'gust') gustSupport = true;
        else if (role === 'other_support' || role === 'recovery' || role === 'disrupt') otherSupport = true;
      }

      // グッズの判定 (kinds="item")
      if (isItem) {
        if (role === 'search_item' || role === 'search' || role === 'evolution_search' || role === 'pokemon_search') searchItem = true;
        if (role === 'seed_search_item' || role === 'basic_search' || role === 'bench_setup') seedSearchItem = true;
        if (role === 'draw_item' || (role === 'draw')) drawItem = true;
        if (role === 'switch_item' || role === 'switch' || role === 'pivot') switchItem = true;
        if (role === 'energy_search_item' || role === 'energy_search') energySearchItem = true;
        if (role === 'energy_recovery_item' || role === 'energy_recovery' || role === 'resource_recovery') energyRecoveryItem = true;
      }

      // エネルギーの判定
      if (isEnergy) {
        if (role === 'basic_energy') basicEnergy = true;
        if (role === 'special_energy') specialEnergy = true;
      }

      if (role === 'ace_spec') aceSpec = true;
    }

    // fallback mapping if it hasn't caught specific subtype match
    if (isTrainer && profileRoles.length === 0) {
      if (isSupporter) otherSupport = true;
    }

    if (isEnergy && !basicEnergy && !specialEnergy) {
       // primitive fallback
       if (card.subtype === 'special' || (card.name && card.name.includes('特殊'))) specialEnergy = true;
       else basicEnergy = true;
    }

    // フラグに基づいて1度だけ追加する
    if (seedPokemon) summary.seedPokemonCount += card.count;
    if (mainAttacker) summary.mainAttackerCount += card.count;
    if (subAttacker) summary.subAttackerCount += card.count;
    if (systemPokemon) summary.systemPokemonCount += card.count;
    
    if (drawSupport) summary.drawSupportCount += card.count;
    if (searchSupport) summary.searchSupportCount += card.count;
    if (gustSupport) summary.gustSupportCount += card.count;
    if (otherSupport && !drawSupport && !searchSupport && !gustSupport) summary.otherSupportCount += card.count;

    if (searchItem) summary.searchItemCount += card.count;
    if (seedSearchItem) summary.seedSearchItemCount += card.count;
    if (drawItem) summary.drawItemCount += card.count;
    if (switchItem) summary.switchItemCount += card.count;
    if (energySearchItem) summary.energySearchItemCount += card.count;
    if (energyRecoveryItem) summary.energyRecoveryItemCount += card.count;

    if (basicEnergy) summary.basicEnergyCount += card.count;
    if (specialEnergy) summary.specialEnergyCount += card.count;
    if (aceSpec) summary.aceSpecCount += card.count;
  }

  return summary;
}

// -------------------------------
// アーキタイプ推定
// -------------------------------

export function inferDeckArchetype(deckCards: DeckCard[], summary?: DeckRoleSummary): DeckArchetype {
  const s = summary ?? summarizeDeckRoles(deckCards);

  if (s.stage2Count >= 3) return 'stage2_main';
  if (s.stage1Count >= 4) return 'stage1_main';
  if (s.seedPokemonCount >= 8 && s.stage1Count === 0 && s.stage2Count === 0) return 'basic_aggro';
  if (s.subAttackerCount >= 4 && s.mainAttackerCount >= 4) return 'toolbox';
  return 'unknown';
}

// -------------------------------
// 症状抽出
// -------------------------------

export function detectSymptoms(
  simulation: SimulationSummary,
  summary: DeckRoleSummary,
  preset: ArchetypeThresholdPreset,
): SymptomKey[] {
  const symptoms: SymptomKey[] = [];

  if (simulation.seedRate < preset.seedRate.caution || (simulation.noSeedStartRate ?? 0) > 1 - preset.seedRate.caution) {
    symptoms.push('seed_fail_high');
  }

  if (simulation.setupSuccessRate < preset.setupSuccessRate.caution) {
    symptoms.push('setup_fail_high');
  }

  if ((simulation.noBench2ByTurn2Rate ?? 0) > 0.35) {
    symptoms.push('bench_setup_fail');
  }

  if (simulation.supportAccessRate < preset.supportAccessRate.caution || (simulation.noSupportByTurn2Rate ?? 0) > 0.22) {
    symptoms.push('support_dead_turn_high');
  }

  if (simulation.energyAccessRate < preset.energyAccessRate.caution || (simulation.noEnergyByTurn2Rate ?? 0) > 0.3) {
    symptoms.push('energy_access_fail');
  }

  if ((simulation.noAttackerReadyByTurn2Rate ?? 0) > 0.34) {
    symptoms.push('energy_attach_fail');
  }

  if ((simulation.noEvolutionReadyByTurn2Rate ?? 0) > 0.3) {
    symptoms.push('evolution_fail');
  }

  if (summary.drawSupportCount < preset.minDrawSupportCount) {
    symptoms.push('midgame_draw_thin');
  }

  if ((summary.searchItemCount + summary.seedSearchItemCount) < preset.minSearchItemCount) {
    symptoms.push('search_density_low');
  }

  if (summary.seedPokemonCount < 8 && summary.seedSearchItemCount < 4) {
    symptoms.push('seed_density_low');
  }

  if (summary.switchItemCount < 2 && summary.seedPokemonCount >= 7) {
    symptoms.push('switch_density_low');
  }

  return [...new Set(symptoms)];
}

// -------------------------------
// ボトルネック抽出
// -------------------------------

export function detectBottlenecks(
  symptoms: SymptomKey[],
  summary: DeckRoleSummary,
  preset: ArchetypeThresholdPreset,
): BottleneckKey[] {
  const bottlenecks = new Set<BottleneckKey>();

  if (symptoms.includes('seed_fail_high') || symptoms.includes('seed_density_low')) {
    bottlenecks.add('seed_density_shortage');
  }

  if (symptoms.includes('search_density_low') || symptoms.includes('bench_setup_fail')) {
    bottlenecks.add('early_search_shortage');
  }

  if (symptoms.includes('support_dead_turn_high') || symptoms.includes('midgame_draw_thin')) {
    bottlenecks.add('draw_support_shortage');
  }

  if (summary.energyCount < preset.minEnergyCount) {
    bottlenecks.add('energy_total_shortage');
  }

  if (
    summary.energyCount >= preset.minEnergyCount &&
    (symptoms.includes('energy_access_fail') || summary.energySearchItemCount + summary.energyRecoveryItemCount < 2)
  ) {
    bottlenecks.add('energy_access_shortage');
  }

  if (symptoms.includes('evolution_fail')) {
    bottlenecks.add('evolution_line_thin');
  }

  if (symptoms.includes('switch_density_low')) {
    bottlenecks.add('switch_access_shortage');
  }

  const bulkyMetaSlots = Math.max(
    0,
    summary.toolCount - 3,
  ) + Math.max(0, summary.stadiumCount - 4) + Math.max(0, summary.otherSupportCount - 2);

  if (bulkyMetaSlots >= 2) {
    bottlenecks.add('overloaded_meta_slots');
  }

  if (bottlenecks.size >= 2 || symptoms.includes('setup_fail_high')) {
    bottlenecks.add('low_role_reproducibility');
  }

  return [...bottlenecks];
}

// -------------------------------
// Supabase クエリ
// -------------------------------

function mapLegacyRoleToStaticRole(role: CardRole): string {
  switch (role) {
    case 'search_item': return 'search';
    case 'seed_search_item': return 'basic_search';
    case 'draw_support': return 'draw';
    case 'gust_support': return 'gust';
    case 'switch_item': return 'switch';
    case 'energy_search_item': return 'energy_search';
    case 'energy_recovery_item': return 'energy_recovery';
    case 'seed_pokemon': return 'basic_pokemon';
    case 'main_attacker': return 'main_attacker';
    case 'system_pokemon': return 'consistency';
    case 'search_support': return 'search';
    default: return role as string;
  }
}

async function fetchCandidateCardsByRoles(
  roles: CardRole[],
  limitPerRole = 3,
): Promise<CandidateCard[]> {
  if (!getSupabaseClient) return [];

  const client = getSupabaseClient();
  const all: CandidateCard[] = [];
  const seen = new Set<string>();

  for (const role of roles) {
    const targetStaticRole = mapLegacyRoleToStaticRole(role);

    // card_role_profiles から static_roles に該当するものと、inner join で cards の情報を取得
    const { data, error } = await client
      .from('card_role_profiles')
      .select('card_id, cards!inner(id, name, regulation, legal_mark, priority_score)')
      .contains('static_roles', [targetStaticRole])
      .eq('cards.regulation', 'standard');

    if (error || !data) continue;

    const mappedCards = data
      .map((p: any) => p.cards)
      .filter((c: any) => c != null)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        regulation: c.regulation,
        legalMark: c.legal_mark,
        roles: [role],
        priorityScore: c.priority_score || 0,
        reason: buildCandidateReason(role),
      }))
      .sort((a: any, b: any) => (b.priorityScore || 0) - (a.priorityScore || 0))
      .slice(0, limitPerRole);

    for (const c of mappedCards) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      all.push(c);
    }
  }

  return all.sort((a: any, b: any) => (b.priorityScore || 0) - (a.priorityScore || 0));
}

function buildCandidateReason(role: CardRole): string {
  switch (role) {
    case 'draw_support':
      return '中盤まで手札更新回数を増やし、止まりやすいターンを減らすため。';
    case 'search_support':
      return '必要札への到達を安定させ、初動と中盤の接続を滑らかにするため。';
    case 'seed_search_item':
      return '初手のたね接触率とベンチ形成率を上げるため。';
    case 'search_item':
      return '進化・システム・アタッカーへの到達密度を上げるため。';
    case 'energy_search_item':
      return '必要ターンまでにエネルギーへ触る再現性を上げるため。';
    case 'energy_recovery_item':
      return '中盤以降のエネルギー再利用を安定させるため。';
    case 'switch_item':
      return 'スタート事故や逃げ要求に対する復帰力を上げるため。';
    case 'seed_pokemon':
      return '初手のたね率を底上げし、マリガン・事故率を下げるため。';
    default:
      return '構築の再現性を高める役割として有効なため。';
  }
}

// -------------------------------
// 文面テンプレ
// -------------------------------

function buildOverallComment(
  archetype: DeckArchetype,
  simulation: SimulationSummary,
  bottlenecks: BottleneckKey[],
): string {
  const setupGood = simulation.setupSuccessRate >= 0.7;
  const supportWeak = simulation.supportAccessRate < 0.8;
  const energyWeak = simulation.energyAccessRate < 0.7;

  if (setupGood && energyWeak) {
    return '初動の盤面形成自体は戦える水準ですが、攻撃成立までの導線がエネルギー到達の弱さで不安定になっています。改善優先度は火力札の追加ではなく、必要ターンまでにエネルギーへ触る再現性の補強です。';
  }

  if (setupGood && supportWeak) {
    return '初動の展開は成立していますが、中盤の手札更新が細く、毎試合同じ出力を再現しにくい構成です。改善優先度は条件付きの強札より、毎ターン使うドローサポートの厚みです。';
  }

  if (bottlenecks.includes('seed_density_shortage')) {
    return 'この構築は動いた試合の出力は出せますが、初手の再現性が足りません。勝率を安定させるには、パワーカードの上振れより、たねと初動サーチの密度を優先すべきです。';
  }

  if (archetype === 'stage2_main') {
    return '2進化軸として必要な上振れは持っていますが、成立までの接続が細い部分があります。再現できる構築に寄せるなら、進化到達・手札更新・エネルギー接触の順で厚みを持たせてください。';
  }

  return 'この構築は一部の強い動きは持っていますが、役割密度にムラがあり、毎試合の再現性を落としています。改善は単純な枚数増減ではなく、初動・ドロー・エネルギー導線の3役割を整える方向が有効です。';
}

function buildSummaryLines(
  simulation: SimulationSummary,
  summary: DeckRoleSummary,
  preset: ArchetypeThresholdPreset,
): string[] {
  const lines: string[] = [];

  lines.push(`たね率は ${(simulation.seedRate * 100).toFixed(1)}% で、安心ライン ${(preset.seedRate.good * 100).toFixed(0)}% に対して ${simulation.seedRate >= preset.seedRate.good ? '到達' : '未到達'} です。`);
  lines.push(`展開成功率は ${(simulation.setupSuccessRate * 100).toFixed(1)}% で、初動の再現性は ${simulation.setupSuccessRate >= preset.setupSuccessRate.good ? '高め' : simulation.setupSuccessRate >= preset.setupSuccessRate.caution ? '標準域' : '不安定'} です。`);
  lines.push(`ドローサポートは ${summary.drawSupportCount} 枚で、推奨 ${preset.minDrawSupportCount}〜${preset.maxDrawSupportCount} 枚に対して ${summary.drawSupportCount < preset.minDrawSupportCount ? '不足' : summary.drawSupportCount > preset.maxDrawSupportCount ? 'やや過多' : '適正'} です。`);
  lines.push(`サーチグッズ密度は ${summary.searchItemCount + summary.seedSearchItemCount} 枚で、推奨 ${preset.minSearchItemCount}〜${preset.maxSearchItemCount} 枚です。`);
  lines.push(`エネルギー総数は ${summary.energyCount} 枚、エネルギー接触系は ${summary.energySearchItemCount + summary.energyRecoveryItemCount} 枚です。総量とアクセスを分けて評価する必要があります。`);

  return lines;
}

// -------------------------------
// 提案生成
// -------------------------------

async function buildSuggestions(
  bottlenecks: BottleneckKey[],
  summary: DeckRoleSummary,
  simulation: SimulationSummary,
): Promise<AdviceSuggestion[]> {
  const suggestions: AdviceSuggestion[] = [];

  for (const bottleneck of bottlenecks) {
    switch (bottleneck) {
      case 'seed_density_shortage': {
        const recommendedRoles: CardRole[] = ['seed_pokemon', 'seed_search_item'];
        suggestions.push({
          priority: 1,
          bottleneck,
          title: '初手のたね接触率を引き上げる',
          diagnosis:
            '初手のたね率が不足しており、マリガンや動けない試合の発生率が高めです。たねそのものか、たねに触る初動札のどちらかが足りていません。',
          whyItHurts:
            'ここが薄いと、他の強いカードを入れていても試合開始時点で負け筋を背負います。BO3では特に再現性への悪影響が大きいです。',
          action:
            '優先して増やすのは、単純なたね増量だけでなく、毎試合初手から使えるたねサーチです。初動に寄与しないピン刺し枠から削ってください。',
          recommendedRoles,
          candidateCards: await fetchCandidateCardsByRoles(recommendedRoles, 2),
          cutGuidance: [
            '初動に寄与しないピン刺しグッズ',
            '特定対面でしか機能しないメタカード',
          ],
        });
        break;
      }

      case 'early_search_shortage': {
        const recommendedRoles: CardRole[] = ['seed_search_item', 'search_item', 'search_support'];
        suggestions.push({
          priority: 1,
          bottleneck,
          title: '初動サーチ密度を厚くする',
          diagnosis:
            'たねやアタッカー自体の枚数はあっても、それらへ到達する導線が細く、T1〜T2のベンチ形成とアタッカー準備が安定していません。',
          whyItHurts:
            '展開成功率は、単純なポケモン枚数よりサーチグッズ密度の影響を強く受けます。ここが薄いと“引けた試合だけ強い”構築になります。',
          action:
            'たねサーチと汎用サーチを優先して増やし、役割重複した贅沢枠を削ってください。',
          recommendedRoles,
          candidateCards: await fetchCandidateCardsByRoles(recommendedRoles, 2),
          cutGuidance: [
            '条件付きでしか強くない中盤札',
            '役割重複したサブプラン札',
          ],
        });
        break;
      }

      case 'draw_support_shortage': {
        const recommendedRoles: CardRole[] = ['draw_support', 'search_support'];
        suggestions.push({
          priority: 1,
          bottleneck,
          title: '中盤まで続く手札更新回数を増やす',
          diagnosis:
            '初動である程度盤面はできても、サポート到達率やドローサポート枚数が不足し、2ターン目以降に失速しやすい構成です。',
          whyItHurts:
            '再現できる構築は、強い初手だけでなく、止まった手札を立て直す回数を十分に確保しています。ここが薄いと試合ごとの出力差が大きくなります。',
          action:
            '毎ターン打つドローサポートやドロー特性を持つポケモンを厚くし、メタ札や状況依存札を削る方向が有効です。サーチサポートを混ぜる場合も、初動と中盤の接続を重視してください。',
          recommendedRoles,
          candidateCards: await fetchCandidateCardsByRoles(recommendedRoles, 3),
          cutGuidance: [
            '対面依存のサポート',
            '使用頻度の低い1枚採用カード',
          ],
        });
        break;
      }

      case 'energy_total_shortage': {
        const recommendedRoles: CardRole[] = ['basic_energy', 'special_energy'];
        suggestions.push({
          priority: 1,
          bottleneck,
          title: 'エネルギー総量を最低ラインまで戻す',
          diagnosis:
            '必要ターンまでのエネルギー接触率が低く、そもそもの総量不足が発生しています。',
          whyItHurts:
            'どれだけ盤面が整っても、攻撃成立に必要な枚数が山札内に足りていないと、上振れ依存の試合になります。',
          action:
            'まずは総量を適正ラインまで戻し、その上でアクセス手段を見直してください。特殊エネルギーに寄せすぎている場合は色要求も再確認が必要です。',
          recommendedRoles,
          candidateCards: [],
          cutGuidance: [
            '過剰などうぐ',
            '採用意図の薄いスタジアム',
          ],
        });
        break;
      }

      case 'energy_access_shortage': {
        const recommendedRoles: CardRole[] = ['energy_search_item', 'energy_recovery_item', 'search_support'];
        suggestions.push({
          priority: 1,
          bottleneck,
          title: 'エネルギーに触る導線を増やす',
          diagnosis:
            `エネルギー総数は ${summary.energyCount} 枚ありますが、到達率は ${(simulation.energyAccessRate * 100).toFixed(1)}% と低く、問題は総量よりアクセス密度にあります。`,
          whyItHurts:
            'この状態は“エネルギーは入っているのに必要ターンまでに見えない”構造で、攻撃開始ターンの遅れが勝率を落とします。',
          action:
            '基本エネルギーの単純増量より、必要ターンまでに確定で触りやすいエネルギーサーチや回収札を優先してください。',
          recommendedRoles,
          candidateCards: await fetchCandidateCardsByRoles(recommendedRoles, 2),
          cutGuidance: [
            '効果が噛み合いにくい1枚差しグッズ',
            '初動に影響しないロングゲーム専用札',
          ],
        });
        break;
      }

      case 'evolution_line_thin': {
        const recommendedRoles: CardRole[] = ['search_item', 'search_support'];
        suggestions.push({
          priority: 2,
          bottleneck,
          title: '進化到達の接続を太くする',
          diagnosis:
            '進化元・進化先のラインまたはそこへ触る導線が細く、必要ターンでの成立率が落ちています。',
          whyItHurts:
            '2進化や1進化主体のデッキでは、盤面にポケモンがいても進化成立が遅れるだけでテンポ負けに繋がります。',
          action:
            '進化ラインの枚数だけでなく、ハイパーボール系やサーチサポートで到達密度を補ってください。',
          recommendedRoles,
          candidateCards: await fetchCandidateCardsByRoles(recommendedRoles, 2),
          cutGuidance: [
            '成立前提の上振れ札',
            '複数枚不要な終盤札',
          ],
        });
        break;
      }

      case 'switch_access_shortage': {
        const recommendedRoles: CardRole[] = ['switch_item'];
        suggestions.push({
          priority: 2,
          bottleneck,
          title: 'スタート事故からの復帰力を上げる',
          diagnosis:
            '逃げにくいポケモンが前に出た時の復帰手段が薄く、実戦での手数損が発生しやすい構成です。',
          whyItHurts:
            '初動シミュレーションでは見えにくいですが、実戦では入れ替え不足がテンポロスとサポート使用先の固定化を招きます。',
          action:
            '最低限の入れ替え枚数を確保し、逃げ要求の重いスタートに備えてください。',
          recommendedRoles,
          candidateCards: await fetchCandidateCardsByRoles(recommendedRoles, 2),
          cutGuidance: [
            '役割が被る趣味枠',
          ],
        });
        break;
      }

      case 'overloaded_meta_slots': {
        suggestions.push({
          priority: 3,
          bottleneck,
          title: 'メタ枠を再現性枠へ再配分する',
          diagnosis:
            'どうぐ・スタジアム・条件付きサポートの一部が増えすぎており、毎試合使う基本役割を圧迫しています。',
          whyItHurts:
            'メタ札は刺さる試合では強いですが、再現性の土台が足りない構築では、強い試合と弱い試合の差が大きくなります。',
          action:
            'まずは初動サーチ、ドロー、エネルギー接触を優先し、その後に必要なメタ枠だけを戻す方が勝率は安定します。',
          recommendedRoles: [],
          candidateCards: [],
          cutGuidance: [
            '初動に寄与しないメタどうぐ',
            '複数枚不要なスタジアム',
            '汎用性の低いサポート',
          ],
        });
        break;
      }

      case 'low_role_reproducibility': {
        suggestions.push({
          priority: 3,
          bottleneck,
          title: '役割密度を整えて“再現できる構築”に寄せる',
          diagnosis:
            '個々の強いカードは入っていますが、初動・ドロー・サーチ・エネルギー接触の密度にムラがあります。',
          whyItHurts:
            '大会で勝ち続ける構築は、上振れの最大値よりも“弱い初手からどこまで立て直せるか”で差がつきます。',
          action:
            '構築改善はカードパワーの足し算ではなく、基本役割の不足を埋める順で行ってください。',
          recommendedRoles: [],
          candidateCards: [],
          cutGuidance: [
            '採用理由が説明しにくい1枚差し',
            '毎試合使わない豪華枠',
          ],
        });
        break;
      }
    }
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
}

// -------------------------------
// メインエントリ
// -------------------------------

export async function generateDeckAdvice(input: AdviceEngineInput): Promise<AdviceOutput> {
  const roleSummary = summarizeDeckRoles(input.deckCards);
  const archetype = input.archetype ?? inferDeckArchetype(input.deckCards, roleSummary);
  const preset = ARCHETYPE_PRESETS[archetype] ?? ARCHETYPE_PRESETS.unknown;

  const symptoms = detectSymptoms(input.simulation, roleSummary, preset);
  const bottlenecks = detectBottlenecks(symptoms, roleSummary, preset);
  const overallComment = buildOverallComment(archetype, input.simulation, bottlenecks);
  const summaryLines = buildSummaryLines(input.simulation, roleSummary, preset);
  const suggestions = await buildSuggestions(bottlenecks, roleSummary, input.simulation);

  return {
    archetype,
    overallComment,
    summaryLines,
    bottlenecks,
    suggestions,
    debug: input.includeDebug
      ? {
        roleSummary,
        symptoms,
        preset,
      }
      : undefined,
  };
}

// -------------------------------
// UI用整形ヘルパー
// -------------------------------

export function formatAdviceAsMarkdown(advice: AdviceOutput): string {
  const lines: string[] = [];

  lines.push('# デッキ改善ヒント');
  lines.push('');
  lines.push(`## 総評`);
  lines.push(advice.overallComment);
  lines.push('');

  lines.push('## 構築サマリ');
  for (const line of advice.summaryLines) {
    lines.push(`- ${line}`);
  }
  lines.push('');

  lines.push('## 改善提案');
  for (const suggestion of advice.suggestions) {
    lines.push(`### ${suggestion.title}`);
    lines.push(`- 優先度: ${suggestion.priority}`);
    lines.push(`- 診断: ${suggestion.diagnosis}`);
    lines.push(`- 勝率への影響: ${suggestion.whyItHurts}`);
    lines.push(`- 改善方針: ${suggestion.action}`);

    if (suggestion.candidateCards.length > 0) {
      lines.push(`- 候補カード: ${suggestion.candidateCards.map((c) => c.name).join(' / ')}`);
    }

    if (suggestion.cutGuidance.length > 0) {
      lines.push(`- 抜き候補の考え方: ${suggestion.cutGuidance.join('、')}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

// -------------------------------
// 利用例
// -------------------------------

/*
import { createClient } from '@supabase/supabase-js';

registerAdviceSupabaseClient(() => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
});

const advice = await generateDeckAdvice({
  deckCards,
  simulation: {
    totalTrials: 1000,
    seedRate: 0.848,
    setupSuccessRate: 0.574,
    supportAccessRate: 0.758,
    energyAccessRate: 0.804,
    noSeedStartRate: 0.152,
    noSupportByTurn2Rate: 0.242,
    noEnergyByTurn2Rate: 0.196,
    noBench2ByTurn2Rate: 0.31,
    noAttackerReadyByTurn2Rate: 0.37,
  },
  includeDebug: true,
});

console.log(formatAdviceAsMarkdown(advice));
*/
