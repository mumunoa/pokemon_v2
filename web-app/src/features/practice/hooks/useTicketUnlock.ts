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

    // デッキ変更などの依存関係が変わったら解禁状態をリセット
    // ※ Proプランなどの恒久的な解禁状態にある場合はリセットしない
    useEffect(() => {
        if (!permanentlyUnlocked) {
            setIsUnlocked(false);
        }
        // デッキ読込時などに最新のチケット残数を同期する
        if (isSignedIn) {
            refreshProfile();
        }
    }, dependencies);

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

        // 広告視聴ロジックは一旦コメントアウトし、有料プランへの誘導へ切り替え
        /*
        const monetag = (window as any).monetag;
        const watchAd = window.confirm('無料回数を使い切りました。広告を見てこの盤面のみ詳細分析を有効にしますか？');
        if (!watchAd) return false;

        // 最新の Zone ID に更新（提供された画像より）
        const zoneId = 10831871;

        return new Promise<boolean>(async (resolve) => {
            const applyReward = async () => {
                try {
                    setIsLoading(true);
                    // チケット枚数は増やさず、このセッションのみ解禁状態にする
                    setIsUnlocked(true);
                    // 完了通知
                    alert('広告視聴ありがとうございます。詳細分析が有効になりました。');
                    resolve(true);
                } catch (err) {
                    console.error(err);
                    alert('エラーが発生しました');
                    resolve(false);
                } finally {
                    setIsLoading(false);
                }
            };

            const monetag = (window as any).monetag;
            if (monetag && typeof monetag.showRewardedAd === 'function') {
                monetag.showRewardedAd(
                    zoneId,
                    () => { applyReward(); },
                    () => {
                        alert('広告が閉じられました。');
                        resolve(false);
                    }
                );
            } else {
                // SDK未読み込み時も直接解禁（フォールバック）
                applyReward();
            }
        });
        */

        const upgrade = window.confirm('無料回数を使い切りました。Pro プランにアップグレードして、高精度の詳細分析を無制限に利用しませんか？');
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
