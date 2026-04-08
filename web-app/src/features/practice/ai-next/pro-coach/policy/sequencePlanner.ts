import type { LegalAction } from "../types";

function categoryWeight(action: LegalAction): number {
  switch (action.kind) {
    case "use_ability":
      return action.category === "draw" ? 100 : action.category === "search" ? 92 : 80;
    case "play_item":
      if (action.category === "search_basic" || action.category === "search_any") return 86;
      if (action.category === "switch") return 62;
      if (action.category === "recovery") return 52;
      return 50;
    case "play_stadium":
      return action.category === "board_expansion" ? 58 : 54;
    case "play_tool":
      return 56;
    case "attach_energy":
      return 48;
    case "play_supporter":
      if (action.category === "draw") return 46;
      if (action.category === "search") return 44;
      if (action.category === "gust") return 42;
      return 40;
    case "retreat":
      return 36;
    case "attack":
      return 10;
    default:
      return 1;
  }
}

export function sortActionsByProfessionalPriority(actions: LegalAction[]): LegalAction[] {
  return [...actions].sort((a, b) => categoryWeight(b) - categoryWeight(a));
}
