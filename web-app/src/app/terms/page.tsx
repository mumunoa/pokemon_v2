import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-purple-500/30">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-purple-400 transition-colors uppercase font-bold tracking-widest">HOME</Link>
          <span className="opacity-30">/</span>
          <span className="text-slate-400">TERMS OF SERVICE</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">利用規約</h1>
          <p className="text-sm text-slate-500">制定日：2024年03月25日 / 最終改定日：2024年04月07日</p>
        </header>

        <div className="space-y-12 leading-relaxed text-sm md:text-base">
          <p>
            Mumunoa TCG Lab（以下、「当サイト」といいます。）は、本ウェブサイト上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆様（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第1条（適用）</h2>
            <p>
              本規約は、ユーザーと当サイトとの間の本サービスの利用に関わる一切の関係に適用されるものとします。当サイトは本サービスに関し、本規約のほか、各種の規定（以下、「個別規定」といいます。）をすることがあります。これら個別規定はその名称のいかんに関わらず，本規約の一部を構成するものとします。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第2条（知的財産権について）</h2>
            <p>
              本サービスにおいて提供される全ての情報、プログラム、デザイン、ロゴ等に関する知的財産権は、当サイトまたは正当な権利者に帰属します。
            </p>
            <div className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
              <p className="text-xs text-slate-400 leading-relaxed">
                ※ 本サービスはファンによる非公式のツールです。使用されているポケモンカードの画像、商標、素材等の著作権・知的財産権は、株式会社ポケモン、任天堂株式会社、株式会社クリーチャーズ、株式会社ゲームフリークに帰属します。当サイトはこれらの権利を侵害する意図はなく、ファン活動の一環として運営されています。
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第3条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-decimal list-inside space-y-3 pl-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>自動化ツール（ボット）等を用いた過度なアクセスやデータスクレイピング行為</li>
              <li>他のユーザーに対する嫌がらせや不利益を与える行為</li>
              <li>その他、当サイトが不適切と判断する行為</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第4条（免責事項）</h2>
            <p>
              当サイトは、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
            </p>
            <p>
              AIによる分析結果やシミュレーション数値は、その正確性を保証するものではありません。実際の対局結果や損害について、当サイトは一切の責任を負いかねます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第5条（サービス内容の変更・停止）</h2>
            <p>
              当サイトは、ユーザーへの事前の通知なく、本サービスの内容を変更し、または提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>

          <div className="py-12 border-t border-white/5 flex flex-col items-center">
             <Link href="/" className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
                ホームへ戻る
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
