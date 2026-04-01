export type SubscriptionPlanCode = 'free' | 'basic' | 'pro';
export type AddOnCode =
  | 'pro_ai_single_default'
  | 'pro_ai_single_aggressive'
  | 'pro_ai_single_conservative'
  | 'pro_ai_single_tournament'
  | 'pro_ai_bundle';

export type PlanOrAddOnCode = SubscriptionPlanCode | AddOnCode;

export type PlanStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export type EntitlementSourceType = 'plan' | 'addon' | 'promo' | 'reward';

export type FeatureCode =
  | 'analysis.daily.free'
  | 'analysis.advanced'
  | 'analysis.unlimited'
  | 'analysis.no_ads'
  | 'analysis.history'
  | 'analysis.deck_compare'
  | 'analysis.environment_compare'
  | 'analysis.priority_queue'
  | 'opening_simulation.full'
  | 'coach.basic'
  | 'coach.pro'
  | 'coach.log_replay'
  | 'coach.pro_persona.default'
  | 'coach.pro_persona.aggressive'
  | 'coach.pro_persona.conservative'
  | 'coach.pro_persona.tournament';

export type BillingCheckoutMode = 'subscription';

export interface EntitlementRow {
  id: string;
  user_id: string;
  feature_code: FeatureCode;
  source_type: EntitlementSourceType;
  source_ref: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_code: PlanOrAddOnCode;
  provider: 'stripe';
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  status: PlanStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface EntitlementsResponse {
  plan: SubscriptionPlanCode;
  status: PlanStatus | 'free';
  activeFeatures: FeatureCode[];
  addOns: AddOnCode[];
  remainingDailyFreeAnalysis: number;
  dailyFreeLimit: number;
  aiTickets: number;
  limits: {
    isUnlimitedAnalysis: boolean;
    canUseAdvancedAnalysis: boolean;
    canUseProCoach: boolean;
  };
}

export interface ShareCreateRequest {
  deckName: string;
  shareType: 'analysis' | 'board' | 'simulation';
  templateId: string;
  shareText: string;
  summary: Record<string, unknown>;
}

export interface ShareCreateResponse {
  slug: string;
  shareUrl: string;
}
