'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { AddOnId } from '@/types/monetization';
import { buildEntitlements } from '@/lib/billing/plans';

/**
 * NOTE:
 * 現行 users テーブルには add_on 情報がまだ無いため、
 * ここでは profile に `pro_ai_addons?: AddOnId[]` が将来入る前提の安全な雛形にしている。
 */
export function useEntitlement() {
  const { profile, isPro, isLoadingProfile } = useAuth();

  return useMemo(() => {
    const addOns = ((profile as any)?.pro_ai_addons ?? []) as AddOnId[];
    const snapshot = buildEntitlements({
      legacyPlanType: ((profile?.plan_type ?? 'free') as 'free' | 'pro' | 'elite'),
      addOns,
    });

    snapshot.aiTickets = profile?.ai_tickets ?? 0;
    snapshot.isProLike = isPro;

    return {
      isLoading: isLoadingProfile,
      snapshot,
      canUseAdvancedCoach: snapshot.legacyPlanType === 'pro' || snapshot.legacyPlanType === 'elite',
      canUseUnlimitedAnalysis: snapshot.legacyPlanType === 'elite',
      canReplayLogs: snapshot.legacyPlanType === 'elite',
      canUseProAiDefault: !!snapshot.entitlements['coach.pro_persona.default'],
      canUseProAiAggressive: !!snapshot.entitlements['coach.pro_persona.aggressive'],
      canUseProAiConservative: !!snapshot.entitlements['coach.pro_persona.conservative'],
      canUseProAiTournament: !!snapshot.entitlements['coach.pro_persona.tournament'],
    };
  }, [profile, isPro, isLoadingProfile]);
}
