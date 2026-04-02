import type { ShareScoreSummary, XShareTextVariant } from '@/types/monetization';

const MAX_X_SHARE_LENGTH = 120;
const APP_URL = 'https://mumunoa.com/practice';
const TAGS = '#ポケカAI #ポケカ';

export function pickRandomShareText(summary: ShareScoreSummary): string {
  const setup = Math.round(summary.setupRate) + '%';
  const tier = summary.overallTier;
  const name = summary.deckName;

  const empathy = [
    `ポケカの初動、いつも悩む…。\nこのAIで診断したら${name}は${tier}評価！\n自分では気づけない視点があって面白いです✨\n${APP_URL}\n${TAGS}`,
    `負けが続くとデッキのせいにしたくなるけど、AI診断で${name}の安定性を客観視できるのが助かる🙏🏻\n初動${setup}ならまだ戦えるはず！\n${APP_URL}\n${TAGS}`,
    `一人回しの限界を感じてたけど、1000回シミュレーションの結果はエグい😂\n私の${name}、もっと伸ばせるかも。\n${APP_URL}\n${TAGS}`,
    `「この手で合ってる？」って不安な時にAIコーチが隣にいる安心感。\n${name}、${tier}評価で自信ついた！\n${APP_URL}\n${TAGS}`,
    `ポケカ上達したいけど時間がない…。\n隙間時間にAIで${name}の最適解を学べるの最高すぎる🚀\n${APP_URL}\n${TAGS}`,
    `手札事故、もう怖くない（かも）！\nAIが${name}の事故率を徹底分析してくれました😭\n${APP_URL}\n${TAGS}`,
    `みんなの${name}と比べてどうなんだろう？\nAI評価${tier}ってことは、まだプレイングでカバーできるってことかな🤔\n${APP_URL}\n${TAGS}`,
    `構築段階で迷走してたけど、AIの数値を見るとスッキリする。\n${name}の診断結果、意外だった！\n${APP_URL}\n${TAGS}`,
    `ポケカ仲間と構築推し合うの楽しいけど、AIの冷静な突っ込みも刺さるｗ\n${name}、${setup}かー。要調整！\n${APP_URL}\n${TAGS}`,
    `夜な夜な一人回しするより、AIで一瞬で1000回分回す方が効率的かも😂\n${name}、${tier}評価でした！\n${APP_URL}\n${TAGS}`,
    `新レギュレーション不安だけど、AIがいれば心強い。\n${name}を真っ先に診断してみた！\n${APP_URL}\n${TAGS}`,
    `勝てない理由が運なのか構築なのか…AIなら答えを教えてくれる💡\n${name}の結果を見て納得。\n${APP_URL}\n${TAGS}`,
    `ポケカの奥深さに圧倒される毎日。\nAIコーチと一緒に${name}を極めていきたい！\n${APP_URL}\n${TAGS}`,
    `ガチ勢じゃなくても、自分のデッキが${tier}って言われると嬉しいね😊\n${name}、もっと使い込みます！\n${APP_URL}\n${TAGS}`,
    `環境デッキに勝つためのヒントをAIから盗む👀\n${name}で勝ち越したい人、これ使ってみて！\n${APP_URL}\n${TAGS}`,
    `「理論上最強」を数値で証明したい。\n私の${name}、期待値${setup}超え！\n${APP_URL}\n${TAGS}`,
    `思考の癖をAIに指摘されるの、悔しいけど成長を感じるｗ\n${name}のプレイング、見直します！\n${APP_URL}\n${TAGS}`,
    `デッキ回してる時が一番幸せ。\nAIと一緒に${name}をもっと楽しくしたい✨\n${APP_URL}\n${TAGS}`,
    `ポケカ初心者こそAIコーチが必要かも。${name}の使い方、これで完璧！\n${APP_URL}\n${TAGS}`,
    `今日も${name}の調整が止まらない…。\nAI診断を繰り返して、最強の1枚を見つけたい！\n${APP_URL}\n${TAGS}`,
  ];

  const problemPosing = [
    `その${name}、本当に回る？\nAI診断で初動安定率を確認したら${setup}でした。\n負ける前にチェックした方がいいかも…。\n${APP_URL}\n${TAGS}`,
    `「運が悪かった」で済ませてませんか？\nAIで見れば${name}の構築の欠陥が一目瞭然になる。評価は${tier}でした。\n${APP_URL}\n${TAGS}`,
    `1000回回して一度も初動が成功しない確率、知ってますか？\n${name}の真の姿をAIが暴く。\n${APP_URL}\n${TAGS}`,
    `環境トップに勝つために、今の${name}で足りないものは何か。\nAIのタクティカル分析が鋭すぎる…。\n${APP_URL}\n${TAGS}`,
    `なぜあなたの${name}は肝心な時に事故るのか。\nAIシミュレーションでその原因を特定しませんか？\n${APP_URL}\n${TAGS}`,
    `勝率が安定しないのは、プレイング？それとも構築？\nAIが${name}を公平に評価します。\n${APP_URL}\n${TAGS}`,
    `感覚だけでデッキ組むの、もうやめませんか？\n${name}の${tier}評価を見て、現実を直視しよう。\n${APP_URL}\n${TAGS}`,
    `その${name}のエネルギー配分、本当に最適ですか？\nAI診断なら一瞬で改善案が見つかる。\n${APP_URL}\n${TAGS}`,
    `サイド落ちを考慮した初動の確率は？\n勘ではなく数値で${name}を語れるようになろう。\n${APP_URL}\n${TAGS}`,
    `「たね切れ負け」が多い${name}使い必見！\nAIがデッキ密度から安定性を算出します。\n${APP_URL}\n${TAGS}`,
    `あなたの${name}は、後攻1ターン目にどこまで動ける？\nAI診断で理想の盤面を追求しよう。\n${APP_URL}\n${TAGS}`,
    `本当にそのサポート、枚数足りてますか？\n${name}の診断結果から、必要なリソースが見える。\n${APP_URL}\n${TAGS}`,
    `「回れば強い」は、回らない可能性の裏返し。\n${name}の${setup}という数字をどう見る？\n${APP_URL}\n${TAGS}`,
    `シティや自主大会で勝ち抜くために。\nAIによる${name}の徹底検算、必須です。\n${APP_URL}\n${TAGS}`,
    `最強の${name}を作りたいなら、AIの意見を聞かない理由がない。\n${APP_URL}\n${TAGS}`,
    `対面ごとの勝率をどこまでイメージできていますか？\nAIコーチが${name}の勝ち筋を言語化します。\n${APP_URL}\n${TAGS}`,
    `不要なカード、デッキに入っていませんか？\n${name}の${tier}評価を上げるための取捨選択を。\n${APP_URL}\n${TAGS}`,
    `その一手、AIなら1秒で「間違い」と見抜くかも。\n${name}のプレイングスキルを可視化しよう。\n${APP_URL}\n${TAGS}`,
    `デッキビルドは算数だ。${name}をAIで計算しよう。\n${APP_URL}\n${TAGS}`,
    `まだ運ゲーで消耗してるんですか？\n${name}をAIで科学すれば、もっと勝てるようになる。\n${APP_URL}\n${TAGS}`,
  ];

  const valueProviding = [
    `【1000回シミュ】私の${name}の診断結果！\n・総合評価：${tier}\n・初動成功率：${setup}\nこれ無料で使えるの凄すぎん？\n${APP_URL}\n${TAGS}`,
    `ポケカ初心者に超おすすめ！AIコーチに${name}を見せたら、次の一手を理由付きで教えてくれた✨\n上達が捗る！\n${APP_URL}\n${TAGS}`,
    `シティリーグ前の最終調整に！\nAIが${name}の弱点を炙り出して、改善案まで提示してくれます。神ツール…！\n${APP_URL}\n${TAGS}`,
    `ポケカの一人回し、これからはAIでする時代。\n${name}を1000回ぶん回した結果がこちら。納得感すごい。\n${APP_URL}\n${TAGS}`,
    `スマホ1つでポケカプロの思考を。AIコーチなら${name}のプレイングを24時間いつでも指導してくれます！\n${APP_URL}\n${TAGS}`,
    `デッキコードを貼るだけで${name}の強さが数値でわかる診断サイト、控えめに言って革命。評価は${tier}！\n${APP_URL}\n${TAGS}`,
    `「このカード、抜くべき？」悩んでるならAI診断。\n${name}の期待値を最大化する調整が捗ります💡\n${APP_URL}\n${TAGS}`,
    `ポケカ理論を学びたいなら、このAIの解説を見るのが近道。\n${name}での戦い方が180度変わります。\n${APP_URL}\n${TAGS}`,
    `データで語るポケカ。${name}をAIが客観的に分析した結果を公開中！\n${APP_URL}\n${TAGS}`,
    `一人回しの手間をゼロに。AIが${name}の全データを一瞬で解析。初動${setup}の衝撃結果⚡️\n${APP_URL}\n${TAGS}`,
    `プレイングのミスが激減した！AIコーチのアドバイスで${name}の動きが劇的にスムーズになったよ。\n${APP_URL}\n${TAGS}`,
    `デッキビルドの良き相棒。AIの${tier}評価を目指して${name}を調整していくのが楽しい！\n${APP_URL}\n${TAGS}`,
    `「なぜそのカードが必要か」を論理的に説明してくれるAI。${name}への理解が深まる。おすすめ！\n${APP_URL}\n${TAGS}`,
    `複雑な今の環境、AIの力を借りて${name}で生き残ろう。圧倒的な効率改善！\n${APP_URL}\n${TAGS}`,
    `私の${name}、実は${tier}評価だった！構築の正解にたどり着くまでの時間が大幅短縮できます💪🏻\n${APP_URL}\n${TAGS}`,
    `シミュレーションで判明した${name}の最強ムーブ。\nこれを知ってるだけで勝率が変わる気がする。🚀\n${APP_URL}\n${TAGS}`,
    `デッキ公開されてる上位レシピを診断してみたら全部${tier}だったｗ AI凄いわ…。\n${APP_URL}\n${TAGS}`,
    `自分のデッキ、客観的に強いって言われたい。AIの${tier}評価で${name}を自慢しよう！✨\n${APP_URL}\n${TAGS}`,
    `ポケカの練習時間が足りない大人たちへ。AI診断で${name}の効率UPを狙え！🕰️\n${APP_URL}\n${TAGS}`,
    `これぞポケカの新基準。${name}をAIで磨き上げよう。診断結果はこちら！✨\n${APP_URL}\n${TAGS}`,
  ];

  const storageRecommended = [
    `【永久保存版】ポケカ上達に必須のAIツール！\n${name}の${tier}評価をもとに、一人回しを1000回繰り返した分析結果が見れます✨\n${APP_URL}\n${TAGS}`,
    `後で見返せるように要チェック！\nAIが教える${name}の最適解。この評価${tier}を基準に調整を進めよう🔍\n${APP_URL}\n${TAGS}`,
    `全ポケカプレイヤーがブックマークすべき！\n${name}をAIコーチが評価。初動${setup}を改善する秘策がここに。\n${APP_URL}\n${TAGS}`,
    `「このデッキ、強い？」と思ったら、まずここへ。\n${name}の診断結果${tier}を保存して、友達とシェアしよう！📖\n${APP_URL}\n${TAGS}`,
    `ポケカのリサーチに革命。\nAIが算出した${name}のデータは、デッキログに添えて保存しておきたいレベル。メモ必須！\n${APP_URL}\n${TAGS}`,
    `デッキ調整のログを数値で残そう。\n改良前の${name}：${tier} → 改良後…？AI診断の結果は後で効いてくる📈\n${APP_URL}\n${TAGS}`,
    `このAIコーチ、控えめに言って有能。\n${name}のアドバイス内容をスクショして保存しておくと試合で役立つ！📸\n${APP_URL}\n${TAGS}`,
    `一人回しの革命。${name}の1000回シミュレーション結果、ブックマークしていつでも確認しよう📌\n${APP_URL}\n${TAGS}`,
    `構築の「引き出し」を増やすために。\nAI診断の${tier}評価を集めて${name}の深みを追求しよう！📁\n${APP_URL}\n${TAGS}`,
    `上達の近道は、客観的な振り返りから。AIが指摘した${name}の弱点は、絶対に覚えておくべき忘備録✏️\n${APP_URL}\n${TAGS}`,
    `シティ直前、最後に頼るのはAIの数値。\n${name}の安定感${setup}を確信してから会場へ行こう！✅\n${APP_URL}\n${TAGS}`,
    `私の${name}、自信作だけどAI評価は${tier}。この悔しさを保存して、さらに洗練させてやる！🔥\n${APP_URL}\n${TAGS}`,
    `練習不足をデータで補う。AIが算出した${name}の期待値は、自分のプレイを支える自信になる🌟\n${APP_URL}\n${TAGS}`,
    `デッキの成長記録にAI診断を。\n${name}が${tier}からSに変わるまでの道のりを保存しよう！成長が目に見える✨\n${APP_URL}\n${TAGS}`,
    `全ポケモンカードファンにおすすめしたい！\n昨日の自分を超えるための${name}診断、ルーティンにしよう🔄\n${APP_URL}\n${TAGS}`,
    `「何となく」を「確実に」へ。AIが提示する${name}の正解は、デッキレシピと共に永久保存！🏆\n${APP_URL}\n${TAGS}`,
    `ポケカの未来、ここにある。\n${name}の分析レポートは、自分だけの最高の攻略本になる📗\n${APP_URL}\n${TAGS}`,
    `悩んだらこのAI。${name}の${tier}評価という基準があれば、迷いなく調整を続けられる。必須ツール！🚀\n${APP_URL}\n${TAGS}`,
    `みんなの診断結果を見てるだけでも勉強になる👀\nまずは自分の${name}から保存して、ポケカライフをもっと豊かに！💫\n${APP_URL}\n${TAGS}`,
    `最高のポケカ体験を、AIと共に。\n${name}の評価、初動${setup}を忘れずにメモして極めよう！🌈\n${APP_URL}\n${TAGS}`,
  ];

  const allTemplates = [...empathy, ...problemPosing, ...valueProviding, ...storageRecommended];
  const selected = allTemplates[Math.floor(Math.random() * allTemplates.length)];
  return selected;
}

export function createXShareTextVariants(summary: ShareScoreSummary): XShareTextVariant[] {
  const randomText = pickRandomShareText(summary);
  return [{ id: 'flex', text: randomText, length: randomText.length }];
}

export function pickBestShareText(summary: ShareScoreSummary): XShareTextVariant {
  return createXShareTextVariants(summary)[0];
}
