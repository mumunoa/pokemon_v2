import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * チケット消費やリワード広告によってPro機能を解禁するための共通ロジック
 */
export function useTicketUnlock() {
    const { profile, isSignedIn, isPro, isLoadingProfile, refreshProfile } = useAuth();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const tickets = profile?.ai_tickets ?? 0;

    const handleUnlock = async () => {
        if (isPro || isUnlocked) return true;
        if (!isSignedIn) {
            alert('ログインが必要です');
            return false;
        }

        if (isLoadingProfile) {
            alert('ログイン情報を読み込み中です。少々お待ちください。');
            return false;
        }

        if (tickets > 0) {
            const confirmed = window.confirm(`チケットを消費してProバージョンを閲覧しますか？(残り${tickets}回)`);
            if (!confirmed) return false;
            
            try {
                setIsLoading(true);
                const res = await fetch('/api/user/tickets/use', { method: 'POST' });
                if (res.ok) {
                    setIsUnlocked(true);
                    await refreshProfile(); // チケット残数を更新
                    return true;
                } else {
                    alert('チケットの消費に失敗しました');
                    return false;
                }
            } catch (err) {
                console.error(err);
                alert('通信エラーが発生しました');
                return false;
            } finally {
                setIsLoading(false);
            }
        } else {
            // チケットが0枚の場合
            const watchAd = window.confirm('チケットの回数がなくなりました。(毎日0時にチケット残数更新)\n広告を見てProバージョンを表示しますか？');
            if (watchAd) {
                // 広告シミュレーション
                try {
                    setIsLoading(true);
                    // 広告視聴完了後にチケットを1枚回復させるAPIを叩く
                    const res = await fetch('/api/user/tickets/recover', { method: 'POST' });
                    if (res.ok) {
                        setIsUnlocked(true);
                        await refreshProfile(); // チケット残数を更新
                        alert('広告視聴ありがとうございます。Pro版を解禁しました！');
                        return true;
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            }
            return false;
        }
    };

    return {
        isUnlocked: isPro || isUnlocked,
        isLoading: isLoading || isLoadingProfile,
        isLoadingProfile,
        tickets: isLoadingProfile ? null : tickets,
        handleUnlock
    };
}
