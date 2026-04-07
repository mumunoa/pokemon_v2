import React from 'react';
import Link from 'next/link';

export default function AiCoachingGuide() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-indigo-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <span className="text-slate-400 uppercase">GUIDE</span>
          <span className="opacity-30">/</span>
          <span className="text-indigo-400 uppercase tracking-widest font-bold">AI Coaching Technology</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">
            AIコーチが教える、ポケカの<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-orange-400">
              「次の一手」を見極めるための全技術
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest">TECHNICAL ARTICLE</span>
            <span>最終更新: 2024.04.07</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-12 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">1. なぜ、今「AIによる分析」が必要なのか</h2>
            <p>
              近年のポケモンカードゲーム（ポケカ）は、カードの相互作用が複雑化し、わずか1ターンのプレイミスが勝敗を決定づける「シビアな読み」が求められる時代になりました。<br />
              一人の頭脳だけで全ての可能性を網羅することは難しく、客観的なデータに基づいた「正解」の確認が、上達の鍵を握っています。
            </p>
            <p>
              Mumunoa TCG Lab が提供する AI コーチングは、単に「強い手」を教えるだけではありません。
              トッププレイヤーが無意識に行っている「盤面の多層的解釈」を言語化し、あなたの思考プロセスをアップデートすることを目的としています。
            </p>
          </section>

          <section className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">2. 独自技術「8レイヤー推論エンジン」の仕組み</h2>
            <p>
              当ツールの AI コーチは、盤面を以下の 8 つのレイヤーで同時に分析し、総合的なスコアを算出しています。
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { t: "リソース層", d: "エネルギー、手札、山札の残数を確認" },
                { t: "テンポ層", d: "サイド取得のスピードとターンの収支を計算" },
                { t: "確率層", d: "サイド落ち、ドロー、サーチの成功率をシミュレーション" },
                { t: "要求値層", d: "相手が次ターン、キルを取るために必要な手数を算出" },
                { t: "定石層", d: "現在の流行デッキ（メタ）特有の最適な動きとの照合" },
                { t: "リスク層", d: "最悪のシナリオ（手札干渉、ボスの指令等）への耐性" },
                { t: "プラン層", d: "ゲーム終盤までの2-2-2ルート等の最短経路探索" },
                { t: "心理層", d: "相手のプレイングの癖から見えない手札を予測（開発中）" }
              ].map((item, i) => (
                <div key={i} className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/10">
                  <div className="text-indigo-400 font-bold mb-1 text-sm">【{item.t}】</div>
                  <div className="text-xs text-slate-400">{item.d}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">3. 分析結果の読み方：推奨アクションと代替案</h2>
            <p>
              AI が提案する「おすすめの一手」には、必ずその根拠となる理由（メリット・デメリット）が記述されています。
              多くのプレイヤーは「メリット」だけを見てプレイを決めがちですが、上級者ほど「デメリット（リスク）」を重視します。
            </p>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs">★</span>
                思考を深めるヒント
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed italic">
                「AI が別の手を提案している場合、それはあなたが現在の手札だけでなく、山札の資源や相手の返しの一手を軽視しているサインかもしれません。代替案（Alternatives）のインサイト、特に『なぜその手が選ばれなかったのか』というリスク評価を熟読してください。」
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">4. 勝利へのショートカット：一人回しのルーチン化</h2>
            <p>
              ツールの価値を最大化するためには、以下の 3 ステップを繰り返すことを推奨しています。
            </p>
            <div className="grid gap-6">
              {[
                { step: "01", title: "自分の直感でプレイ", desc: "まずは AI の結果を見ずに、自分のプランで回します。" },
                { step: "02", title: "AI 分析を実行", desc: "自分の手と AI の提案を比較し、『なぜ AI はそちらを選んだのか』を考えます。" },
                { step: "03", title: "巻き戻し機能を活用", desc: "AI が提案したルートを物理的に試してみることで、盤面の風景がどう変わるか体感します。" }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <span className="text-4xl font-black text-indigo-500 opacity-20">{item.step}</span>
                  <div>
                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-12 border-t border-white/5 text-center">
            <h2 className="text-xl font-bold text-white mb-8">準備は整いましたか？</h2>
            <Link 
              href="/practice"
              className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg shadow-xl shadow-indigo-600/30 transition-all active:scale-95 gap-2"
            >
              今すぐ AI コーチングを体験する
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}
