import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">プライバシーポリシー</h1>
        <p className="mb-6">
          Mumunoa TCG Lab（以下、「当サイト」）は、ユーザーのプライバシーを尊重し、個人情報の保護に最大限の注意を払っています。
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">1. 広告の配信について</h2>
          <p className="leading-relaxed">
            当サイトでは、第三者配信の広告サービス「Google AdSense（グーグルアドセンス）」を利用しています。
            広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報「Cookie」（氏名、住所、メールアドレス、電話番号は含まれません）を使用することがあります。
            Cookieを無効にする設定およびGoogleアドセンスに関する詳細は「<a href="https://policies.google.com/technologies/ads" className="text-blue-400 hover:underline" target="_blank">広告 – ポリシーと規約 – Google</a>」をご覧ください。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">2. アクセス解析ツールについて</h2>
          <p className="leading-relaxed">
            当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。
            Googleアナリティクスは、アクセス情報の収集のためにCookieを使用しています。このアクセス情報は匿名で収集されており、個人を特定するものではありません。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">3. 免責事項</h2>
          <p className="leading-relaxed">
            当サイトのコンテンツ・情報について、できる限り正確な情報を提供するよう努めておりますが、正確性や安全性を保証するものではありません。
            当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますので、ご了承ください。
          </p>
        </section>
        
        <div className="mt-12 pt-8 border-t border-white/10">
          <Link href="/" className="text-blue-400 hover:underline">ホームへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
