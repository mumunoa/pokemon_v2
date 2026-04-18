import React from 'react';
import Link from 'next/link';

export default function ResumeSocialTips() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-orange-500/30">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-amber-400 transition-colors uppercase">HOME</Link>
          <span className="opacity-30">/</span>
          <Link href="/guide" className="hover:text-amber-400 transition-colors uppercase">GUIDE</Link>
          <span className="opacity-30">/</span>
          <span className="text-amber-400 uppercase tracking-widest font-bold">Social Media Strategy</span>
        </nav>

        {/* Title & Metadata */}
        <header className="mb-16">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 italic tracking-tighter">
            X（旧Twitter）で差がつく！<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-400 to-amber-600">
              「ポケカ履歴書」の書き方と自己紹介の極意
            </span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold tracking-widest uppercase">Community Strategy</span>
            <span>公開日: 2024.04.17</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-16 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-orange-500 pl-4">1. なぜ「履歴書」がポケカ仲間の輪を広げるのか</h2>
            <p>
              ポケモンカードゲーム（ポケカ）は対戦相手がいて初めて成立するゲームです。近年、X（旧Twitter）を中心としたSNSでの交流は、ジムバトルへの参加やリモート対戦、さらには大型大会の練習仲間を見つけるための必須ツールとなっています。
            </p>
            <p>
              しかし、140文字のテキストだけで自分のプレイスタイルや熱量を伝えるのは至難の業です。そこで役立つのが「ポケカ履歴書」という画像テンプレートです。
              Mumunoa TCG Lab の履歴書メーカーは、あなたの「好き」と「活動スタイル」を一目で伝え、共感を生むためのデザインを追求しています。
            </p>
          </section>

          <section className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
            <h2 className="text-2xl font-bold text-white">2. 共感を生む「項目埋め」の3つのコツ</h2>
            <div className="grid gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  トレーナー名と活動地域
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  本名に近い名前よりも、SNSのハンドルネームを使用しましょう。活動地域は「リモート可能」であれば必ず記載してください。現在のポケカ環境では、リモート対戦は最も手軽で強力な練習手段です。
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  プレイスタイルとレギュレーション
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  「エンジョイ」か「ガチ」かだけでなく、自分がどの部分に価値を感じているかを意識してください。例えば「デッキビルドが好き」「特定のポケモンを愛用している」など、独自のこだわりが強いほど、同じ感性を持つフォロワーと繋がりやすくなります。
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  フリースペースの「温度感」
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  ここが最も重要です。履歴書テンプレートの枠外にある「想い」を言葉にしてください。
                  「最近始めたばかりで右も左も分かりません！」「CL完走を目指して本気で練習しています！」など、現在のあなたの「温度感」を正直に書くことが、ミスマッチを防ぐ秘訣です。
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-orange-500 pl-4">3. Xでの拡散力を最大化する投稿の作法</h2>
            <p>
              履歴書画像を生成したら、次は投稿です。ただ画像を載せるだけでなく、以下の「拡散の定石」を守ることで、リーチが激変します。
            </p>
            <div className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-3xl space-y-6">
              <h4 className="font-bold text-white">拡散を狙うためのチェックリスト</h4>
              <ul className="grid gap-4">
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">1</div>
                  <p className="text-sm">
                    <strong className="text-white">ハッシュタグを厳選する:</strong> <br />
                    #ポケカ履歴書 #ポケカ友達募集 #ポケカ勢と繋がりたい は三種の神器です。
                  </p>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">2</div>
                   <p className="text-sm">
                    <strong className="text-white">ゴールデンタイムを狙う:</strong> <br />
                    平日の20:00〜22:00、または日曜日の夜はアクティブユーザーが多く、反応が得やすい傾向にあります。
                  </p>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">3</div>
                   <p className="text-sm">
                    <strong className="text-white">自分からも「いいね」をする:</strong> <br />
                    投稿して終わりではなく、同じハッシュタグを使っている仲間に挨拶しにいくことで、輪が急速に広がります。
                  </p>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-6 text-center pt-10">
            <h2 className="text-2xl font-bold text-white">さあ、あなたの魅力を形にしましょう</h2>
            <p className="text-slate-500 text-sm italic">
              「自分なんてまだ弱いから…」と躊躇する必要はありません。履歴書は「今のあなた」を肯定するためのツールです。
            </p>
            <div className="pt-8">
              <Link 
                href="/resume"
                className="inline-flex items-center justify-center px-12 py-5 rounded-3xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-xl shadow-xl shadow-orange-600/30 transition-all active:scale-95 gap-3"
              >
                履歴書を作成する
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          </section>

          {/* AdSense Filler Section */}
          <section className="py-12 border-t border-white/5 space-y-4">
            <h4 className="text-[10px] font-black tracking-widest text-slate-700 uppercase">Related Article Logic</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mumunoa TCG Lab では、履歴書を通じたコミュニティ形成を支援するだけでなく、AIによる一人回し分析など、技術的な面からもプレイヤーをサポートしています。仲間の輪を広げた後は、ぜひ当ツールのAIコーチと共に、自身のプレイスキルを次のレベルへと磨き上げてください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
