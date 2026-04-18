'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { AdSlot } from '@/features/monetization/components/AdSlot';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isSignedIn } = useUser();
  const router = useRouter();



  const features = [
    {
      title: "AI リアルタイム分析",
      description: "AIが盤面を解析し、最適な次の一手やプレイの意図を論理的に解説します。",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M12 2v8" /><path d="m4.93 4.93 2.83 2.83" /><path d="M2 12h8" /><path d="m4.93 19.07 2.83-2.83" /><path d="M12 22v-8" /><path d="m19.07 19.07-2.83-2.83" /><path d="M22 12h-8" /><path d="m19.07 4.93-2.83 2.83" />
        </svg>
      )
    },
    {
      title: "超高速シミュレーション",
      description: "デッキの回し心地や「事故率」を数秒で算出。構築の妥当性をデータで確認可能。",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
          <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      )
    },
    {
      title: "快適な一人回し UI",
      description: "ドラッグ＆ドロップによる直感的な操作。PC・モバイル両対応で、場所を選ばず練習できます。",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
          <rect width="18" height="18" x="3" y="3" rx="2" /><path d="m10 8 5 4-5 4V8z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0c10]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 group-hover:scale-110 transition-transform">
              <Image
                src="/icon.png"
                alt="Logo"
                fill
                className="rounded-lg shadow-lg shadow-orange-500/20 object-contain"
              />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Mumunoa TCG Lab
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="/guide" className="hover:text-white transition-colors">攻略ガイド</Link>
            <Link href="/resume" className="hover:text-white transition-colors">履歴書メーカー</Link>
            <Link href="https://x.com/mumunoa_tcg" target="_blank" className="hover:text-white transition-colors">公式X</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/practice"
              className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              ツールを開始
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative pt-32 pb-10 px-6 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 blur-[80px] rounded-full -z-10" />

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              AI搭載・ポケカ一人回しコーチングツール
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
              あなたのプレイを<br className="sm:hidden" />
              AIが<br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400">
                最高峰へ導く
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Mumunoa TCG Labは、一人回しの精度を極限まで高めるシミュレーターです。<br className="hidden md:block" />
              AIによる次の一手分析、デッキの安定性検証、直感的な操作感を提供します。
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link
                href="/practice"
                className="w-full md:w-auto px-10 py-4 rounded-2xl bg-white text-black font-extrabold text-lg hover:bg-slate-200 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                一人回しを開始する
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
              <Link
                href="https://x.com/mumunoa_tcg"
                target="_blank"
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                公式Xをフォロー
              </Link>
            </div>
          </div>
        </section>

        {/* Hero Bottom Ad */}
        <div className="max-w-4xl mx-auto px-6">
          <AdSlot id="hero-bottom-ad" format="horizontal" />
        </div>

        {/* Latest Guides Section - NEW for AdSense */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">最新の戦略ガイド / Strategy Guides</h2>
                <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                  Mumunoa TCG Lab は単なるツールではありません。AIによる分析データを基に、最新の環境変化や上達のためのメソッドを公開しています。
                </p>
              </div>
              <Link href="/guide/ai-coaching" className="text-indigo-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
                すべての記事を見る
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "AIコーチ活用ガイド",
                  desc: "8レイヤー推論エンジンを使いこなし、次の一手を見極める技術。",
                  link: "/guide/ai-coaching",
                  color: "indigo"
                },
                {
                  title: "事故率最小化の極意",
                  desc: "1000回シミュレーションが導き出す、真のデッキ安定度とは。",
                  link: "/guide/deck-stability",
                  color: "purple"
                },
                {
                  title: "プロの一人回し練習法",
                  desc: "大会で勝つための、効率的かつ科学的なトレーニングルーチン。",
                  link: "/strategy/practice-tips",
                  color: "emerald"
                }
              ].map((post, i) => (
                <Link key={i} href={post.link} className="group block p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1">
                  <div className={`w-8 h-8 rounded-lg bg-${post.color}-500/10 flex items-center justify-center mb-4 text-xs font-black text-${post.color}-400 group-hover:scale-110 transition-transform`}>
                    0{i+1}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{post.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{post.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Deep Tech Detail - NEW for AdSense Content Volume */}
        <section className="py-20 px-6 bg-[#0a0c10]">
          <div className="max-w-4xl mx-auto space-y-12 bg-white/[0.01] border border-white/5 rounded-[40px] p-8 md:p-16">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                なぜ Mumunoa TCG Lab が<br />
                世界中のプレイヤーに選ばれるのか
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Mumunoa TCG Lab は、単なる一人回しシミュレーターではありません。私たちは「データによるプレイングの最適化」を掲げ、高度なアルゴリズムを駆使してトレーディングカードゲームの練習環境を再定義しています。<br /><br />
                私たちの核となるテクノロジー「8レイヤー推論エンジン」は、各ターンの盤面情報を多角的に解析します。現在の資源、未来のサイド取得期待値、そして対戦相手が抱えているであろう潜伏リスクまでを数値化。一人で練習していても、まるで隣にトップレベルのコーチがいるかのような体験を提供します。
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  科学的な構築改善
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  1,000回のシミュレーションにより、デッキの「本当の事故率」を算出します。10回程度の一人回しでは見えてこなかった「たねポケモンの不足」や「エネルギー詰まり」をデータで突きつけます。
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  思考の言語化
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  AI が示す「理由」を読むことで、自分の直感とデータとの乖離（ギャップ）を知ることができます。これが「強いプレイヤー」の思考をトレースする最短の方法です。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section - NEW for AdSense SEO */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-3xl font-bold text-white text-center">よくある質問 / FAQ</h2>
            <div className="space-y-6">
              {[
                { q: "このツールは無料で使えますか？", a: "はい。基本的な一人回し機能やシミュレーションは無料でご利用いただけます。より深い分析や AI による思考プロセスの全開示などは、プレミアムプランおよびチケット制となっています。" },
                { q: "対応しているデバイスを教えてください。", a: "PCのブラウザはもちろん、iPhone や Android などのスマートフォンにも最適化されています。外出先や移動中の隙間時間でも本格的な練習が可能です。" },
                { q: "AI はどのようにプレイの『正解』を出しているのですか？", a: "独自の 8レイヤー推論エンジンにより、現在のリソース、ドロー確率、相手の要求値、および中長期的なサイドプランを統合的に計算しています。" }
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <h4 className="font-bold text-white mb-2 flex gap-3"><span className="text-blue-500">Q.</span> {faq.q}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed flex gap-3"><span className="text-emerald-500">A.</span> {faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/20 blur-[150px] -z-10 translate-y-20" />
          <div className="max-w-4xl mx-auto p-12 rounded-[40px] bg-gradient-to-b from-white/10 to-transparent border border-white/10 text-center backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              最高のポケカ練習を、今すぐ。
            </h2>
            <p className="text-slate-400 mb-10 max-w-md mx-auto">
              無料で始められます。AIコーチと共に、あなたのデッキとプレイを次のレベルへ。
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link
                href="/practice"
                className="w-full md:w-auto px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-lg shadow-xl shadow-blue-600/40 transition-all active:scale-[0.98]"
              >
                一人回しを始める (無料)
              </Link>

            </div>
            
            <div className="mt-12 opacity-40">
              <AdSlot id="cta-bottom-ad" format="rectangle" label="SPONSORED" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-[#080a0e]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/icon.png" alt="Logo" width={28} height={28} />
              <span className="font-bold text-xl text-white">Mumunoa TCG Lab</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Mumunoa TCG Labは、全てのポケカプレイヤーがより深く、より楽しく練習できる環境を目指して開発されています。
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-sm">戦略・ガイド</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><Link href="/guide" className="hover:text-white transition-colors">攻略ガイド一覧</Link></li>
              <li><Link href="/guide/ai-coaching" className="hover:text-white transition-colors">AIコーチ活用法</Link></li>
              <li><Link href="/guide/deck-stability" className="hover:text-white transition-colors">事故率最小化の極意</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-sm">法的情報・お問合せ</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><Link href="/about" className="hover:text-white transition-colors">当サイトについて / Mission</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="mailto:support@mumunoa.com" className="hover:text-white transition-colors">お問い合わせ (Email)</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-8">
          <AdSlot id="footer-ad" format="horizontal" />
          <p className="text-slate-600 text-[10px] text-center max-w-xl leading-relaxed">
            © {new Date().getFullYear()} Mumunoa TCG Lab. 
            当サイトはファンコンテンツであり、株式会社ポケモンおよび任天堂株式会社との公認関係はありません。
            © 2024 Pokémon. © 1995-2024 Nintendo/Creatures Inc./GAME FREAK inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
