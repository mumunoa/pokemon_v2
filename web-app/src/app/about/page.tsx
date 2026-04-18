import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-blue-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <span className="text-blue-400 uppercase tracking-widest font-bold">About & Mission</span>
        </nav>

        {/* Title & Mission Statement */}
        <header className="mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8 tracking-tighter italic">
            MUMUNOA <span className="text-blue-500">LAB</span><br />
            MISSION STATEMENT
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
            「データと情熱で、ポケカの『楽しさ』と『強さ』を加速させる。」
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-20 leading-relaxed">
          
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-white border-l-4 border-blue-600 pl-4">1. Mumunoa TCG Lab とは</h2>
            <p>
              Mumunoa TCG Lab は、ポケモンカードゲームを心から愛する有志のエンジニアによって設立された、最新のテクノロジーとプレイヤーコミュニティを繋ぐための研究開発プラットフォームです。
            </p>
            <p>
              当サイトが提供するツール群（AIコーチング、デッキシミュレーション、履歴書メーカー）は、単なる効率化の手段ではありません。プレイヤーが自分のプレイスタイルに自信を持ち、仲間と深く繋がるための「架け橋」となることを目指しています。
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-16 space-y-12">
            <h2 className="text-2xl font-bold text-white text-center italic">Core Values</h2>
            <div className="grid md:grid-cols-2 gap-12 text-center sm:text-left">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black mx-auto sm:mx-0">V1</div>
                <h3 className="text-xl font-bold text-white">データ主導の客観性</h3>
                <p className="text-sm text-slate-500">
                  「なんとなく」ではなく数値に基づいた解答を示すことで、全てのプレイヤーに公平で納得感のある上達環境を提供します。
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black mx-auto sm:mx-0">V2</div>
                <h3 className="text-xl font-bold text-white">コミュニティの尊重</h3>
                <p className="text-sm text-slate-500">
                  ファン活動としてのマナーを遵守し、公式様への敬意を忘れず、コミュニティの健全な発展を最優先します。
                </p>
              </div>
            </div>
          </section>

          <section className="p-10 rounded-[40px] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 space-y-8">
            <h2 className="text-2xl font-bold text-white border-l-4 border-emerald-500 pl-4">2. 開発チームの想い</h2>
            <p className="text-slate-400 lg:text-lg">
              開発者もまた、一人のポケカプレイヤーです。
              夜を徹してデッキを組み上げ、仲間とリモートで対戦し、大型大会に一喜一憂する。そんな日々の中で感じた「もっと効率的に練習できれば」「もっと自分に合った仲間を見つけられれば」というリアルな切実さが、このツールの原動力です。
            </p>
            <p className="text-slate-400 lg:text-lg">
              AI は決して人間の直感を否定するものではありません。むしろ、人間の直感をより高度に洗練させるためのツールだと私たちは信じています。テクノロジーが進化することで、プレイヤーがより純粋に「ゲームの面白さ」や「仲間との交流」に集中できる未来。それが私たちのゴールです。
            </p>
          </section>

          <section className="py-20 border-t border-white/5 text-center space-y-8">
             <div className="flex items-center justify-center gap-4 mb-4 opacity-30">
                <div className="w-24 h-px bg-white" />
                <span className="text-[10px] font-black tracking-[0.5em] text-white uppercase">Contact Us</span>
                <div className="w-24 h-px bg-white" />
             </div>
             <p className="text-sm text-slate-500">
               Mumunoa TCG Lab へのご意見・ご要望は、<br className="sm:hidden" />
               公式Xまたはメールにてお気軽にお寄せください。
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://x.com/mumunoa_tcg" target="_blank" className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
                  公式Xをチェック
                </Link>
                <Link href="mailto:support@mumunoa.com" className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
                  お問い合わせ
                </Link>
             </div>
          </section>

          {/* AdSense E-E-A-T Signal */}
          <section className="py-12 border-t border-white/5 space-y-4 text-center">
            <h4 className="text-[10px] font-black tracking-widest text-slate-700 uppercase">Operational Integrity & Compliance</h4>
            <p className="text-[10px] text-slate-600 leading-relaxed max-w-2xl mx-auto">
              当サイト「Mumunoa TCG Lab」は、利用者のプライバシー保護を第一に考え、適切なデータ管理を行っています。Google AdSenseプログラムポリシーを含む各種ガイドラインを遵守し、常にユーザーへ「有用性の高い独自コンテンツ」を提供することを責務としています。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
