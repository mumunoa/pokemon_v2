import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">利用規約</h1>
        
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">1. サービスの利用</h2>
          <p className="leading-relaxed text-sm">
            本規約は、Mumunoa TCG Lab（以下、「本サービス」）が提供するすべてのコンテンツの利用に関して適用されます。
            ユーザーは本サービスを利用することで、本規約に同意したものとみなされます。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">2. 禁止事項</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>自動化プログラム（Bot）等による過度なアクセスや解析</li>
            <li>本サービスのサーバーやネットワークに対する妨害行為</li>
            <li>他者の権利を侵害する行為</li>
            <li>その他、本サービスが不適当と判断する行為</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">3. AIによる回答について</h2>
          <p className="leading-relaxed text-sm">
            本サービスのAIが提供するコーチングや分析は、その正確性を保証するものではありません。
            実際の対戦結果や損害について、本サービスは一切の責任を負いません。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">4. 規約の変更</h2>
          <p className="leading-relaxed text-sm">
            本サービスは、必要に応じて本規約を変更することがあります。変更後の規約は、サイト上に掲載された時点より効力を生じるものとします。
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link href="/" className="text-blue-400 hover:underline">ホームへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
