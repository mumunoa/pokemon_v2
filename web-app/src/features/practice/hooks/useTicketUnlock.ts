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

        const monetag = (window as any).monetag;
        /*
        console.log('[useTicketUnlock] Monetag SDK status:', {
            exists: !!monetag,
            showRewardedAd: typeof monetag?.showRewardedAd
        });
        */

        const watchAd = window.confirm('無料回数を使い切りました。広告を見て1回分を回復しますか？');
        if (!watchAd) return false;

        const zoneId = 224540;
        const recoverApi = '/api/monetization/tickets/recover';

        return new Promise<boolean>(async (resolve) => {
            const applyReward = async () => {
                try {
                    setIsLoading(true);
                    // 広告視聴完了に応じてDBのチケットを+1（回復）させる
                    const res = await fetch(recoverApi, { method: 'POST' });
                    if (!res.ok) {
                        alert('広告報酬の付与に失敗しました');
                        resolve(false);
                        return;
                    }
                    // その場の分析を即座に解禁（この状態はデッキ変更まで維持）
                    setIsUnlocked(true);
                    await refreshProfile();
                    alert('広告視聴ありがとうございます。チケットを1枚獲得しました。');
                    resolve(true);
                } catch (err) {
                    console.error(err);
                    alert('通信エラーが発生しました');
                    resolve(false);
                } finally {
                    setIsLoading(false);
                }
            };

            // Monetag SDK が利用可能な場合は視聴完了を待機
            const monetag = (window as any).monetag;
            if (monetag && typeof monetag.showRewardedAd === 'function') {
                monetag.showRewardedAd(
                    zoneId,
                    () => { // onAdCompleted
                        applyReward();
                    },
                    () => { // onAdDismissed
                        alert('広告が閉じられました。チケットを受け取るには最後まで視聴してください。');
                        resolve(false);
                    }
                );
            } else {
                // Monetag が読み込まれていない場合（アドブロック等）は直接APIを叩くか、警告を出すか
                // ユーザー利便性を考慮して一旦直接API実行を試みる（または別の広告方式への切り替え）
                // console.warn('Monetag SDK not loaded. Falling back to direct API call.');
                applyReward();
            }
        });
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
