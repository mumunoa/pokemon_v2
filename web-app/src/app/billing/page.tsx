'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function BillingPage() {
    const { profile, isSignedIn, getToken, isLoadingProfile } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const handleMockUpgrade = async (plan: string) => {
        if (!isSignedIn) {
            alert('ログインが必要です');
            return;
        }

        setIsProcessing(true);
        setMessage('');

        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error('Auth token not found');

            const supabase = createSupabaseClient(token);
            if (!supabase) throw new Error('Supabase client error');

            // Simulate some delay for "Checkout"
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { error } = await supabase
                .from('users')
                .update({ 
                    plan_type: plan,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile?.id);

            if (error) throw error;

            setMessage(`${plan === 'pro' ? 'プロ' : 'エリート'}プランへアップグレードしました！`);
            // Force reload or let useAuth re-fetch naturally
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('アップグレードに失敗しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const plans = [
        {
            id: 'free',
            name: '無料',
            price: '¥0',
            description: 'ポケカAIの精度を試したい方向け',
            features: [
                'おすすめの一手表示',
                '基本的な盤面分析',
                '1日10回程度の制限',
            ],
            buttonText: '現在のプラン',
            isCurrent: profile?.plan_type === 'free' || !profile?.plan_type,
            gradient: 'from-slate-700 to-slate-800'
        },
        {
            id: 'pro',
            name: 'プロ',
            price: '¥980',
            period: '/月',
            description: '勝率を本気で上げたい中級者向け',
            features: [
                '行動理由の詳細解説',
                'メリット・デメリット提示',
                'リスク分析・負け筋警告',
                '優先サーバー利用',
            ],
            buttonText: 'プロへアップグレード',
            isCurrent: profile?.plan_type === 'pro',
            highlight: true,
            gradient: 'from-purple-600 to-indigo-700'
        },
        {
            id: 'elite',
            name: 'エリート',
            price: '¥2,980',
            period: '/月',
            description: '世界を目指すガチ勢・競技プレイヤー向け',
            features: [
                '相手のサイド落ち/手札推定',
                'デッキ相性メタ分析',
                'Claude 3.5 高度相談室',
                'プレイ履歴ミス解析',
            ],
            buttonText: 'エリートプランを契約',
            isCurrent: profile?.plan_type === 'elite',
            gradient: 'from-amber-500 to-orange-700'
        }
    ];

    const getPlanDisplayName = (type: string | undefined) => {
        const t = (type || 'free').toLowerCase();
        if (t === 'pro') return 'プロ';
        if (t === 'elite') return 'エリート';
        return '無料';
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full"></div>
            </div>

            <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
                    <span className="font-bold text-slate-400 group-hover:text-white transition-colors">戻る</span>
                </Link>
                <div className="text-sm font-medium bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                    現在のプラン: <span className="text-purple-400 font-bold uppercase">{getPlanDisplayName(profile?.plan_type)}</span>
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 text-center">
                <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent italic tracking-tighter">
                    レベルアップ。
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto mb-16 text-lg">
                    AIコーチング知能を解禁して、あなたのプレイングを科学的に進化させましょう。
                </p>

                {message && (
                    <div className="mb-8 p-4 bg-green-500/20 border border-green-500/50 text-green-300 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                        {message}
                    </div>
                )}

                <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 items-start overflow-x-auto md:overflow-x-visible pt-6 pb-8 md:pb-0 px-4 -mx-4 snap-x snap-mandatory hide-scrollbar">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id}
                            className={`relative group bg-slate-900/40 rounded-[32px] p-8 border hover:scale-[1.02] transition-all duration-300 min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-center ${plan.highlight ? 'border-purple-500/50 shadow-2xl shadow-purple-500/10' : 'border-slate-800'}`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest z-10">
                                    人気
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}プラン</h3>
                                <div className="flex items-baseline justify-center gap-1 mb-4">
                                    <span className="text-4xl font-black">{plan.price}</span>
                                    {plan.period && <span className="text-slate-500 text-sm font-bold">{plan.period}</span>}
                                </div>
                                <p className="text-slate-400 text-xs min-h-[32px]">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="space-y-4 mb-10 text-left">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="text-indigo-400">✦</span>
                                        <span className="text-slate-300 text-sm leading-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                disabled={plan.isCurrent || isProcessing}
                                onClick={() => handleMockUpgrade(plan.id)}
                                className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${plan.isCurrent ? 'bg-slate-800 text-slate-500' : `bg-gradient-to-br ${plan.gradient} text-white shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20`}`}
                            >
                                {isProcessing && !plan.isCurrent ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        処理中...
                                    </span>
                                ) : plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-20 p-10 bg-slate-900/20 border border-slate-800/50 rounded-[40px] text-left max-w-4xl mx-auto">
                    <h4 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <span className="text-2xl">🛡️</span> 
                        安心のサポート
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                        <div>
                            <p className="text-slate-200 font-bold mb-2">いつでもキャンセル可能</p>
                            <p className="text-slate-500">
                                全ての有料プランは設定からいつでもワンクリックで解約できます。解約後も期間終了まで全機能をご利用いただけます。
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-200 font-bold mb-2">安全な決済</p>
                            <p className="text-slate-500">
                                世界シェアNo.1のStripeを採用。カード情報は当サービスのサーバーを介さず直接Stripeに送信されるため安心です。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
