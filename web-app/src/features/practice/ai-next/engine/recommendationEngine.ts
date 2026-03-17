
import { 
    BoardState, 
    ActionCandidate, 
    ScoredAction, 
    KeyCard, 
    RecommendationResult, 
    DeckList, 
    ArchetypeStrategy 
} from '../domain/types';
import { analyzeDeckContext } from '../inference/deckContextAnalyzer';
import { scoreKeyCards } from '../inference/keyCardScorer';
import { evaluateActions } from './actionEvaluator';
import { buildAnalysisExplanation, buildBoardSummary } from './explanationBuilder';
import { createRoleProfile } from '../inference/sectionRoleInference';
import { getSectionTexts } from '../utils/text';

/**
 * Main AI Engine Entry point.
 * Coordinates role inference, deck analysis, and action evaluation.
 */

export type RecommendationRequest = {
  cardsMaster: any[];
  deck: DeckList | null;
  board: BoardState;
  candidateActions: ActionCandidate[];
};

export const VERSION = "2.0.0-AI-COACH";

export function buildRecommendation(request: RecommendationRequest): RecommendationResult {
    const { cardsMaster, deck, board, candidateActions } = request;

    // 1. Analyze Deck Context (Strategy)
    const strategy = analyzeDeckContext(deck);

    // 2. Perform On-demand Static Role Inference for provided cards (Static Context)
    const cardProfiles = cardsMaster.map(card => {
        const sections = getSectionTexts(card);
        return createRoleProfile(card, sections);
    });

    // 3. Score Key Cards (Heuristics & Strategy)
    const keyCards = scoreKeyCards(cardProfiles, board, strategy);

    // 4. Evaluate Candidate Actions (Decision Scoring)
    const scoredActions = evaluateActions(candidateActions, board, strategy);

    const bestAction = scoredActions[0] || null;
    const alternatives = scoredActions.slice(1, 4);

    // 5. Build Human-readable analysis
    const analysis = buildAnalysisExplanation(bestAction, keyCards, board);
    const summary = buildBoardSummary(board);

    return {
        bestAction,
        alternatives,
        keyCards,
        analysis,
        boardStateSummary: summary,
        timestamp: new Date().toISOString(),
        version: VERSION
    };
}
