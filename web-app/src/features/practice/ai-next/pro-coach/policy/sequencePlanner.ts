import type { LegalAction } from "../types";

function categoryWeight(action: LegalAction): number {
  switch (action.kind) {
    case "use_ability":
      // Layer 1: 情報増加（特性によるドロー・サーチ）
      if (action.category === "draw") return 100;
      if (action.category === "search") return 95;
      return 80;
    case "play_item":
      // Layer 1.5: 山圧縮・情報整理（サーチグッズ）
      if (action.category === "search_basic" || action.category === "search_any") return 90;
      // Layer 2: 盤面調整（入れ替え、トラッシュ回収）
      if (action.category === "switch") return 65;
      if (action.category === "recovery") return 55;
      return 50;
    case "bench_pokemon":
      // Layer 2: 盤面形成（たねポケモンを出す）
      return 75;
    case "evolve":
      // Layer 3: 不可逆な盤面固定（進化）
      return 60;
    case "play_stadium":
      return action.category === "board_expansion" ? 58 : 54;
    case "play_tool":
      return 56;
    case "play_supporter":
      // Layer 4: 大きなリソース消費（サポート）は原則後回し
      if (action.category === "draw") return 45;
      if (action.category === "search") return 44;
      if (action.category === "gust") return 42;
      return 40;
    case "attach_energy":
      // Layer 4: リソース決定（エネ貼り）も後回し（貼り先を確定させるため）
      return 48;
    case "retreat":
      // Layer 5: ターンの締めに向けての移動
      return 30;
    case "attack":
      // Layer 6: 攻撃（ターンの終了）
      return 10;
    default:
      return 1;
  }
}

export function sortActionsByProfessionalPriority(actions: LegalAction[]): LegalAction[] {
  return [...actions].sort((a, b) => categoryWeight(b) - categoryWeight(a));
}
