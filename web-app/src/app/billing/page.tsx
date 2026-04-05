'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/lib/supabase';
import { PUBLIC_PLANS, ADD_ONS } from '@/lib/billing/plans';
import { useEntitlement } from '@/hooks/useEntitlement';
import type { AddOnId, PublicPlanId } from '@/types/monetization';

function mapPlanToLegacy(planId: PublicPlanId): 'free' | 'pro' | 'elite' {
  return planId;
}

export default function BillingPage() {
  const { profile, isSignedIn, getToken, isLoadingProfile, refreshProfile } = useAuth();
  const entitlement = useEntitlement();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleOpenPortal = async () => {
    setIsProcessing('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'portal failed');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      alert(`管理画面の起動に失敗しました: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const currentPlanId = useMemo<PublicPlanId>(() => {
    return (profile?.plan_type ?? 'free') as PublicPlanId;
  }, [profile?.plan_type]);

  const updateProfileForMockPlan = async (planId: PublicPlanId) => {
    const token = await getToken({ template: 'supabase' });
    if (!token) throw new Error('Auth token not found');
    const supabase = createSupabaseClient(token);
    if (!supabase) throw new Error('Supabase client error');
    const { error } = await supabase.from('users').update({ plan_type: mapPlanToLegacy(planId), updated_at: new Date().toISOString() }).eq('id', profile?.id);
    if (error) throw error;
    await refreshProfile();
  };

  const updateProfileForMockAddOn = async (addOnId: AddOnId) => {
    const token = await getToken({ template: 'supabase' });
    if (!token) throw new Error('Auth token not found');
    const supabase = createSupabaseClient(token);
    if (!supabase) throw new Error('Supabase client error');
    const existing = Array.isArray((profile as any)?.pro_ai_addons) ? (profile as any).pro_ai_addons : [];
    const merged = Array.from(new Set([...existing, addOnId]));
    const { error } = await supabase.from('users').update({ pro_ai_addons: merged, updated_at: new Date().toISOString() } as any).eq('id', profile?.id);
    if (error) throw error;
    await refreshProfile();
  };

  const handlePlanCheckout = async (planId: PublicPlanId, stripePriceId?: string) => {
    if (!isSignedIn) {
      alert('ログインが必要です');
      return;
    }
    setIsProcessing(`plan:${planId}`);
    setMessage('');
    try {
      const res = await fetch('/api/billing/checkout', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ kind: 'plan', planId, priceId: stripePriceId || '' }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'checkout failed');

      // 既存サブスクリプションがある場合はポータルへ誘導（二重課金防止のセーフガード）
      if (data.mode === 'open_portal') {
        await handleOpenPortal();
        return;
      }
      
      if (data.mode === 'redirect' && data.url) {
        window.location.href = data.url;
        return;
      }
      
      if (data.mode === 'mock_update') {
        await updateProfileForMockPlan(planId);
        setMessage(`${PUBLIC_PLANS.find((p) => p.id === planId)?.name ?? planId} プランを反映しました。(Mock)`);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`失敗: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAddOnCheckout = async (addOnId: AddOnId) => {
    if (!isSignedIn) {
      alert('ログインが必要です');
      return;
    }
    setIsProcessing(`addon:${addOnId}`);
    setMessage('');
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'add_on', addOnId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'checkout failed');
      if (data.mode === 'redirect' && data.url) {
        window.location.href = data.url;
        return;
      }
      await updateProfileForMockAddOn(addOnId);
      setMessage(`${ADD_ONS.find((p) => p.id === addOnId)?.name ?? addOnId} を反映しました。`);
    } catch (err) {
      console.error(err);
      alert('Add-on更新に失敗しました');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← 戻る</Link>
          <div className="flex flex-col items-end gap-1">
            <div className="text-sm text-slate-400">現在のプラン: <span className="font-bold text-white">{PUBLIC_PLANS.find((p) => p.id === currentPlanId)?.name ?? 'Free'}</span></div>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Billing</div>
          <h1 className="mt-3 text-4xl font-black">レベルアップ。</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Free / Pro / Elite と Pro AI Add-on を分離し、無料導線を壊さずに継続課金へ接続します。</p>
        </div>

        {message ? <div className="mt-6 rounded-2xl border border-emerald-700/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {PUBLIC_PLANS.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            return (
              <article key={plan.id} className={`rounded-3xl border p-6 ${plan.recommended ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800 bg-slate-900/70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Plan</div>
                    <h2 className="mt-2 text-2xl font-black">{plan.name}</h2>
                  </div>
                  {plan.recommended ? <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-200">人気</span> : null}
                </div>
                <div className="mt-4 text-3xl font-black">¥{plan.monthlyPriceJpy.toLocaleString()}<span className="ml-1 text-sm font-bold text-slate-400">/月</span></div>
                <p className="mt-3 text-sm text-slate-300">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">{plan.features.map((feature) => <li key={feature}>✦ {feature}</li>)}</ul>
                <button 
                  onClick={() => {
                    // 有料プラン間（Pro ↔ Elite）の移動は安全のためポータルヘ誘導
                    if (currentPlanId !== 'free' && plan.id !== 'free' && !isCurrent) {
                      handleOpenPortal();
                    } else if (plan.id !== 'free') {
                      handlePlanCheckout(plan.id, plan.stripePriceId);
                    }
                  }} 
                  disabled={
                    isLoadingProfile || 
                    isCurrent || 
                    isProcessing !== null || 
                    (plan.id === 'free' && currentPlanId !== 'free') // 有料プランからFreeへの変更は解約扱いのためボタン無効化
                  } 
                  className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-black transition ${isCurrent ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-950 hover:bg-slate-200'} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isCurrent ? '現在のプラン' : 
                   isProcessing === `plan:${plan.id}` ? '処理中...' : 
                   (plan.id === 'free' && currentPlanId !== 'free') ? '画面下部より解約可能' : 
                   (currentPlanId !== 'free' && plan.id !== 'free') ? 'プランを変更する' : 
                   `${plan.name}へ進む`}
                </button>
              </article>
            );
          })}
        </section>

        {/* Pro AI Add-on セクションは一時非表示
        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            ...
          </div>
        </section>
        */}
        {/* Subscription Management Section at the bottom */}
        {currentPlanId !== 'free' && (
          <section className="mt-16 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="bg-indigo-500/10 p-3 rounded-2xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h2 className="text-xl font-bold mb-2">サブスクリプションの管理・解約</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              プランの変更、お支払い情報の更新、または定期購読の解約は、下記のStripe管理画面よりお手続きいただけます。
            </p>
            <button 
              onClick={handleOpenPortal}
              disabled={isProcessing !== null}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              {isProcessing === 'portal' ? '読み込み中...' : '管理画面（Stripe）を開く'}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
