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
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  // Clerkのキーが 'pk_' で始まらない場合は無効（プレースホルダ）とみなす
  const isKeyValid = !!(clerkKey && clerkKey.startsWith('pk_'));

  const content = (
    <html lang="ja">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );

  if (isKeyValid) {
    return (
      <ClerkProvider publishableKey={clerkKey}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
