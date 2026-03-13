'use client';

import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type UserProfile = Database['public']['Tables']['users']['Row'];

/**
 * Clerkの有効状態（環境変数）に基づいて、認証情報を安全に取得します。
 */
export function useAuth() {
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const isClerkEnabled = !!(clerkKey && clerkKey.startsWith('pk_'));

    // Reactのルールに基づき、必ず最上位でフックを呼び出す
    // ただし、ClerkProviderがない場合はこれ自体がエラーを投げる可能性があるため
    // Arena.tsx などの上位で isClerkEnabled をチェックしてガードする戦略をとる。

    // ここでは単純にラップする
    const clerkUser = useClerkUser();
    const clerkAuth = useClerkAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchProfile() {
            if (!isClerkEnabled || !clerkUser.isSignedIn || !clerkUser.user) {
                if (isMounted) {
                    setProfile(null);
                    setIsLoadingProfile(false);
                }
                return;
            }

            try {
                setIsLoadingProfile(true);
                const supabaseToken = await clerkAuth.getToken({ template: 'supabase' });
                if (!supabaseToken) throw new Error('No Supabase token');

                const supabase = createSupabaseClient(supabaseToken);
                if (!supabase) throw new Error('Failed to create Supabase client');
                
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', clerkUser.user.id)
                    .single();

                if (error) throw error;

                if (isMounted && data) {
                    setProfile(data);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            }
        }

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, [clerkUser.isSignedIn, clerkUser.user?.id, clerkAuth.getToken, isClerkEnabled]);

    if (!isClerkEnabled) {
        return {
            user: null,
            profile: null,
            isSignedIn: false,
            isLoaded: true,
            isLoadingProfile: false,
            getToken: async () => null,
            isPro: false,
        };
    }

    const isPro = profile?.plan_type === 'pro' || profile?.plan_type === 'elite';

    return {
        user: clerkUser.user,
        profile,
        isSignedIn: clerkUser.isSignedIn,
        isLoaded: clerkUser.isLoaded,
        isLoadingProfile,
        getToken: clerkAuth.getToken,
        isPro,
    };
}
