import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlement } from '@/hooks/useEntitlement';

/**
 * チケット消費やリワード広告によってPro機能を解禁するための共通ロジック
 * - Free: チケット / リワード広告で単発解禁
 * - Basic / Pro: entitlement がある場合は常時解禁
 */
export function useTicketUnlock() {
    const { profile, isSignedIn, isPro, isLoadingProfile, refreshProfile } = useAuth();
    const { snapshot, canUseAdvancedCoach, canUseUnlimitedAnalysis } = useEntitlement();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const tickets = useMemo(() => {
        const raw = (profile as any)?.ai_tickets ?? (profile as any)?.tickets ?? snapshot.aiTickets ?? 0;
        return typeof raw === 'number' ? raw : 0;
    }, [profile, snapshot.aiTickets]);

    const permanentlyUnlocked = isPro || canUseAdvancedCoach || canUseUnlimitedAnalysis;

    const handleUnlock = async () => {
        if (permanentlyUnlocked || isUnlocked) return true;
        if (!isSignedIn) {
            alert('ログインが必要です');
            return false;
        }

        if (isLoadingProfile) {
            alert('ログイン情報を読み込み中です。少々お待ちください。');
            return false;
        }

        if (tickets > 0) {
            const confirmed = window.confirm(`チケットを消費して詳細分析を解禁しますか？(残り${tickets}回)`);
            if (!confirmed) return false;

            try {
                setIsLoading(true);
                const res = await fetch('/api/monetization/tickets/use', { method: 'POST' });
                if (!res.ok) {
                    alert('チケットの消費に失敗しました');
                    return false;
                }
                setIsUnlocked(true);
                await refreshProfile();
                return true;
            } catch (err) {
                console.error(err);
                alert('通信エラーが発生しました');
                return false;
            } finally {
                setIsLoading(false);
            }
        }

        const watchAd = window.confirm('無料回数を使い切りました。広告を見て1回分を回復しますか？');
        if (!watchAd) return false;

        try {
            setIsLoading(true);
            const res = await fetch('/api/user/tickets/recover', { method: 'POST' });
            if (!res.ok) {
                alert('広告報酬の付与に失敗しました');
                return false;
            }
            setIsUnlocked(true);
            await refreshProfile();
            alert('広告視聴ありがとうございます。詳細分析を解禁しました。');
            return true;
        } catch (err) {
            console.error(err);
            alert('通信エラーが発生しました');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isUnlocked: permanentlyUnlocked || isUnlocked,
        isLoading: isLoading || isLoadingProfile,
        isLoadingProfile,
        tickets: isLoadingProfile ? null : tickets,
        canUseAdvancedCoach,
        canUseUnlimitedAnalysis,
        handleUnlock,
    };
}
