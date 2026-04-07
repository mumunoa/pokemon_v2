import React from 'react';
import Link from 'next/link';

export default function DeckStabilityGuide() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-purple-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-purple-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <span className="text-slate-400 uppercase">GUIDE</span>
          <span className="opacity-30">/</span>
          <span className="text-purple-400 uppercase tracking-widest font-bold">Deck Stability Analysis</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">
            事故率を最小化する<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
              デッキ構築の極意
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold tracking-widest">DATA ARCHITECTURE</span>
            <span>最終更新: 2024.04.07</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-12 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">1. なぜ「安定性」が勝率の 8 割を決めるのか</h2>
            <p>
              ポケモンカード（ポケカ）において、どれほど強力なコンボを搭載したデッキであっても、「たねポケモンが並ばない」「サポートが引けない」といった、いわゆる「事故（手札詰まり）」が発生した時点で敗北のリスクは飛躍的に高まります。<br />
              トーナメントシーンにおいて、上位入賞するプレイヤーが口を揃えて「安定性」を重視するのは、運の要素を極限まで排除し、実力が反映される試行回数を増やすためです。
            </p>
            <p>
              Mumunoa TCG Lab は、あなたのデッキが本番でどれほど「事故る」のかを、統計学に基づいて可視化します。
            </p>
          </section>

          <section className="bg-purple-500/5 border border-purple-500/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">2. 1000回シミュレーションが導き出す「真の事故率」</h2>
            <p>
              通常の「一人回し」を 10 回行うだけでは、本当の安定性は分かりません。当ツールのシミュレーションエンジンは、一瞬で 1,000 回の対局開始時を再現し、以下の主要指標を算出します。
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { t: "初動展開成功率 (Seed Rate)", d: "最初のターンの終わりまでに、理想的な盤面（アタッカーの準備等）が整う確率。" },
                { t: "事故発生率 (Brick Rate)", d: "サポートが 2 ターン以上使えない、または動けない手札になる確率。" },
                { t: "サイド落ち期待値", d: "特定のキーカード（エーススペック等）がサイドに埋まってしまう確率と影響度。" },
                { t: "後攻・先行別勝率予測", d: "じゃんけんの結果が初動展開に与える統計的な影響。" }
              ].map((item, i) => (
                <div key={i} className="bg-purple-950/30 p-4 rounded-xl border border-purple-500/10">
                  <div className="text-purple-400 font-bold mb-1 text-sm">【{item.t}】</div>
                  <div className="text-xs text-slate-400">{item.d}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">3. 指標の判断基準：あなたのデッキは「合格」か？</h2>
            <p>
              シミュレーション結果をどう構築に反映すべきか、一般的な目安を解説します。
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-6 py-4">展開成功率</th>
                    <th className="px-6 py-4">判定</th>
                    <th className="px-6 py-4">アドバイス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="px-6 py-4 text-emerald-400 font-bold">85% 以上</td>
                    <td className="px-6 py-4">神構築</td>
                    <td className="px-6 py-4 text-slate-400 italic">完成されています。プレイングの練習に注力しましょう。</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-amber-400 font-bold">70% 〜 84%</td>
                    <td className="px-6 py-4">標準的</td>
                    <td className="px-6 py-4 text-slate-400 italic">ボール系やドローサポートを 1〜2 枚増強を検討。</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-red-400 font-bold">70% 未満</td>
                    <td className="px-6 py-4">要調整</td>
                    <td className="px-6 py-4 text-slate-400">大振りのコンボを削り、安定札を入れる必要があります。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">4. 構築を研ぎ澄ますための実践ステップ</h2>
            <p>
              シミュレーション結果を受けて、デッキを微調整する際のポイントを 3 つ挙げます。
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "サーチ札のバランス", desc: "ネストボールとハイパーボール、どちらがあなたのデッキの初動を支えているか枚数を入れ替えて再計算します。" },
                { title: "サポーターの質", desc: "博士の研究かナンジャモか。初動のドロー期待値にフォーカスしてシミュレーションを回しましょう。" },
                { title: "メタカードの取捨選択", desc: "特定の相手への対策札を入れすぎて、自分の動きが止まっていないか数値で厳しくチェックします。" }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                  <h4 className="font-bold text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-12 border-t border-white/5 text-center">
            <h2 className="text-xl font-bold text-white mb-8">「なんとなく」の構築から卒業しませんか？</h2>
            <Link 
              href="/practice"
              className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-lg shadow-xl shadow-purple-600/30 transition-all active:scale-95 gap-2"
            >
              今すぐデッキの安定性を計測する
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}
