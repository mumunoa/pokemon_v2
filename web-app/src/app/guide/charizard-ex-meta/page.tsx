import React from 'react';
import Link from 'next/link';

export default function CharizardMetaGuide() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-red-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <Link href="/guide" className="hover:text-red-400 transition-colors uppercase">GUIDE</Link>
          <span className="opacity-30">/</span>
          <span className="text-red-400 uppercase tracking-widest font-bold">Meta Analysis</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 italic tracking-tighter">
            環境の覇者：<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-amber-600">
               悪リザードンex の一人回しと環境メタの重要性
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-widest uppercase">Meta Report</span>
            <span>公開日: 2024.04.18</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-16 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-red-500 pl-4">1. なぜ「悪リザードンex」は最強であり続けるのか</h2>
            <p>
              ポケモンカードゲームの現環境（2024年4月）において、悪テラスタルのリザードンexは、高いHP、手札の供給、そして終盤の圧倒的な火力という三拍子が揃ったデッキです。初心者からプロまで広く愛用されていますが、そのポテンシャルを100%引き出すには、緻密な一人回しによるリソース管理が不可欠です。
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white">2. 一人回しで意識すべき「盤面形成の優先順位」</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-orange-400">ヒトカゲの並びと展開</h3>
                <p className="text-xs text-slate-500">
                  最初のターン、ヒトカゲを最低2体、できればピジョットexへの進化を見据えてポッポをベンチに出すことが必須です。一人回しツールを使って、100回中何回この盤面が作れるかシミュレーションしましょう。
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-orange-400">サイドプランの逆算</h3>
                <p className="text-xs text-slate-500">
                  リザードンexの特性「れんごくしはい」で持ってくるエネルギーの枚数には限りがあります。終盤の「バーニングダーク」で最大火力を出すために、どのタイミングでリザーレンを起動させるか逆算する練習が重要です。
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-red-500 pl-4">3. AIコーチングが見抜く、リザードンexの「死角」</h2>
            <p>
              Mumunoa TCG Lab のAI分析エンジンは、リザードンexの圧倒的なパワーの影にあるリスクも可視化します。
            </p>
            <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl">
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                  <span><strong>サイド1枚の重み:</strong> 相手がサイドをわざと1枚残して「詰む」状況を作っていないか、AIはサイド取得枚数による火力の変動をリアルタイムで警告します。</span>
                </li>
                <li className="flex gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                  <span><strong>山札の枯渇リスク:</strong> ピジョットexによる確定サーチを繰り返す中で、終盤に必要なグッズが山札に残るよう管理する高度な判断力が求められます。</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="py-12 border-t border-white/5 space-y-4 text-center">
            <h4 className="text-[10px] font-black tracking-widest text-slate-700 uppercase">Competitive Intelligence Document</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Mumunoa TCG Lab では、最新のメタゲームに基づいたデータ分析を提供しています。Google AdSenseにおける「専門性の高いコンテンツ」の提供を通じ、ポケカプレイヤー全体の知見の底上げに寄与することを目指しています。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
