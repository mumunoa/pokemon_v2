import React from 'react';
import Link from 'next/link';

export default function PracticeTips() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-emerald-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <span className="text-slate-400 uppercase">STRATEGY</span>
          <span className="opacity-30">/</span>
          <span className="text-emerald-400 uppercase tracking-widest font-bold">Advanced Practice Methods</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">
            大会で勝つための<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              「一人回し」練習法
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest">PRACTICE METHODOLOGY</span>
            <span>最終更新: 2024.04.07</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-12 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-emerald-500 pl-4">1. トッププロの秘密：なぜ「一人回し」が重要なのか</h2>
            <p>
              ポケモンカードのトッププレイヤーたちは、例外なく「一人回し」に膨大な時間を費やしています。<br />
              対人戦は「読み合い」を楽しむものですが、一人回しは「自分のデッキとプレイングの限界」を知るための、いわば基礎体力作りです。<br />
              Mumunoa TCG Lab を活用した、最先端の練習ルーチンを 5 つのステップで紹介します。
            </p>
          </section>

          <section className="space-y-10">
            {[
              { 
                step: "Tip 01", 
                title: "具体的目標を想定した「課題練習」", 
                desc: "ただ回すのではなく、『2ターン目までにサイドを1枚取る確率を上げる』『後攻でサポートを使うまでを安定させる』など、目的を持って練習しましょう。シミュレーション数値を見ながら、成功率を 1% ずつ上げる構築を模索してください。" 
              },
              { 
                step: "Tip 02", 
                title: "AI による「別ルート」の徹底検証", 
                desc: "自分が正しいと思ったプレイに対し、AIコーチが『代替案（Alternatives）』を出してきたらチャンスです。一度そのルートで巻き戻してプレイしてみることで、自分が見逃していた『数ターン先の盤面風景』を予見する訓練になります。" 
              },
              { 
                step: "Tip 03", 
                title: "「最悪のシナリオ（ハードモード）」での練習", 
                desc: "手札干渉やサイド落ちなど、最悪の状況をあえて作り出し、そこからどう立て直すべきかを AI と共に考えます。AIコーチの『リスク管理レイヤー』を読むことで、不利な状況下での最適な妥協点を見出す力が養われます。" 
              },
              { 
                step: "Tip 04", 
                title: "「定石」を超えた独自ルートの発見", 
                desc: "AI が常に正解とは限りません。AI の提案に対して『自分のプランだともっと早くサイドを取りきれるのでは？』と疑問を持ち、シミュレーション回数を増やして実証する姿勢が、独創的なメタ読みへと繋がります。" 
              },
              { 
                step: "Tip 05", 
                title: "データの蓄積と振り返り", 
                desc: "各セッションの結果を振り返り、自分のデッキがどの環境（メタ）に対して安定しているか、弱点はどこかを客観的に評価しましょう。データは嘘をつきません。" 
              }
            ].map((tip, i) => (
              <div key={i} className="bg-emerald-950/20 rounded-3xl border border-emerald-500/10 overflow-hidden">
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-emerald-500/10">
                  <div className="p-8 md:w-48 flex items-center justify-center bg-emerald-500/5">
                    <span className="text-xl font-black text-emerald-400">{tip.step}</span>
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-xl font-bold text-white mb-4">{tip.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-emerald-500 pl-4">3. 練習は嘘をつかない、データを味方に</h2>
            <p className="leading-relaxed">
              一日の練習時間は限られています。だからこそ、質の高い一人回しを行うことが最短の上達ルートです。
              Mumunoa TCG Lab は、あなたの練習をただの「作業」から「科学的なデータ収集」へと変貌させます。
            </p>
          </section>

          <section className="pt-12 border-t border-white/5 text-center">
            <h2 className="text-xl font-bold text-white mb-8">次のレベルへ進化する準備をしましょう。</h2>
            <Link 
              href="/practice"
              className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg shadow-xl shadow-emerald-600/30 transition-all active:scale-95 gap-2"
            >
              一人回しの質を劇的に向上させる
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}
