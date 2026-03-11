'use client';

import { useUser as useClerkUser, useAuth as useClerkAuth } from "@clerk/nextjs";

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

    if (!isClerkEnabled) {
        return {
            user: null,
            isSignedIn: false,
            isLoaded: true,
            getToken: async () => null,
        };
    }

    return {
        user: clerkUser.user,
        isSignedIn: clerkUser.isSignedIn,
        isLoaded: clerkUser.isLoaded,
        getToken: clerkAuth.getToken,
    };
}
