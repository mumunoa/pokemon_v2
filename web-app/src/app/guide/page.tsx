import React from 'react';
import Link from 'next/link';

export default function GuideListing() {
  const guides = [
    {
      id: "ai-coaching",
      title: "AIコーチが教える、「次の一手」を見極める技術",
      category: "TECHNICAL",
      description: "8レイヤー推論エンジンが、どのように盤面のリスクとリターンを数値化しているのか、その裏側を解説します。",
      date: "2024.04.17",
      color: "from-blue-500 to-indigo-600",
      featured: true
    },
    {
      id: "deck-stability",
      title: "1000回シミュレーションによる事故率最小化の極意",
      category: "STATISTICS",
      description: "「なんとなく」のデッキ構築を卒業。たねポケモンの枚数とドロー期待値の関係をデータで解き明かします。",
      date: "2024.04.17",
      color: "from-purple-500 to-pink-600",
      featured: true
    },
    {
      id: "resume-social-tips",
      title: "X（旧Twitter）で差がつく！ポケカ履歴書の書き方と自己紹介のコツ",
      category: "COMMUNITY",
      description: "せっかく作った履歴書を、より多くの仲間に届けるためのハッシュタグ活用術や自己紹介文のテンプレを公開。",
      date: "2024.04.17",
      color: "from-orange-500 to-red-600",
      featured: false
    },
    {
       id: "beginner-practice",
       title: "初心者向け：一人回し（ソリティア）の基本とステップアップ",
       category: "BEGINNER",
       description: "対戦相手がいなくても強くなれる。プロも実践する「目的意識を持った練習ルーチン」の作り方。",
       date: "2024.04.18",
       color: "from-emerald-500 to-teal-600",
       featured: false
    },
    {
       id: "deck-theory-prize-card",
       title: "サイドプランの立て方：最短で取り切る「2-2-2」ルートの思考法",
       category: "THEORY",
       description: "勝利へのロードマップ。どのポケモンをどの順番で倒すべきか、逆転のサイドマネジメントを解説。",
       date: "2024.04.18",
       color: "from-purple-500 to-indigo-600",
       featured: false
    },
    {
       id: "charizard-ex-meta",
       title: "環境解説：悪リザードンex を使いこなすための練習法",
       category: "META",
       description: "不動のトップメタ。盤面展開の優先順位と、AI分析で読み解くリザードンの「死角」。",
       date: "2024.04.18",
       color: "from-red-500 to-orange-600",
       featured: false
    },
    {
       id: "dragapult-ex-meta",
       title: "最新環境：ドラパルトex と「ダメカンバラマキ」の戦術論",
       category: "META",
       description: "超火力の新星。ファントムダイブの効果を最大化するダメカン配置の数学的最適解。",
       date: "2024.04.18",
       color: "from-indigo-500 to-purple-600",
       featured: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-300 py-24 px-6 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic mb-6">
            STRATEGY <span className="text-blue-500">INSIGHTS</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Mumunoa TCG Lab は、最高峰のAIテクノロジーと統計データを用いて、全てのプレイヤーの上達を支援するメディア・プラットフォームです。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Featured Sections */}
          {guides.filter(g => g.featured).map((guide) => (
            <Link 
              key={guide.id} 
              href={`/guide/${guide.id}`}
              className="md:col-span-6 group relative overflow-hidden rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all p-8 md:p-12"
            >
              <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${guide.color} opacity-[0.03] blur-[60px] group-hover:opacity-[0.1] transition-opacity`} />
              <div className="relative z-10 flex flex-col h-full">
                <span className="text-[10px] font-black tracking-[0.3em] text-blue-400 mb-6 uppercase">{guide.category}</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors leading-tight">
                  {guide.title}
                </h2>
                <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-10 flex-1">
                  {guide.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                   <span className="text-xs font-mono text-slate-600">{guide.date}</span>
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                   </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Standard List Sections */}
          <div className="md:col-span-12 mt-8">
             <h3 className="text-xs font-black tracking-[0.4em] text-slate-600 mb-8 uppercase px-4">Latest Archives</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.filter(g => !g.featured).map(guide => (
                   <Link 
                    key={guide.id} 
                    href={`/guide/${guide.id}`}
                    className="flex flex-col sm:flex-row gap-6 p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group"
                   >
                     <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${guide.color} shrink-0 opacity-20 flex items-center justify-center`}>
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                     </div>
                     <div className="space-y-2">
                        <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">{guide.category}</span>
                        <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors">{guide.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{guide.description}</p>
                     </div>
                   </Link>
                ))}
             </div>
          </div>
        </div>

        {/* SEO Bottom Section */}
        <section className="mt-32 pt-20 border-t border-white/5 text-center max-w-3xl mx-auto space-y-8">
           <h2 className="text-2xl font-bold text-white tracking-tight">
             ポケカの「答え」をデータで解き明かす
           </h2>
           <p className="text-sm text-slate-500 leading-relaxed">
             Mumunoa TCG Lab は、感覚的なプレイを超え、勝率を最大化するための理論武装をサポートします。最新のメタゲーム分析から、AIによる一人回しコーチング、統計データに基づくデッキ診断まで、勝利に必要なインサイトを網羅しています。
           </p>
           <div className="pt-8">
              <Link href="/privacy-policy" className="text-[10px] font-bold text-slate-600 hover:text-blue-500 transition-colors uppercase tracking-[0.2em] px-4 py-2 border border-white/5 rounded-full">
                Privacy Policy & Disclaimer
              </Link>
           </div>
        </section>
      </div>
    </div>
  );
}
