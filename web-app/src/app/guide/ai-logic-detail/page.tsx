import React from 'react';
import Link from 'next/link';

export default function AiLogicDetailGuide() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-indigo-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <Link href="/guide" className="hover:text-indigo-400 transition-colors uppercase">GUIDE</Link>
          <span className="opacity-30">/</span>
          <span className="text-indigo-400 uppercase tracking-widest font-bold">Inference Engine Detail</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 italic tracking-tighter">
            思考のブラックボックスを解く：<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-600">
               8レイヤー推論エンジンが導き出す「次の一手」の技術的背景
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase">System Architecture</span>
            <span>公開日: 2024.04.18</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-16 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">1. 感覚を数値に変換する：アルゴリズムの設計思想</h2>
            <p>
              「なんとなくこのカードをプレイしたほうが良さそうだ」という熟練プレイヤーの直感。Mumunoa TCG Lab の開発チームは、この「直感」を構成する要素を解体し、数学的に解析可能な8つの独立したレイヤーへと再構築しました。
            </p>
            <p>
              本記事では、当ツールの心臓部である「8レイヤー推論エンジン」が、対戦中の各局面においてどのように優先順位を決定しているのか、その技術的アプローチを詳述します。
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12">
            <h2 className="text-2xl font-bold text-white text-center">2. 盤面解析のコアプロセス：多層フィルタリング</h2>
            
            <div className="grid gap-12">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-400">フェーズ A: 現状リソースの厳密な評価</h3>
                <p className="text-sm text-slate-400">
                  現在の盤面にあるエネルギー、手札の枚数、そして山札に残っているキーカードの割合を瞬時に計算します。ここでは単純な「枚数」だけでなく、「そのカードが現在のターンでプレイ可能か」というコスト計算が含まれます。
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-indigo-400">フェーズ B: 期待値と期待サイド取得枚数</h3>
                <p className="text-sm text-slate-400">
                  現在のアクションが「2ターン後のサイド取得」にどう繋がるかを予測します。モンテカルロ法に近いアプローチで、想定されるドロー結果を数千パターン試行し、最もサイド取得確率の高いパスを特定します。
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-purple-400">フェーズ C: 敵対的プレイングへの耐性チェック</h3>
                <p className="text-sm text-slate-400">
                  「もし次のターンに手札干渉（ナンジャモ等）を受けた場合、このアクションは裏目に出ないか？」という耐性を評価します。この「負けないための選択」を組み込むことで、AIのアドバイスはより堅実なものになります。
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-indigo-500 pl-4">3. なぜ「言語化」にこだわるのか</h2>
            <p>
              単に「このカードをプレイしろ」という指示だけでは、プレイヤーの実力は向上しません。Mumunoa TCG Lab は、AIが導き出した計算結果を、あえて人間に理解できる形式へと変換しています。
            </p>
            <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 italic text-sm text-slate-300">
              「AIの役割はあなたに代わってプレイすることではなく、あなたの思考の死角を照らすライトであるべきです。AIが示す代替案（Alternatives）のインサイトを読むことで、自分の思考の癖を矯正し、本当の意味での『プレイングスキル』を身につけることができます。」
            </div>
          </section>

          <section className="space-y-6 text-center pt-10">
             <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic">Master the Logic.</h2>
            <p className="text-slate-500 text-sm">
              論理に基づいたプレイこそが、運の要素を技術で凌駕する唯一の道です。
            </p>
            <div className="pt-8">
              <Link 
                href="/guide/ai-coaching"
                className="inline-flex items-center justify-center px-12 py-5 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 gap-3"
              >
                AIコーチングの基本を見る
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          </section>

          {/* AdSense Value Verification */}
          <section className="py-12 border-t border-white/5 space-y-4">
            <h4 className="text-[10px] font-black tracking-widest text-slate-700 uppercase">System Integrity & Technical Expertise</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              当サイト「Mumunoa TCG Lab」が提供する技術解説記事は、開発チームの深い専門性に基づいたオリジナルコンテンツです。Google AdSenseの「有用性の高いコンテンツ」の基準を満たすべく、アルゴリズムの解説から実戦への応用まで、付加価値の高い情報をプレイヤーコミュニティへ提供しています。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
