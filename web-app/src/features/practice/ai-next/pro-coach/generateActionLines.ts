import type { CardRoleProfile } from "../domain/types";
import { generateLegalActions } from "./legalAction";
import { applyStateTransition } from "./stateTransition";
import type { CoachGameState, GeneratedActionLine, LegalAction } from "./types";

type GenerateActionLinesParams = {
  state: CoachGameState;
  profiles: CardRoleProfile[];
  maxDepth?: number;
  maxBranchesPerDepth?: number;
};

function actionKey(action: LegalAction): string {
  switch (action.kind) {
    case "attack":
      return `${action.kind}:${action.sourceId}:${action.attackName}:${action.targetId ?? ""}`;
    case "retreat":
      return `${action.kind}:${action.fromId}:${action.toId}`;
    case "use_ability":
      return `${action.kind}:${action.sourceId}:${action.category}`;
    case "bench_pokemon":
      return `${action.kind}:${action.cardId}`;
    case "evolve":
      return `${action.kind}:${action.cardId}:${action.targetId}`;
    default:
      return `${action.kind}:${"cardId" in action ? action.cardId : ""}:${"targetId" in action && action.targetId ? action.targetId : ""}:${"category" in action ? action.category : ""}`;
  }
}

function lineId(actions: LegalAction[]): string {
  return actions.map(actionKey).join(">");
}

function actionPriority(action: LegalAction): number {
  switch (action.kind) {
    case "use_ability":
      return action.category === "draw" ? 100 : action.category === "search" ? 94 : 78;
    case "bench_pokemon":
      return 92;
    case "evolve":
      return action.category === "stage2" ? 90 : 88;
    case "play_item":
      if (action.category === "search_basic" || action.category === "search_any") return 86;
      if (action.category === "switch") return 62;
      if (action.category === "recovery") return 58;
      return 50;
    case "play_stadium":
      return action.category === "board_expansion" ? 54 : 48;
    case "play_tool":
      return 44;
    case "attach_energy":
      return 42;
    case "play_supporter":
      if (action.category === "draw") return 40;
      if (action.category === "search") return 38;
      if (action.category === "gust") return 36;
      return 34;
    case "retreat":
      return 28;
    case "attack":
      return 8;
    default:
      return 1;
  }
}

function shouldContinueAfter(action: LegalAction): boolean {
  return action.kind !== "attack";
}

function scoreHintCount(actions: LegalAction[], kind: LegalAction["kind"]): number {
  return actions.filter((action) => action.kind === kind).length;
}

function hasKind(actions: LegalAction[], kind: LegalAction["kind"]): boolean {
  return actions.some((action) => action.kind === kind);
}

function normalizeCandidates(actions: LegalAction[]): LegalAction[] {
  const seen = new Set<string>();
  return [...actions]
    .sort((a, b) => actionPriority(b) - actionPriority(a))
    .filter((action) => {
      const key = actionKey(action);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function generateActionLines(params: GenerateActionLinesParams): GeneratedActionLine[] {
  const maxDepth = params.maxDepth ?? 3;
  const maxBranchesPerDepth = params.maxBranchesPerDepth ?? 6;
  const results: GeneratedActionLine[] = [];
  const seenLineIds = new Set<string>();

  function visit(state: CoachGameState, actions: LegalAction[], transitionSummaries: string[], depth: number): void {
    const currentId = lineId(actions);
    if (actions.length > 0 && !seenLineIds.has(currentId)) {
      seenLineIds.add(currentId);
      results.push({
        id: currentId,
        actions: [...actions],
        finalState: state,
        transitionSummaries: [...transitionSummaries],
        scoreHints: {
          supporterUsed: state.players.player1.supporterUsed,
          manualEnergyUsed: state.players.player1.energyAttachedThisTurn,
          attackIncluded: hasKind(actions, "attack"),
          benchCount: scoreHintCount(actions, "bench_pokemon"),
          evolvedCount: scoreHintCount(actions, "evolve"),
        },
      });
    }

    if (depth >= maxDepth) return;
    if (actions.length > 0 && !shouldContinueAfter(actions[actions.length - 1])) return;

    const legal = normalizeCandidates(generateLegalActions(state, params.profiles)).slice(0, maxBranchesPerDepth);
    for (const action of legal) {
      const next = applyStateTransition(state, action, params.profiles);
      visit(next.nextState, [...actions, action], [...transitionSummaries, ...next.transitionSummary], depth + 1);
    }
  }

  visit(params.state, [], [], 0);

  return results.sort((a, b) => {
    if (a.scoreHints.attackIncluded !== b.scoreHints.attackIncluded) {
      return a.scoreHints.attackIncluded ? -1 : 1;
    }
    if (a.scoreHints.evolvedCount !== b.scoreHints.evolvedCount) {
      return b.scoreHints.evolvedCount - a.scoreHints.evolvedCount;
    }
    return b.actions.length - a.actions.length;
  });
}
