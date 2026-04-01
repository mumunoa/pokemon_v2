export type LegacyPlanType = 'free' | 'pro' | 'elite';

export type PublicPlanId = 'free' | 'pro' | 'elite';
export type AddOnId = 'pro_ai_default' | 'pro_ai_aggressive' | 'pro_ai_conservative' | 'pro_ai_tournament';
export type BillingInterval = 'month' | 'year';

export type EntitlementKey =
  | 'analysis.daily.free'
  | 'analysis.unlimited'
  | 'analysis.advanced'
  | 'analysis.no_ads'
  | 'coach.log_replay'
  | 'coach.pro_persona.default'
  | 'coach.pro_persona.aggressive'
  | 'coach.pro_persona.conservative'
  | 'coach.pro_persona.tournament';

export type EntitlementMap = Partial<Record<EntitlementKey, boolean>>;

export interface PublicPlanDefinition {
  id: PublicPlanId;
  name: string;
  monthlyPriceJpy: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface AddOnDefinition {
  id: AddOnId;
  name: string;
  monthlyPriceJpy: number;
  description: string;
  includedEntitlements: EntitlementKey[];
}

export interface ShareScoreSummary {
  deckName: string;
  overallTier: 'S' | 'A' | 'B' | 'C';
  overallScore: number;
  setupRate: number;
  accidentRate: number;
  environmentRankPercent?: number;
  bestAction?: string;
  caution?: string;
  source: 'ai_analysis' | 'pro_coach';
}

export interface XShareTextVariant {
  id: 'flex' | 'strong' | 'warning' | 'cta';
  text: string;
  length: number;
}

export interface UserEntitlementSnapshot {
  legacyPlanType: LegacyPlanType;
  addOns: AddOnId[];
  entitlements: EntitlementMap;
  aiTickets: number;
  isProLike: boolean;
}
