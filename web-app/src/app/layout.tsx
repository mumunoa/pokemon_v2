import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "ポケカAIコーチ | ポケモンカード一人回し・AI分析ツール",
  description: "AIがあなたのプレイを分析。事故率チェックや次の一手をコーチングする最高峰 of ポケカ練習ツール。",
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
