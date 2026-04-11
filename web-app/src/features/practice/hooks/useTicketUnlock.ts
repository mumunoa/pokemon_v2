import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlement } from '@/hooks/useEntitlement';

/**
 * チケット消費やリワード広告によってPro機能を解禁するための共通ロジック
 * - Free: チケット / リワード広告で単発解禁
 * - Basic / Pro: entitlement がある場合は常時解禁
 * @param dependencies 変更時に解禁状態をリセットする依存配列（例: [deck]）
 */
export function useTicketUnlock(dependencies: any[] = []) {
    const { profile, isSignedIn, isPro, isLoadingProfile, refreshProfile } = useAuth();
    const { snapshot, canUseAdvancedCoach, canUseUnlimitedAnalysis } = useEntitlement();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const isEarlyAccessCampaign = process.env.NEXT_PUBLIC_CAMPAIGN_EARLY_ACCESS === 'true';
    const permanentlyUnlocked = isPro || canUseAdvancedCoach || canUseUnlimitedAnalysis || isEarlyAccessCampaign;

    // デッキ変更や盤面の大きな変化（依存関係）が変わったら解禁状態をリセット
    // ※ ユーザーの提案に基づき、1局面（1ターン）ごとの消費を促すため
    useEffect(() => {
        if (!permanentlyUnlocked) {
            setIsUnlocked(false);
        }
        // コンポーネントマウント時や依存関係変更時に最新の枚数を同期
        if (isSignedIn) {
            refreshProfile();
        }
    }, [...dependencies, permanentlyUnlocked]);

    const [isLoading, setIsLoading] = useState(false);

    const tickets = useMemo(() => {
        const raw = (profile as any)?.ai_tickets ?? snapshot.aiTickets ?? 0;
        return typeof raw === 'number' ? raw : 0;
    }, [profile, snapshot.aiTickets]);

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
            const confirmed = window.confirm(`チケットを1枚消費してこの局面を詳細分析しますか？\n(残り: ${tickets}枚)`);
            if (!confirmed) return false;

            try {
                setIsLoading(true);
                const res = await fetch('/api/monetization/tickets/use', { method: 'POST' });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    alert(errorData.error || 'チケットの消費に失敗しました');
                    return false;
                }
                
                // 消費に成功したら即座にローカル状態を解禁に
                setIsUnlocked(true);
                // 最新の残数をバックグラウンドで更新
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

        const upgrade = window.confirm('本日の無料チケットを使い切りました。Pro プランにアップグレードして、高精度の詳細分析を無制限に利用しませんか？');
        if (upgrade) {
            window.location.href = '/billing';
        }
        return false;
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
