'use client';

import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type UserProfile = Database['public']['Tables']['users']['Row'];

/**
 * Clerkの有効状態（環境変数）に基づいて、認証情報を安全に取得します。
 */
export function useAuth() {
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const isClerkEnabled = !!(clerkKey && clerkKey.startsWith('pk_'));

    const clerkUser = useClerkUser();
    const clerkAuth = useClerkAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [lastFetched, setLastFetched] = useState(0);

    const fetchProfile = useCallback(async () => {
        // 短時間での連続フェッチを防止 (スロットリング: 2秒)
        const nowTime = Date.now();
        if (nowTime - lastFetched < 2000) {
            // console.log('[useAuth] Skip fetching (throttled)');
            return;
        }

        // Clerkがロードされていない、またはサインインしていない場合はスキップ
        if (!isClerkEnabled || !clerkUser.isLoaded || !clerkUser.isSignedIn || !clerkUser.user) {
            if (clerkUser.isLoaded && !clerkUser.isSignedIn) {
                setProfile(null);
                setIsLoadingProfile(false);
            }
            return;
        }

        try {
            setIsLoadingProfile(true);
            setLastFetched(nowTime);
            
            const res = await fetch('/api/user/profile');
            if (!res.ok) {
                throw new Error('Failed to fetch profile from API');
            }
            
            const data = await res.json();
            if (data && !data.error) {
                // console.log('[useAuth] Profile fetched via API:', { tickets: data.ai_tickets, plan: data.plan_type });
                setProfile(data);
            } else if (data.error) {
                console.error('API Error:', data.error);
            }
        } catch (error) {
            console.error('Error during fetchProfile:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [isClerkEnabled, clerkUser.isLoaded, clerkUser.isSignedIn, clerkUser.user?.id, lastFetched]);

    useEffect(() => {
        if (isClerkEnabled && clerkUser.isLoaded && clerkUser.isSignedIn) {
            fetchProfile();
        }
    }, [fetchProfile, isClerkEnabled, clerkUser.isLoaded, clerkUser.isSignedIn]);

    if (!isClerkEnabled) {
        return {
            user: null,
            profile: null,
            isSignedIn: false,
            isLoaded: true,
            isLoadingProfile: false,
            getToken: async () => null,
            isPro: false,
            refreshProfile: async () => {},
        };
    }

    const trialUntil = profile?.pro_trial_until ? new Date(profile.pro_trial_until) : null;
    const isEarlyCampaign = process.env.NEXT_PUBLIC_CAMPAIGN_EARLY_ACCESS === 'true';
    const isPro = isEarlyCampaign || profile?.plan_type === 'pro' || profile?.plan_type === 'elite' || (trialUntil !== null && trialUntil > new Date());

    return {
        user: clerkUser.user,
        profile,
        isSignedIn: clerkUser.isSignedIn,
        isLoaded: clerkUser.isLoaded,
        isLoadingProfile,
        getToken: clerkAuth.getToken,
        isPro,
        refreshProfile: fetchProfile,
    };
}
