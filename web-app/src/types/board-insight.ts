export type BoardInsightGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type BoardInsightAccessLevel = 'pre_analysis' | 'free_summary' | 'ticket_unlocked' | 'pro' | 'elite';

export type BoardInsightBreakdown = {
  openingScore: number;
  consistencyScore: number;
  tempoScore: number;
  convertScore: number;
  tacticalScore: number;
  riskScore: number;
  boardScore: number;
  boardGrade: BoardInsightGrade;
};

export type BoardInsightReason = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  freeHints: string[];
};

export type BoardInsightMeta = {
  breakdown: BoardInsightBreakdown;
  reason: BoardInsightReason;
  generatedAt: string;
};

export type BoardInsightShareSummary = {
  deckName: string;
  boardScore: number;
  boardGrade: BoardInsightGrade;
  openingScore: number;
  riskScore: number;
  summary: string;
  bestAction?: string;
  caution?: string;
};

export type BoardInsightUiState = {
  status: 'idle' | 'running' | 'ready';
  accessLevel: BoardInsightAccessLevel;
  shareSlug?: string;
  shareUrl?: string;
};
