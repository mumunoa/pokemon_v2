import React from 'react';
import Link from 'next/link';

export default function DragapultMetaGuide() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-indigo-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <Link href="/guide" className="hover:text-indigo-400 transition-colors uppercase">GUIDE</Link>
          <span className="opacity-30">/</span>
          <span className="text-indigo-400 uppercase tracking-widest font-bold">Meta Analysis</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 italic tracking-tighter">
            超火力の新星：<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
               ドラパルトex と「ダメカンバラマキ」の戦術論
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase">Meta Report</span>
            <span>公開日: 2024.04.18</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-16 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">1. ドラパルトex が変える環境の定義</h2>
            <p>
              最新レギュレーションで登場したドラパルトexは、ワザ「ファントムダイブ」によるベンチへのダメカン6個（60ダメージ）のばらまきが極めて強力なアタッカーです。
              このデッキの強みは、正面の相手を倒すだけでなく、相手のベンチにいる進化前のたねポケモンを同時に一掃し、相手の展開プランを根底から破壊できる点にあります。
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
            <h2 className="text-2xl font-bold text-white">2. 一人回しで磨くべき「ダメカンの置き場所」</h2>
            <p className="text-sm text-slate-400">
              ドラパルトex を使いこなす上で、最も「実力」が試されるのがダメカンの配置です。一人回しツールでは以下のシナリオを練習しましょう。
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-indigo-400">HP60/70ラインの意識</h3>
                <p className="text-sm text-slate-500">
                  現在の環境に多いマナフィやラルトス、ヒトカゲなどのHPラインを意識し、1回の技で最大何体のポケモンを気絶圏内に持っていけるか、シミュレーションを繰り返します。
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-indigo-400">「詰め」のダメカン配置</h3>
                <p className="text-sm text-slate-500">
                  終盤にHPの高いexポケモンを倒すために、あらかじめどれくらいのダメカンを乗せておけば「ボスの指令」を使わずにサイドを取り切れるか、最適な配分を探ります。
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">3. AIコーチと共に挑む「リソース管理」の難問</h2>
            <p>
              ドラパルトex は強力ですが、1進化ポケモンであること、そして要求エネルギー（超炎）が特殊であることから、構築の安定性が課題となります。
            </p>
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-3xl italic text-sm text-slate-400">
               「AIコーチ機能を使えば、手貼りのタイミングやエネルギー転送の使用順序など、序盤の事故を最小限に抑えるための『確率的に正しい動き』を学ぶことができます。特に、ネイティオやメロコとの組み合わせによる加速プランの最適解をAIと共に導き出しましょう。」
            </div>
          </section>

          <section className="py-12 border-t border-white/5 space-y-4 text-center">
            <h4 className="text-[10px] font-black tracking-widest text-slate-700 uppercase">Advanced Strategic Information</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Mumunoa TCG Lab は、単なるデータ提供に留まらず、プレイヤーが「なぜその選択をするのか」を深く理解するためのコンテキストを提供しています。AdSenseポリシーに基づいた高度なオリジナル記事を通じて、健全なファンコミュニティの発展を支援しています。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
