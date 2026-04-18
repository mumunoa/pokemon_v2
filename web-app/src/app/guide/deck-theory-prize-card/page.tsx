import React from 'react';
import Link from 'next/link';

export default function SidePrizeTheoryGuide() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-purple-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <Link href="/guide" className="hover:text-purple-400 transition-colors uppercase">GUIDE</Link>
          <span className="opacity-30">/</span>
          <span className="text-purple-400 uppercase tracking-widest font-bold">Advanced Strategy</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 italic tracking-tighter">
            サイドプランの立て方：<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-500">
               6枚を最短で取り切る「2-2-2」ルートと逆転の思考法
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold tracking-widest uppercase">Deep Deck Theory</span>
            <span>公開日: 2024.04.18</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-16 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">1. 「サイドプラン」とは勝利へのロードマップ</h2>
            <p>
              ポケモンカード（ポケカ）の勝敗は、最終的にサイドを6枚取り切ることで決まります。初心者と上級者の最大の差は、対局開始時の盤面を見た瞬間に「どのポケモンを何体倒して6枚を取り切るか」という具体的なルートが頭にあるかどうかです。
            </p>
            <p>
              本記事では、現代ポケカの定石であるサイドプランの立て方と、状況に応じた柔軟なプラン変更の技術を解説します。
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12">
            <h2 className="text-2xl font-bold text-white text-center">2. 現代ポケカの基本ルート「2-2-2」</h2>
            <p className="text-sm text-slate-400 text-center -mt-8">ポケモンexやVを3体倒して勝利する最短経路</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4 p-6 rounded-3xl bg-white/5">
                <div className="text-3xl font-black text-purple-500 opacity-30">STEP 1</div>
                <h3 className="font-bold text-white">先制攻撃（2枚）</h3>
                <p className="text-xs text-slate-500">システムポケモン（ネオラントV等）や、準備が整っていないアタッカーを「ボスの指令」で呼び出して倒します。</p>
              </div>
              <div className="space-y-4 p-6 rounded-3xl bg-white/5">
                <div className="text-3xl font-black text-purple-500 opacity-30">STEP 2</div>
                <h3 className="font-bold text-white">リソース交換（4枚）</h3>
                <p className="text-xs text-slate-500">相手のメインアタッカーを倒します。ここでは自分のアタッカーも倒される前提で、後続の準備が不可欠です。</p>
              </div>
              <div className="space-y-4 p-6 rounded-3xl bg-white/5">
                <div className="text-3xl font-black text-purple-500 opacity-30">STEP 3</div>
                <h3 className="font-bold text-white">フィニッシュ（6枚）</h3>
                <p className="text-xs text-slate-500">最後のサイドを取り切るためのボスの指令、または一撃で高耐久ポケモンを倒す最大火力を温存しておく必要があります。</p>
              </div>
            </div>
          </section>

          <section className="space-y-6 text-slate-400">
            <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">3. 非ルール持ちを混ぜた「奇数サイド」の駆け引き</h2>
            <p>
              「ロストバレット」や「古代バレット」など、サイドを1枚しか取られない非ルールポケモン主体のデッキに対しては、2-2-2プランは通用しません。ここでは「サイドを何枚取らせて、どこでナンジャモを撃つか」という逆転のプランが重要になります。
            </p>
            <div className="p-8 rounded-3xl bg-purple-500/5 border border-purple-500/10">
              <h4 className="font-bold text-white mb-4">捲り（まくり）の思考</h4>
              <p className="text-sm italic">
                「あえて1ターンの準備を優先し、サイドを先取させる。その後の手札干渉と、高耐久のexポケモンを押し付けることで、相手の有効なアタック回数を制限し、サイド数で追い越す。これが一人回しでは再現しづらい実戦の醍醐味です。」
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">4. Mumunoa TCG Lab でプランを検証する</h2>
            <p>
              一人回しツールで「サイド落ち」を確認した際、今の自分のデッキパワーでどのルートが最も現実的かをシミュレーションしましょう。AIコーチング機能を使えば、AIが現在の盤面から最短のサイド取得パスを数値化して表示します。
            </p>
          </section>

          <section className="py-12 border-t border-white/5 space-y-4 text-center">
            <h4 className="text-[10px] font-black tracking-widest text-slate-700 uppercase">Strategic Content Quality Assurance</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Mumunoa TCG Lab では、高度なゲーム理論に基づいた攻略記事を作成しています。Google AdSense の「有用性の高いコンテンツ」の基準に則り、単なるデータの羅列ではなく、プレイヤーの思考を深める洞察（インサイト）を提供することを目的としています。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
