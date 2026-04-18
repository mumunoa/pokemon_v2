import React from 'react';
import Link from 'next/link';

export default function BeginnerPracticeGuide() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-emerald-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <Link href="/guide" className="hover:text-emerald-400 transition-colors uppercase">GUIDE</Link>
          <span className="opacity-30">/</span>
          <span className="text-emerald-400 uppercase tracking-widest font-bold">Standard Practice</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 italic tracking-tighter">
            初心者向け：<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500">
              一人回し（ソリティア）の基本と効率的ステップアップ
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">Fundamental Guide</span>
            <span>公開日: 2024.04.18</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-16 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-emerald-500 pl-4">1. なぜ「対戦」の前の一人回しが重要なのか</h2>
            <p>
              ポケモンカードゲーム（ポケカ）において、対人戦は最もエキサイティングな体験ですが、上達への近道は実は「一人で山札を回す時間」にあります。これをプレイヤー間では「一人回し」や「ソリティア」と呼びます。
            </p>
            <p>
              一人回しの目的は、単にカードを出すスピードを上げることではありません。自分のデッキが**「平均して何ターン目に、どのような盤面を作れるか」**という期待値を体に叩き込むことにあります。
              この「自分のデッキの限界値」を知っておくことで、本番の対人戦で「今は攻めるべきか、待つべきか」という判断を冷静に行えるようになります。
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12">
            <h2 className="text-2xl font-bold text-white text-center">2. 初心者がまず実践すべき「3つの段階」</h2>
            
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">01</div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">カードの「つながり」を確認する（基本展開）</h3>
                    <p className="text-sm text-slate-400">
                      まずは対戦相手がいることを想定せず、2〜3ターン目までに自分の理想とする盤面（メインアタッカーにエネルギーがつき、ベンチにシステムポケモンが並んでいる状態）を作る練習をしましょう。
                      どのサーチ札からどのカードを持ってくるのが最適か、手順の最適化を目指します。
                    </p>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">02</div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">「サイド落ち」の確認習慣をつける</h3>
                    <p className="text-sm text-slate-400">
                      山札を最初にチェックした際（ネストボール等を使った時）に、特定の重要なカードがサイドに埋まっていないかを確認する練習です。
                      「キーカードがない場合にどう動くか」というプランBを考える癖をつけることが、勝率を安定させる最大の秘訣です。
                    </p>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shrink-0">03</div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">手札干渉へのシミュレーション</h3>
                    <p className="text-sm text-slate-400">
                      「もし今、ナンジャモやツツジを使われたら？」と仮定してプレイします。
                      手札が4枚以下になっても次のターンの動きが止まらないよう、盤面のリソースをどう管理するかを意識する段階です。
                    </p>
                  </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-emerald-500 pl-4">3. Mumunoa TCG Lab が一人回しを劇的に変える理由</h2>
            <p>
              紙のカードで一人回しをするのは準備や片付けが大変ですが、Mumunoa TCG Lab のシミュレーターを使えば、これら全ての行程をデジタルで、かつ高速に行えます。
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <h4 className="font-bold text-white">一瞬で「初期化」</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  シャッフルやサイド置きをボタン一つで実行。試行回数を稼ぐことが上達の絶対条件である以上、このスピード感は最大の武器になります。
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <h4 className="font-bold text-white">AI による客観的なアドバイス</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  自分の手が「果たして正解なのか」という不安に対し、AIコーチがデータに基づいた解答を示します。自分の独りよがりなプレイを防ぐことができます。
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6 text-center pt-10">
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic">Practice Makes Perfect.</h2>
            <p className="text-slate-500 text-sm">
              一流のプレイヤーほど、人に見えない場所で地味な一人回しを繰り返しています。
            </p>
            <div className="pt-8">
              <Link 
                href="/practice"
                className="inline-flex items-center justify-center px-12 py-5 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl shadow-xl shadow-emerald-600/30 transition-all active:scale-95 gap-3"
              >
                一人回しを開始 (無料)
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          </section>

          {/* AdSense Technical Volume Check */}
          <section className="py-12 border-t border-white/5 space-y-4">
            <h4 className="text-[10px] font-black tracking-widest text-slate-700 uppercase">Training Scientific Methodology</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              当サイト「Mumunoa TCG Lab」が提唱する練習メソッドは、単なる反復練習ではなく、統計データとAIによる客観的事実に基づいています。一人回しの中で発生する「わずかなプレイの乖離」を可視化することで、感覚に頼らない真の実力を身につけることを目指しています。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
