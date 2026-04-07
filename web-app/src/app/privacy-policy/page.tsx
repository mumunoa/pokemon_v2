import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-blue-400 transition-colors uppercase font-bold tracking-widest">HOME</Link>
          <span className="opacity-30">/</span>
          <span className="text-slate-400">PRIVACY POLICY</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">プライバシーポリシー</h1>
          <p className="text-sm text-slate-500">制定日：2024年03月25日 / 最終改定日：2024年04月07日</p>
        </header>

        <div className="space-y-12 leading-relaxed text-sm md:text-base">
          <p>
            Mumunoa TCG Lab（以下、「当サイト」といいます。）は、本ウェブサイト上で提供するサービス（以下、「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第1条（個人情報の定義）</h2>
            <p>
              「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報（個人識別符号に含まれるものを含む）を指します。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第2条（個人情報の収集方法）</h2>
            <p>
              当サイトは、ユーザーが本サービスを利用する際に、Google アカウントやメールアドレスなどの個人情報を取得することがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当サイトの提携先（情報提供元、広告主、広告配信先などを含みます。）などから収集することがあります。
            </p>
          </section>

          <section className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-xl font-bold text-white">第3条（広告の配信：Google AdSense）</h2>
            <p>
              当サイトでは、第三者配信の広告サービス「Google AdSense（グーグルアドセンス）」を利用しています。
            </p>
            <p>
              広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報「Cookie」（氏名、住所、メールアドレス、電話番号は含まれません）を使用することがあります。
            </p>
            <p>
              Cookieを無効にする設定およびGoogleアドセンスに関する詳細は、以下のボタンから「広告 – ポリシーと規約 – Google」をご覧ください。
            </p>
            <a 
              href="https://policies.google.com/technologies/ads" 
              className="inline-block px-6 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 広告設定を確認
            </a>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第4条（アクセス解析ツール：Google Analytics）</h2>
            <p>
              当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。
              Googleアナリティクスは、アクセス情報の収集のためにCookieを使用しています。このアクセス情報は匿名で収集されており、個人を特定するものではありません。
            </p>
            <p>
              また、この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">第5条（安全性と免責事項）</h2>
            <p>
              当サイトのコンテンツ・情報について、できる限り正確な情報を提供するよう努めておりますが、正確性や安全性を保証するものではありません。
              情報提供に起因して発生したトラブルや損害については、当サイトは一切の責任を負いかねます。
            </p>
            <p>
              当サイトからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報、サービス等について一切の責任を負いません。
            </p>
          </section>

          <section className="space-y-4 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold text-white">第6条（お問合せ先）</h2>
            <p>
              本ポリシーに関するお問い合わせは、以下のメールアドレスまでお願いいたします。
            </p>
            <p className="text-blue-400 font-bold">support@mumunoa.com</p>
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
