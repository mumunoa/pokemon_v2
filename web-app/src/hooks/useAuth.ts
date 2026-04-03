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
            const supabaseToken = await clerkAuth.getToken({ template: 'supabase' });
            
            if (!supabaseToken) return;

            const supabase = createSupabaseClient(supabaseToken);
            if (!supabase) throw new Error('Failed to create Supabase client');
            
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', clerkUser.user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // プロフィールが存在しない場合は初期データを作成
                    const { data: newData, error: createError } = await supabase
                        .from('users')
                        .upsert({
                            id: clerkUser.user.id,
                            email: clerkUser.user.primaryEmailAddress?.emailAddress || '',
                            plan_type: 'free',
                            ai_tickets: 3,
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (!createError && newData) {
                        setProfile(newData);
                        return;
                    }
                }
            }

            if (data) {
                console.log('[useAuth] Profile fetched:', { tickets: data.ai_tickets, plan: data.plan_type });
                setProfile(data);
            }
        } catch (error) {
            console.error('Error during fetchProfile:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [isClerkEnabled, clerkUser.isLoaded, clerkUser.isSignedIn, clerkUser.user?.id, clerkAuth.getToken]);

    useEffect(() => {
        if (isClerkEnabled && clerkUser.isLoaded) {
            fetchProfile();
        }
    }, [fetchProfile, isClerkEnabled, clerkUser.isLoaded]);

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
