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
          <div className="text-sm text-slate-400">現在のプラン: <span className="font-bold text-white">{PUBLIC_PLANS.find((p) => p.id === currentPlanId)?.name ?? 'Free'}</span></div>
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
                <button onClick={() => handlePlanCheckout(plan.id, plan.stripePriceId)} disabled={isLoadingProfile || isCurrent || isProcessing !== null} className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-black transition ${isCurrent ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-950 hover:bg-slate-200'} disabled:cursor-not-allowed disabled:opacity-60`}>
                  {isCurrent ? '現在のプラン' : isProcessing === `plan:${plan.id}` ? '処理中...' : `${plan.name}へ進む`}
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
      </div>
    </div>
  );
}
