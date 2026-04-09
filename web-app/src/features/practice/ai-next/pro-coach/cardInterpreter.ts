import { CardRoleProfile } from "../domain/types";
import { EnergyType } from "./types";

/**
 * プロコーチ用カード解析ロジック (強化版)
 */

export function interpretCoachCard(card: any, profile?: CardRoleProfile) {
  if (!card) return null;

  const rawType = (card.type || card.card_type || "").toLowerCase();
  const kinds = (card.kinds || "").toLowerCase();

  // カードメイン種別の正規化
  let type: "pokemon" | "trainer" | "energy" | "other" = "other";
  if (rawType.includes("pokemon") || card.hp !== undefined) type = "pokemon";
  else if (rawType.includes("trainer") || kinds.includes("trainer")) type = "trainer";
  else if (rawType.includes("energy") || kinds.includes("energy")) type = "energy";

  // エネルギータイプの抽出 (エネルギーカード用)
  const types: EnergyType[] = [];
  if (type === "energy") {
    const name = (card.name || "").toLowerCase();
    if (name.includes("草") || name.includes("grass")) types.push("grass");
    else if (name.includes("炎") || name.includes("fire")) types.push("fire");
    else if (name.includes("水") || name.includes("water")) types.push("water");
    else if (name.includes("雷") || name.includes("lightning")) types.push("lightning");
    else if (name.includes("超") || name.includes("psychic")) types.push("psychic");
    else if (name.includes("闘") || name.includes("fighting")) types.push("fighting");
    else if (name.includes("悪") || name.includes("darkness")) types.push("darkness");
    else if (name.includes("鋼") || name.includes("metal")) types.push("metal");
    else if (name.includes("フェアリー") || name.includes("fairy")) types.push("fairy");
    else if (name.includes("ドラゴン") || name.includes("dragon")) types.push("dragon");
    else types.push("special");
  }

  // 進化段階の判定
  let pokemonStage: "basic" | "stage1" | "stage2" | "vmar" | "vstar" | "none" = "none";
  if (type === "pokemon") {
    const stage = (card.stage || "").toLowerCase();
    if (stage.includes("1") || stage.includes("１")) pokemonStage = "stage1";
    else if (stage.includes("2") || stage.includes("２")) pokemonStage = "stage2";
    else if (stage.includes("vstar")) pokemonStage = "vstar";
    else if (stage.includes("vmax")) pokemonStage = "vmar";
    else pokemonStage = "basic";
  }

  return {
    id: card.id,
    name: card.name,
    type,
    types, // エネルギーカード用
    pokemonStage,
    hp: card.hp || 0,
    attacks: card.attacks || [],
    abilities: card.abilities || card.ability || [],
    attachedEnergyIds: card.attachedEnergyIds || [],
    attachedEnergyTypes: card.attachedEnergyTypes || [],
    evolvesFrom: card.evolvesFrom || (profile as any)?.evolvesFrom || card.evolves_from,
    evolves: card.evolves || [],
    card_type: rawType,
    kinds: kinds
  };
}

export const interpretCard = interpretCoachCard;
