import type {
  CardRoleProfile,
  EffectPrimitive,
  PrimitiveEvidence,
  StaticRole,
} from "../domain/types";
import type { PrimitiveHint } from "./types";

export function hasRole(profile: CardRoleProfile | undefined, role: StaticRole): boolean {
  return !!profile?.staticRoles?.includes(role);
}

export function hasPrimitive(profile: CardRoleProfile | undefined, primitive: EffectPrimitive): boolean {
  return !!profile?.primitives?.includes(primitive);
}

export function primitiveEvidenceFor(
  profile: CardRoleProfile | undefined,
  primitive: EffectPrimitive,
): PrimitiveEvidence[] {
  return (profile?.primitiveEvidence ?? []).filter((item) => item.primitive === primitive);
}

export function buildPrimitiveHints(params: {
  handProfiles: CardRoleProfile[];
  phase: "opening" | "midgame" | "endgame";
  setupNeed: number;
  drawNeed: number;
  gustNeed: number;
}): PrimitiveHint[] {
  const out: PrimitiveHint[] = [];

  for (const profile of params.handProfiles) {
    let priority = 0;
    let line = "盤面を進める";
    let evidences: PrimitiveEvidence[] = [];

    if (hasPrimitive(profile, "search_basic_pokemon") || hasPrimitive(profile, "search_deck_to_bench")) {
      priority += params.phase === "opening" ? 30 : 12;
      priority += Math.floor(params.setupNeed / 4);
      line = "たねポケモンへ触ってベンチ基盤を作る";
      evidences = [
        ...evidences,
        ...primitiveEvidenceFor(profile, "search_basic_pokemon"),
        ...primitiveEvidenceFor(profile, "search_deck_to_bench"),
      ];
    }

    if (hasPrimitive(profile, "draw_cards")) {
      priority += Math.floor(params.drawNeed / 4) + (params.phase === "opening" ? 10 : 4);
      line = "追加ドローで必要札へ寄せる";
      evidences = [...evidences, ...primitiveEvidenceFor(profile, "draw_cards")];
    }

    if (hasPrimitive(profile, "refresh_hand")) {
      priority += Math.floor(params.drawNeed / 3) + (params.phase === "endgame" ? 10 : 0);
      if (profile.staticRoles.includes("disrupt")) {
        priority += params.phase === "endgame" ? 18 : 8;
        line = "手札を更新しつつ相手要求値を上げる";
      } else {
        line = "手札を更新して事故を解消する";
      }
      evidences = [...evidences, ...primitiveEvidenceFor(profile, "refresh_hand")];
    }

    if (hasPrimitive(profile, "gust_opponent")) {
      priority += Math.floor(params.gustNeed / 3) + (params.phase === "endgame" ? 22 : 6);
      line = "相手ベンチを呼び出してサイドプランを動かす";
      evidences = [...evidences, ...primitiveEvidenceFor(profile, "gust_opponent")];
    }

    if (hasPrimitive(profile, "topdeck_tutor")) {
      priority += params.phase === "endgame" ? 16 : 7;
      line = "次ターンの確定ルートを固定する";
      evidences = [...evidences, ...primitiveEvidenceFor(profile, "topdeck_tutor")];
    }

    if (
      hasPrimitive(profile, "attach_energy_from_deck") ||
      hasPrimitive(profile, "attach_energy_from_hand") ||
      hasPrimitive(profile, "attach_energy_from_discard")
    ) {
      priority += params.phase !== "endgame" ? 14 : 8;
      line = "エネルギー供給を前倒しして攻撃開始を早める";
      evidences = [
        ...evidences,
        ...primitiveEvidenceFor(profile, "attach_energy_from_deck"),
        ...primitiveEvidenceFor(profile, "attach_energy_from_hand"),
        ...primitiveEvidenceFor(profile, "attach_energy_from_discard"),
      ];
    }

    if (priority <= 0) continue;

    out.push({
      cardName: profile.cardName,
      priority,
      line,
      reasons: Array.from(new Set(evidences.map((e) => e.reason))).slice(0, 4),
      evidences,
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
}
