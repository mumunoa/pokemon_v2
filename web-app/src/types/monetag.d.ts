/**
 * Monetag (PropellerAds) SDK のグローバル型定義
 */
interface Monetag {
    showRewardedAd: (
        zoneId: number, 
        onComplete: () => void, 
        onDismiss: () => void
    ) => void;
    // 必要に応じて他のメソッドも追加可能
}

interface Window {
    monetag?: Monetag;
}
