import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mumunoa TCG Lab | ポケカAI分析・一人回しコーチングツール",
  description: "Mumunoa TCG Labは、AIがあなたのプレイを分析し、事故率チェックや次の一手をコーチングする最高峰のポケカ練習ツールです。",
  keywords: ["ポケカ", "ポケモンカード", "一人回し", "シミュレーター", "AI分析", "コーチング"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Clerkのパブリッシャブルキーを取得。存在しない場合はビルドエラー回避用のプレースホルダを使用。
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_Y2xlcmsuYXBwJA";
  const isKeyValid = !!(clerkKey && clerkKey.startsWith('pk_'));

  return (
    <html lang="ja">
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2970580806456149"
          crossOrigin="anonymous"
        ></script>
        {/* Monetag Smart Tag / Rewarded Video */}
        <script src="https://quge5.com/88/tag.min.js" data-zone="224540" async data-cfasync="false"></script>
      </head>
      <body className="antialiased font-sans">
        {/*
          isKeyValid が false の場合でも ClerkProvider で包むことで、
          内包されるコンポーネントが useUser() 等を呼んだ際のランタイムエラー（Build Error）を回避します。
          ただし、有効なキーがない場合はサインイン等の機能は動作しません。
        */}
        <ClerkProvider publishableKey={clerkKey}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
