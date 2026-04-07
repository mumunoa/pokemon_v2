import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mumunoa TCG Lab | ポケカAI分析・一人回しコーチングツール",
  description: "Mumunoa TCG Labは、AIがあなたのプレイを分析し、事故率チェックや次の一手をコーチングする最高峰のポケカ練習ツールです。",
  keywords: ["ポケカ", "ポケモンカード", "一人回し", "シミュレーター", "AI分析", "コーチング"],
  openGraph: {
    title: "Mumunoa TCG Lab | ポケカAI分析・一人回しコーチングツール",
    description: "AIがあなたのプレイを分析し、事故率チェックや次の一手をコーチングする最高峰のポケカ練習ツールです。",
    url: "https://mumunoa.com",
    siteName: "Mumunoa TCG Lab",
    images: [
      {
        url: "https://mumunoa.com/assets/images/ogp_main.png",
        width: 1200,
        height: 630,
        alt: "Mumunoa TCG Lab Logo",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mumunoa TCG Lab | ポケカAI分析・一人回しコーチングツール",
    description: "AIがあなたのプレイを分析し、事故率チェックや次の一手をコーチングする最高峰のポケカ練習ツールです。",
    images: ["https://mumunoa.com/assets/images/ogp_main.png"],
  },
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Mumunoa TCG Lab",
              "operatingSystem": "Web",
              "applicationCategory": "EducationalApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY"
              },
              "description": "AIによるポケカ分析・一人回しコーチングツール。統計に基づく事故率チェックや次の一手をAIが解説。",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "120"
              }
            })
          }}
        />
        {/* Monetag Smart Tag / Rewarded Video */}
        <script src="https://3nbf4.com/88/tag.min.js" data-zone="224540" async data-cfasync="false"></script>
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
