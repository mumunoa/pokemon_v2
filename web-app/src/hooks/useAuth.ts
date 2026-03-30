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
            
            console.log('[AuthDebug] Clerk User ID:', clerkUser.user.id);
            if (!supabaseToken) {
                console.warn('[AuthDebug] Supabase token not found (getToken returned null)');
                return;
            }

            const supabase = createSupabaseClient(supabaseToken);
            if (!supabase) throw new Error('Failed to create Supabase client');
            
            const { data, error, status } = await supabase
                .from('users')
                .select('*')
                .eq('id', clerkUser.user.id)
                .single();

            if (error) {
                console.error('[AuthDebug] Supabase Error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    status
                });
                
                if (error.code === 'PGRST116') {
                    console.log('[AuthDebug] User profile NOT FOUND in Supabase logic.');
                }
                // エラー時はフォールバックせず、エラーを保持するか何らかの通知を出すべき
            }

            if (data) {
                console.log('[AuthDebug] Profile fetched successfully:', data);
                setProfile(data);
            }
        } catch (error) {
            console.error('[AuthDebug] Unexpected Error during fetchProfile:', error);
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
