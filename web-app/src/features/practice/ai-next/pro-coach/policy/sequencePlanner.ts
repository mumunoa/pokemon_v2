import type { LegalAction } from "../types";

/**
 * blueprint.md 第10章に基づき、行動順序を最適化する
 */
export function sortActionsByProfessionalPriority(actions: LegalAction[]): LegalAction[] {
  // 優先度スコアの定義 (低いほど先に行う)
  const getActionScore = (action: LegalAction): number => {
    switch (action.kind) {
      case "use_ability":
        // ドロー、サーチ系の特性は情報を増やすため、最優先
        if (action.category === "draw" || action.category === "search") return 10;
        return 20;

      case "play_item":
        // 情報が増えるグッズ (サーチ等) は早め
        if (action.category === "search_basic" || action.category === "search_any") return 30;
        // 入れ替えは特性起動条件にもなるので中盤
        if (action.category === "switch") return 70;
        return 40;

      case "attach_energy":
        // エネルギー貼りは分岐を固定するため、情報が出揃った後半
        return 50;

      case "play_supporter":
        // サポートは手札を上書きするため、基本は最後の方
        // ただし、何も始まらない場合のドローサポートは例外的に 50 程度に下げる余地あり
        return 80;

      case "play_tool":
        return 60;

      case "play_stadium":
        return 65;

      case "retreat":
        // 逃げるは最後だが、特性起動のためなら早まる (ここでは標準を 90)
        return 90;

      case "attack":
        // 攻撃はターンの締め
        return 100;

      default:
        return 50;
    }
  };

  return [...actions].sort((a, b) => getActionScore(a) - getActionScore(b));
}
